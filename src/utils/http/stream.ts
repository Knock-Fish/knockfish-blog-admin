/**
 * 流式请求封装（Fetch + ReadableStream）
 */
import { useUserStore } from '@/store/modules/user'
import { services } from './services'

/** 相对路径自动拼接 FastAPI 基础地址 */
const BASE_URL = services.fastApi.baseURL
const DEFAULT_TIMEOUT = 120_000

// 流式请求类型统一放在 ./types；此处再导出，历史 import 路径（@/utils/http/stream）保持不变
import type { SSEEvent, StreamError, StreamRequestOptions, StreamResult } from './types'
export type { SSEEvent, StreamError, StreamRequestOptions, StreamResult } from './types'

/* ================================ 工具 ================================ */

function getToken(): string | null {
    try {
        return useUserStore().accessToken || null
    } catch {
        return null
    }
}

/** 统一把异常转成 StreamError */
function toStreamError(err: unknown, requestId?: string): StreamError {
    const e = err as { name?: string; message?: string }
    if (e?.name === 'AbortError') return { code: 0, message: '请求已取消', requestId }
    if (err instanceof TypeError) return { code: -2, message: '网络错误，请检查网络连接', requestId }
    return { code: -1, message: e?.message || '请求失败', requestId }
}

/* ============================== 请求实例 ============================== */

/**
 * 创建流式请求实例（并发请求请各自创建，互不干扰）。
 * 单例见下方 streamRequest。
 */
export const createStreamRequest = () => {
    let controller: AbortController | null = null
    let timer: number | null = null

    const clearTimer = () => {
        if (timer !== null) {
            clearTimeout(timer)
            timer = null
        }
    }

    /** 中断当前请求 */
    const abort = () => {
        controller?.abort()
        controller = null
        clearTimer()
    }

    const run = async (
        url: string,
        options: StreamRequestOptions = {},
    ): Promise<StreamResult> => {
        const {
            method = 'GET', headers = {}, data, timeout = DEFAULT_TIMEOUT,
            onEvent, onToken, onContent, onDone, onRaw, onError, onHeaders, onFinally,
            withToken = true, requestId,
        } = options

        let fullText = ''
        controller = new AbortController()
        timer = window.setTimeout(abort, timeout)

        /** 收尾：清定时器 + 触发 onFinally */
        const finish = (result: StreamResult): StreamResult => {
            controller = null
            clearTimer()
            onFinally?.()
            return result
        }
        const fail = (error: StreamError): StreamResult => {
            onError?.(error)
            return finish({ success: false, fullText, error })
        }

        try {
            const token = withToken ? getToken() : null
            const res = await fetch(url.startsWith('http') ? url : BASE_URL + url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body:
                    method === 'POST' && data !== undefined
                        ? typeof data === 'string'
                            ? data
                            : JSON.stringify(data)
                        : undefined,
                signal: controller.signal,
            })
            clearTimer() // 超时只守护「到响应头返回」这一段，之后的长时间生成不计时

            if (!res.ok) {
                const text = await res.text().catch(() => '')
                return fail({
                    code: res.status,
                    message: text || `HTTP ${res.status} ${res.statusText}`,
                    requestId,
                })
            }
            onHeaders?.(res.headers)
            if (!res.body) return fail({ code: -1, message: '响应不包含可读流', requestId })

            // ---------------- 逐块读取 + 按行解析 ----------------
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = '' // 跨 chunk 保留的不完整行，避免事件被网络分片截断

            /** 处理一行；返回 true 表示收到 done / error，应停止读取 */
            const handleLine = (raw: string): boolean => {
                const line = raw.trim()
                if (!line.startsWith('data:')) return false
                const payload = line.slice(5).trim()
                if (!payload) return false
                onRaw?.(payload)

                if (payload === '[DONE]') {
                    // OpenAI 风格结束标记
                    onDone?.({ type: 'done' })
                    return true
                }

                let event: SSEEvent
                try {
                    event = JSON.parse(payload) as SSEEvent
                } catch {
                    console.warn('[stream] 无法解析的 SSE data 行:', payload)
                    return false
                }
                onEvent?.(event)

                if (typeof event.content === 'string' && event.content) {
                    fullText += event.content
                    onToken?.(event.content)
                    onContent?.(event.content)
                }

                if (event.type === 'done' || event.type === 'end') {
                    onDone?.(event)
                    return true
                }

                if (event.type === 'error' || event.error || event.message) {
                    const message =
                        event.message ||
                        (typeof event.error === 'string' ? event.error : '') ||
                        'SSE 错误'
                    onError?.({ code: -1, message, requestId })
                    return true
                }
                return false
            }

            /** 追加一段文本：完整行逐个处理，末尾半行留在 buffer；返回 true 表示应停止 */
            const push = (chunk: string): boolean => {
                buffer += chunk
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''
                for (const line of lines) {
                    if (handleLine(line)) return true
                }
                return false
            }

            let stopped = false
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                if (value && push(decoder.decode(value, { stream: true }))) {
                    stopped = true
                    break
                }
            }
            // 冲刷解码器残余字节，并处理末尾没有换行的那一行
            if (!stopped) {
                push(decoder.decode())
                if (buffer.trim()) push('\n')
            }

            return finish({ success: true, fullText })
        } catch (err) {
            return fail(toStreamError(err, requestId))
        }
    }

    return {
        get: (url: string, options: StreamRequestOptions = {}) =>
            run(url, { ...options, method: 'GET' }),
        post: (url: string, options: StreamRequestOptions = {}) =>
            run(url, { ...options, method: 'POST' }),
        request: (url: string, options: StreamRequestOptions = {}) => run(url, options),
        abort,
    }
}

/** 全局单例（简单场景直接用；并发/需独立中断时用 createStreamRequest） */
export const streamRequest = createStreamRequest()

export const streamGet = (url: string, options?: Omit<StreamRequestOptions, 'method'>) =>
    streamRequest.get(url, options)

export const streamPost = (url: string, options?: Omit<StreamRequestOptions, 'method'>) =>
    streamRequest.post(url, options)

export default streamRequest
