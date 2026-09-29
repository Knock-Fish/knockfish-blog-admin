<template>
    <div ref="rootRef" class="mermaid-viewer">
        <!-- 工具栏 -->
        <div class="viewer-toolbar">
            <div class="toolbar-tabs">
                <button class="tab" :class="{ active: tab === 'code' }" @click="tab = 'code'">代码</button>
                <button class="tab" :class="{ active: tab === 'chart' }" @click="tab = 'chart'">图表</button>
            </div>
            <div class="toolbar-actions">
                <button class="action-btn" :title="dark ? '切换亮色主题' : '切换暗色主题'" @click="toggleTheme">
                    <SvgIcon :icon="dark ? 'mdi:weather-sunny' : 'mdi:weather-night'" size="18px" />
                </button>
                <button class="action-btn" title="放大" @click="zoomIn">
                    <SvgIcon icon="mdi:magnify-plus-outline" size="18px" />
                </button>
                <button class="action-btn" title="缩小" @click="zoomOut">
                    <SvgIcon icon="mdi:magnify-minus-outline" size="18px" />
                </button>
                <button class="action-btn" title="适应页面（居中并完整显示）" @click="fitView">
                    <SvgIcon icon="mdi:aspect-ratio" size="18px" />
                    <span>适应</span>
                </button>
                <span class="toolbar-divider" />
                <button class="action-btn" title="下载 SVG" @click="downloadSvg">
                    <SvgIcon icon="mdi:download-outline" size="18px" />
                    <span>下载</span>
                </button>
                <button class="action-btn" :title="isFs ? '退出全屏' : '全屏查看'" @click="toggleFullscreen">
                    <SvgIcon :icon="isFs ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" size="18px" />
                </button>
            </div>
        </div>

        <!-- 内容区 -->
        <div class="viewer-body">
            <div
                v-show="tab === 'chart'"
                ref="chartPaneRef"
                class="chart-pane"
                :class="{ dragging }"
                @pointerdown="onDragStart"
                @wheel="onWheel"
                @dblclick="resetView">
                <!-- transform 同时承担缩放与拖动位移：translate 单位为屏幕像素，与缩放无关，拖动手感 1:1 -->
                <div ref="chartInnerRef" class="chart-inner" :style="innerStyle" v-html="currentSvg"></div>
            </div>
            <pre v-show="tab === 'code'" class="code-pane">{{ code }}</pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { renderMermaidToSvg } from './composables/useMermaid'

const props = defineProps<{
    /** mermaid 源码（代码 Tab 展示 + 主题切换重渲染用） */
    code: string
    /** 初始渲染好的 SVG 字符串 */
    svg: string
}>()

const tab = ref<'chart' | 'code'>('chart')
const dark = ref(false)
const zoom = ref(1)
const currentSvg = ref(props.svg)
const rootRef = ref<HTMLElement>()
const chartPaneRef = ref<HTMLElement>()
const chartInnerRef = ref<HTMLElement>()
const isFs = ref(false)

// 拖动平移（pan）状态
const panX = ref(0)
const panY = ref(0)
const dragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0

const ZOOM_MIN = 0.2
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

// 缩放 + 平移合并到一条 transform；配合 CSS 的 transform-origin: 0 0，
// 屏幕点 = pan + z * 内容点（内容是绝对定位的，布局不参与居中，居中完全由 pan 决定）
const innerStyle = computed(() => ({
    transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
}))

/** 适应时的四周留白 */
const FIT_PADDING = 16

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 1000) / 1000))

/**
 * 以面板内某点为锚点缩放：保持锚点下的内容不动。
 * 推导（origin 0 0）：点 p 屏幕位置 = pan + z * p，令锚点 s 处内容不变则
 * pan1 = pan0 - (z1 - z0) * (s - pan0) / z0。
 */
function setZoomAt(z1: number, sX: number, sY: number) {
    const z0 = zoom.value
    const next = clampZoom(z1)
    if (next === z0) return
    panX.value = panX.value - ((next - z0) * (sX - panX.value)) / z0
    panY.value = panY.value - ((next - z0) * (sY - panY.value)) / z0
    zoom.value = next
}

/** 按钮放大/缩小：以面板中心为锚点 */
function zoomIn() {
    const pane = chartPaneRef.value
    if (!pane) return
    setZoomAt(zoom.value + ZOOM_STEP, pane.clientWidth / 2, pane.clientHeight / 2)
}

