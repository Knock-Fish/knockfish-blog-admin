/**
 * 在 chat-ai 的 Markdown 渲染中支持 ```mermaid 代码块
 *
 * 1. 通过 marked 的自定义 code renderer，把 ```mermaid 代码块拦截为占位容器
 *    （而非默认的 <pre><code>），避免源码被当作普通代码展示。
 * 2. 占位容器用 data-raw 存转义后的源码，渲染成功后整体替换为 mermaid 生成的 SVG。
 * 3. mermaid 采用动态 import，配合 Vite 自动代码分割；只有真正出现 mermaid
 *    块时才会加载（主包 1MB+，不进首屏）。
 * 4. 流式输出期间不渲染（由调用方传入 isStreaming 控制），避免半成品语法反复报错闪烁。
 */
import { h, render as vueRender, type VNode } from 'vue'
import { marked, type Tokens } from 'marked'
import MermaidViewer from '../MermaidViewer.vue'

// 一次性注册 mermaid 的自定义 code renderer（全局 marked 单例，幂等）
let rendererRegistered = false

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
    return escapeHtml(str).replace(/"/g, '&quot;')
}

export function registerMermaidRenderer(): void {
    if (rendererRegistered) return
    rendererRegistered = true

    marked.use({
        renderer: {
            code(token: Tokens.Code): string {
                const lang = (token.lang || '').trim().split(/\s+/)[0]
                const raw = token.text.replace(/\n+$/, '')

                // mermaid 块：输出占位容器，稍后由 renderMermaidBlocks 渲染成 SVG
                if (lang === 'mermaid') {
                    return (
                        `<div class="mermaid-block" data-raw="${escapeAttr(raw)}">` +
                        `<pre class="mermaid-source">${escapeHtml(raw)}</pre>` +
                        `</div>`
                    )
                }

                // 其它代码块：保持默认行为，但确保正确转义
                const escaped = token.escaped ? token.text : escapeHtml(token.text)
                const cls = lang ? ` class="language-${lang}"` : ''
                return `<pre><code${cls}>${escaped}</code></pre>`
            },
        },
    })
}

// mermaid 懒加载（动态 import + 单次 initialize）
type MermaidApi = typeof import('mermaid')['default']

let mermaidModule: MermaidApi | null = null
let mermaidPromise: Promise<MermaidApi> | null = null
let mermaidSeq = 0

export function getMermaid(): Promise<MermaidApi> {
    if (mermaidModule) return Promise.resolve(mermaidModule)
    if (!mermaidPromise) {
        mermaidPromise = import('mermaid').then((mod) => {
            const m = mod.default
            m.initialize({
                startOnLoad: false, // 手动控制渲染时机
                theme: 'neutral', // 适配浅色气泡背景
                securityLevel: 'strict', // 安全默认值，不开放 HTML 注入
                fontFamily: 'inherit',
                // 渲染失败时不要把 “Syntax error in text” 错误横幅插入 <body>，只抛异常走降级
                suppressErrorRendering: true,
            })
            mermaidModule = m
            return m
        })
    }
    return mermaidPromise
}

/**
 * 预加载 mermaid 主包（1MB+）。在页面空闲时调用，使首条图表无需等待 chunk 加载。
 * 失败静默忽略（首条 mermaid 渲染时会自然重试）。
 */
export function preloadMermaid(): void {
    getMermaid().catch((e) => console.warn('[mermaid] 预加载失败:', e))
}


/**
 * SVG 渲染结果缓存（LRU，按 源码+主题 作为键）。
 * Bubble 的 v-html 是全文重写的：流式更新、重复挂载都会用同一段源码再次渲染，
 * 而 mermaid.render 是最昂贵的一步（语法解析 + 布局计算）。
 * 缓存后可直接复用 SVG 字符串，把重复成本压到几乎为零。
 * 同一版本同一配置下 code+theme 决定唯一的 SVG，结果可安全复用。
 */
const SVG_CACHE_LIMIT = 50
const svgCache = new Map<string, string>()

function readSvgCache(key: string): string | undefined {
    if (!svgCache.has(key)) return undefined
    const hit = svgCache.get(key) as string
    svgCache.delete(key)
    svgCache.set(key, hit) // 命中后提到队尾，维持 LRU 顺序
    return hit
}

function writeSvgCache(key: string, value: string): void {
    svgCache.set(key, value)
    while (svgCache.size > SVG_CACHE_LIMIT) {
        const oldest = svgCache.keys().next().value
        if (oldest === undefined) break
        svgCache.delete(oldest)
    }
}

/**
 * 全局串行渲染队列。mermaid.render 是 CPU 密集型操作，
 * 多个气泡 / 多个图表同时渲染会互相争抢主线程造成掉帧；
 * 串行后总耗时相近，但每段之间主线程有喘息，滚动与输入更跟手
 */
let renderChain: Promise<unknown> = Promise.resolve()

function enqueueRender<T>(task: () => Promise<T>): Promise<T> {
    const run = () => task()
    const result = renderChain.then(run, run) // 前序无论成败都继续执行
    renderChain = result.then(
        () => undefined,
        () => undefined,
    )
    return result
}

/** 让出一帧给浏览器：连续渲染多个图表时不长时间阻塞 UI */
const yieldToUi = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0))

/** 实际调用 mermaid 渲染单个图（不含缓存与队列，供内部使用） */
async function renderOnce(code: string, theme: 'neutral' | 'dark'): Promise<string> {
    const mermaid = await getMermaid()
    const id = `mermaid-${Date.now()}-${mermaidSeq++}`
    const themed = theme === 'dark' ? `%%{init: {"theme":"dark"}}%%\n${code}` : code
    try {
        const { svg } = await mermaid.render(id, themed)
        return svg
    } finally {
        // 清理 mermaid 在 <body> 上的临时容器，防止残留
        document.getElementById('d' + id)?.remove()
    }
}

/**
 * 把一段 mermaid 源码渲染为 SVG 字符串（供 MermaidViewer 主题切换等场景复用）。
 * 主题通过 %%{init}%% 指令做单图覆盖，不影响全局 initialize 配置。
 * 命中缓存则直接返回，否则进入串行队列渲染。
 */
export async function renderMermaidToSvg(
    code: string,
    theme: 'neutral' | 'dark' = 'neutral',
): Promise<string> {
    const key = `${theme}\u0000${code}`

    const hit = readSvgCache(key)
    if (hit !== undefined) return hit

    return enqueueRender(async () => {
        // 排队期间可能已被前序任务填充（多图表同一段源码的场景）
        const queuedHit = readSvgCache(key)
        if (queuedHit !== undefined) return queuedHit
        const svg = await renderOnce(code, theme)
        writeSvgCache(key, svg)
        return svg
    })
}

// 查看器挂载登记表（用于卸载回收，防止内存泄漏）
/**
 * 手动 vueRender 挂到 v-html DOM 上的组件树不由父组件管理：
 * Bubble 卸载或 v-html 重写时不会被自动卸载，MermaidViewer 的 onUnmounted 也不会触发，
 * 于是 document/window 上的事件监听与整个 SVG DOM 会一直残留。
 * 这里登记每个挂载点，配合下面的回收函数保证组件树能被正常卸载。
 */
const mountedViewers = new Map<HTMLElement, VNode>()

/** 卸载单个挂载点上的查看器（触发组件树的 onUnmounted，移除事件监听） */
function unmountViewer(el: HTMLElement): void {
    if (!mountedViewers.has(el)) return
    mountedViewers.delete(el)
    vueRender(null, el)
}

/** 卸载某个容器（含容器自身）内的所有查看器：Bubble 卸载时显式调用 */
export function unmountViewersIn(root: HTMLElement | null | undefined): void {
    if (!root) return
    for (const el of Array.from(mountedViewers.keys())) {
        if (el === root || root.contains(el)) unmountViewer(el)
    }
}

/** 机会性回收：容器已被移出文档的查看器（v-html 重写会静默丢弃旧节点） */
function unmountDetachedViewers(): void {
    for (const el of Array.from(mountedViewers.keys())) {
        if (!el.isConnected) unmountViewer(el)
    }
}

// 扫描并渲染某个容器内的所有 mermaid 占位块
export async function renderMermaidBlocks(
    root: HTMLElement | null | undefined,
): Promise<void> {
    if (!root) return

    // 先回收上一轮被 v-html 重写丢弃的挂载点，避免组件实例与监听器残留
    unmountDetachedViewers()

    const blocks = Array.from(root.querySelectorAll<HTMLElement>('.mermaid-block'))
    if (blocks.length === 0) return

    for (const el of blocks) {
        // 已渲染过的块跳过（防止 v-html 重渲染后重复渲染）
        if (el.dataset.rendered === 'true') continue

        const code = (el.dataset.raw ?? '').trim()
        if (!code) {
            el.dataset.rendered = 'true'
            continue
        }

        try {
            const svg = await renderMermaidToSvg(code)
            // 挂载带工具栏的交互查看器（代码/图表 Tab、主题切换、缩放、下载）
            unmountViewer(el) // 重复渲染时先卸载旧实例，避免重复登记
            el.innerHTML = ''
            const vnode = h(MermaidViewer, { code, svg })
            vueRender(vnode, el)
            mountedViewers.set(el, vnode) // 登记挂载点，供后续回收
            el.dataset.rendered = 'true'
            await yieldToUi() // 让出一帧，避免多图表连续渲染时长时间阻塞 UI
        } catch (err) {
            // 语法错误：回退为源码展示（带错误样式），并标记为已处理避免重试
            unmountViewer(el)
            el.dataset.rendered = 'true'
            el.innerHTML = `<pre class="mermaid-error">${escapeHtml(el.dataset.raw ?? '')}</pre>`
            console.warn('[mermaid] 渲染失败（语法错误？）:', err)
        }
    }
}