function zoomOut() {
    const pane = chartPaneRef.value
    if (!pane) return
    setZoomAt(zoom.value - ZOOM_STEP, pane.clientWidth / 2, pane.clientHeight / 2)
}

/** 双击图表区：重新适应并居中 */
function resetView() {
    fitView()
}

/**
 * 规范化 mermaid 输出的 SVG：统一为确定的 px 尺寸。
 * mermaid 生成的 svg 往往是 width="100%"（或只有 viewBox + 内联 max-width），
 * 在自适应宽度的 flex 容器里会形成循环依赖，导致布局塌陷成 0 尺寸（图表全空白）。
 * 这里从 viewBox 取原始宽高，写回确定的 width/height 属性，并清掉内联 max-width。
 */
function normalizeSvg(): { w: number; h: number } | null {
    const svg = chartInnerRef.value?.querySelector('svg')
    if (!svg) return null

    const vb = (svg.getAttribute('viewBox') ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number)
    const vbW = vb[2] ?? 0
    const vbH = vb[3] ?? 0
    const hasVb = vb.length === 4 && vb.every((n) => Number.isFinite(n)) && vbW > 0 && vbH > 0

    const num = (v: string | null) => {
        if (!v || v.includes('%')) return 0 // width="100%" 之类百分比不算确定尺寸
        const n = parseFloat(v)
        return Number.isFinite(n) ? n : 0
    }
    let w = num(svg.getAttribute('width'))
    let h = num(svg.getAttribute('height'))
    if (hasVb) {
        if (!w) w = vbW
        if (!h) h = vbH
    }
    if (!w || !h) return null

    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))
    svg.style.maxWidth = '' // mermaid 的内联 max-width 会干扰尺寸计算，交给 transform 统一缩放
    return { w, h }
}

/**
 * 适应页面：根据当前容器尺寸与 SVG 原始尺寸自动计算缩放，使图表完整居中显示。
 * 普通态适配 400px 框；全屏态适配整屏。
 */
function fitView() {
    const pane = chartPaneRef.value
    if (!pane) return
    const size = normalizeSvg()
    if (!size) return

    const pw = pane.clientWidth
    const ph = pane.clientHeight
    if (pw <= 0 || ph <= 0) return

    // 完整放入且不放大（放大只会模糊）
    const z = clampZoom(
        Math.min((pw - FIT_PADDING * 2) / size.w, (ph - FIT_PADDING * 2) / size.h, 1),
    )
    zoom.value = z
    // 显式居中：内容视觉尺寸为 w*z / h*z，把剩余空间均分到两侧（负值即两侧均匀溢出）
    panX.value = (pw - size.w * z) / 2
    panY.value = (ph - size.h * z) / 2
}

/** 指针按下：开始拖动，监听 window 的 move/up 以兼容拖出元素 */
function onDragStart(e: PointerEvent) {
    if (e.button !== 0) return // 仅左键
    dragging.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragOriginX = panX.value
    dragOriginY = panY.value
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
}

function onDragMove(e: PointerEvent) {
    if (!dragging.value) return
    panX.value = dragOriginX + (e.clientX - dragStartX)
    panY.value = dragOriginY + (e.clientY - dragStartY)
}

function onDragEnd() {
    dragging.value = false
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
}

/**
 * 滚轮缩放（仅全屏下启用）：向上滚放大、向下滚缩小，围绕光标位置缩放并保持光标下的点不动。
 * 非全屏时不做任何处理（也不拦截默认行为），滚轮事件冒泡给页面，页面正常上下滚动。
 */
function onWheel(e: WheelEvent) {
    if (!isFs.value) return
    e.preventDefault() // 全屏下禁用默认滚动，改为缩放

    const pane = e.currentTarget as HTMLElement
    const rect = pane.getBoundingClientRect()
    setZoomAt(zoom.value + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), e.clientX - rect.left, e.clientY - rect.top)
}

/** 切换暗/亮主题：用 %%{init}%% 指令做单图主题覆盖重渲染，不影响全局配置 */
async function toggleTheme() {
    dark.value = !dark.value
    try {
        currentSvg.value = await renderMermaidToSvg(props.code, dark.value ? 'dark' : 'neutral')
        nextTick(() => fitView()) // 新 SVG 节点需要重新规范化尺寸并适配
    } catch (e) {
        console.warn('[mermaid] 主题切换重渲染失败:', e)
    }
}

/** 下载当前 SVG */
function downloadSvg() {
    const blob = new Blob([currentSvg.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mermaid-${Date.now()}.svg`
    a.click()
    URL.revokeObjectURL(url)
}

/** 全屏切换：用 Fullscreen API 把整个查看器卡片铺满屏幕 */
function toggleFullscreen() {
    const el = rootRef.value
    if (!el) return
    if (document.fullscreenElement) {
        document.exitFullscreen()
    } else {
        el.requestFullscreen?.()
    }
}

/** 同步全屏状态（ESC 退出时也要更新图标），切换尺寸后重新适应 */
function onFsChange() {
    isFs.value = document.fullscreenElement === rootRef.value
    nextTick(() => fitView())
}

// 切回图表 Tab 时重新适配（隐藏状态下量不到容器尺寸，可能从未完成过 fit）
watch(tab, (t) => {
    if (t === 'chart') nextTick(() => fitView())
})

onMounted(() => {
    document.addEventListener('fullscreenchange', onFsChange)
    // 首次挂载后用 nextTick 等布局稳定，自动把图表居中并完整显示
    nextTick(() => fitView())
})

onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFsChange)
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    if (document.fullscreenElement === rootRef.value) {
        document.exitFullscreen().catch(() => {})
    }
})
</script>

<style lang="scss" scoped>
.mermaid-viewer {
    width: 100%; // 卡片宽度跟随父容器（气泡）铺满
    max-width: 100%;
    min-width: 0; // 允许收缩，避免被内容（原始 SVG 宽度）顶宽而溢出父容器
    box-sizing: border-box;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
}

// 工具栏
.viewer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.toolbar-tabs {
    display: flex;
    gap: 4px;
}

.tab {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: #666;
    padding: 4px 12px;
    border-radius: 6px;
    transition: all 0.15s;

    &:hover {
        color: #333;
    }

    &.active {
        background: #ececee;
        color: #1f2329;
        font-weight: 500;
    }
}

.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 2px;
}

.action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #5f6672;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 13px;
    transition: all 0.15s;

    &:hover {
        background: #f2f3f5;
        color: #1f2329;
    }
}

.toolbar-divider {
    width: 1px;
    height: 16px;
    background: #e5e7eb;
    margin: 0 6px;
}

// 内容区
.viewer-body {
    background: #fff;
}

.chart-pane {
    position: relative; // 作为 chart-inner 绝对定位的包含块（padding box）
    height: 400px; // 固定高度：无论图表大小，卡片高度恒定
    width: 100%;
    min-width: 0; // 解除 flex/块级最小宽度限制，防止内容顶宽溢出
    overflow: hidden; // 图表完整显示由「适应」保证；超大内容靠拖动/缩放查看。
    // 用 hidden 而非 auto：不产生可滚动区域，滚轮事件得以冒泡给页面（非全屏可正常上下滚动）
    cursor: grab; // 提示可拖动
    user-select: none; // 拖动时不选中文本/SVG
    touch-action: none; // 触屏拖动不触发页面滚动

    &.dragging {
        cursor: grabbing;
    }

    :deep(svg) {
        max-width: none; // 关闭 max-width，SVG 以原始尺寸渲染，由 transform 统一缩放/适配
        width: auto;
        height: auto;
        display: block;
        pointer-events: none; // 让指针事件落到 chart-pane 上，便于拖拽
    }
}

// 缩放与居中完全由脚本计算（translate + scale），布局不参与居中，避免内容大于容器时静默溢出
.chart-inner {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
}

// 仅在交互（拖动 / 全屏缩放）期间提升图层。
// 常驻 will-change 会让每个图表都占用一个 GPU 合成层，长对话下显存与层树成本明显。
.chart-pane.dragging .chart-inner,
.mermaid-viewer:fullscreen .chart-inner {
    will-change: transform;
}

.code-pane {
    margin: 0;
    padding: 14px 16px;
    max-height: 70vh;
    overflow: auto;
    scrollbar-width: none; // Firefox：隐藏滚动条
    background: #454545;
    color: #fff;
    font-size: 13px;
    line-height: 1.6;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;

    &::-webkit-scrollbar {
        display: none; // Chrome/Edge/Safari：隐藏滚动条
    }
}

// 全屏模式：卡片铺满屏幕，内容区占满剩余高度
.mermaid-viewer:fullscreen {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;

    .viewer-body {
        flex: 1;
        min-height: 0;
        display: flex;
    }

    .chart-pane,
    .code-pane {
        max-height: none;
        height: auto; // 全屏下解除固定高度，跟随 flex 铺满
        flex: 1;
        width: 100%;
    }
}
</style>
