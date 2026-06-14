/**
 * 基于 Fetch + ReadableStream 的通用流式请求封装
 * 支持 GET/POST、请求头、Token、中断请求、分片回调、错误捕获
 */

import { useUserStore } from '@/store/modules/user'

// 流式请求配置选项
export interface StreamRequestOptions {
    /** 请求方法 */
    method?: 'GET' | 'POST'
    /** 请求头 */
    headers?: Record<string, string>
    /** 请求体数据 (POST 使用) */
    data?: Record<string, any> | string
    /** 超时时间 (毫秒) */
    timeout?: number
    /** 分片数据回调 (纯文本) */
    onChunk?: (chunk: string, isEnd: boolean) => void
    /** SSE 事件回调 (解析后的 JSON) */
    onSSEEvent?: (event: SSEEvent) => void
    /** 内容回调 (从 SSE 中提取 content) */
    onContent?: (content: string) => void
    /** 错误回调 */
    onError?: (error: StreamError) => void
    /** 请求完成回调 */
    onFinally?: () => void
    /** 是否携带 Token */
    withToken?: boolean
    /** 请求标识 (用于追踪) */
    requestId?: string
    /** 是否解析为纯文本流 (不使用 SSE 格式) */
    plainText?: boolean
}

// 流式错误类型
export interface StreamError {
    /** 错误码 */
    code: number
    /** 错误信息 */
    message: string
    /** 请求ID */
    requestId?: string
}

// 流式请求结果
export interface StreamResult {
    /** 请求是否成功 */
    success: boolean
    /** 完整的响应数据 */
    fullText: string
    /** 错误信息 (如有) */
    error?: StreamError
}

// SSE 事件类型
export interface SSEEvent {
    /** 事件类型 */
    type: 'start' | 'content' | 'end' | 'error'
    /** 内容 (仅 content 类型) */
    content?: string
    /** 会话ID */
    conversationId?: string
    /** 错误信息 */
    error?: string
}

// 默认配置
const DEFAULT_TIMEOUT = 60000 // 60秒超时
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json'
}
// 节流配置
const THROTTLE_DELAY = 50 // 节流延迟(毫秒)
const BUFFER_MIN_SIZE = 10 // 最小缓冲大小

/**
 * 创建流式请求实例
 */
class StreamRequest {
    private abortController: AbortController | null = null
    private timeoutId: number | null = null
    private fullText: string = ''
    private contentBuffer: string = ''
    private flushTimeoutId: number | null = null

    /**
     * 发送流式 GET 请求
     */
    async get(url: string, options: StreamRequestOptions = {}): Promise<StreamResult> {
        return this.request(url, { ...options, method: 'GET' })
    }

    /**
     * 发送流式 POST 请求
     */
    async post(url: string, options: StreamRequestOptions = {}): Promise<StreamResult> {
        return this.request(url, { ...options, method: 'POST' })
    }

    /**
     * 核心请求方法
     */
    async request(url: string, options: StreamRequestOptions = {}): Promise<StreamResult> {
        const {
            method = 'GET',
            headers = {},
            data,
            timeout = DEFAULT_TIMEOUT,
            onChunk,
            onSSEEvent,
            onContent,
            onError,
            onFinally,
            withToken = true,
            requestId,
            plainText = false
        } = options

        // 重置状态
        this.fullText = ''
        this.contentBuffer = ''
        this.cleanup()

        // 创建 AbortController
        this.abortController = new AbortController()

        try {
            // 构建请求头
            const requestHeaders: Record<string, string> = {
                ...DEFAULT_HEADERS,
                ...headers
            }

            // 添加 Token
            if (withToken) {
                const token = this.getToken()
                if (token) {
                    requestHeaders['Authorization'] = `Bearer ${token}`
                }
            }

            // 构建请求选项
            const fetchOptions: RequestInit = {
                method,
                headers: requestHeaders,
                signal: this.abortController.signal
            }

            // 处理请求体
            if (method === 'POST' && data) {
                fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data)
            }

            // 设置超时
            this.timeoutId = window.setTimeout(() => {
                this.abort()
            }, timeout)

            // 发送请求
            const response = await fetch(url, fetchOptions)

            // 清理超时
            this.cleanupTimeout()

            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text().catch(() => '请求失败')
                const error: StreamError = {
                    code: response.status,
                    message: errorText || `HTTP ${response.status}: ${response.statusText}`,
                    requestId
                }
                onError?.(error)
                return { success: false, fullText: this.fullText, error }
            }

            // 获取 Reader
            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('无法获取响应流')
            }

            // 获取编码器
            const decoder = new TextDecoder()

            // 读取流
            let done = false
            while (!done) {
                const { value, done: isDone } = await reader.read()
                done = isDone

                if (value) {
                    // 解码分片数据
                    const chunk = decoder.decode(value, { stream: !done })

                    // 回调原始分片
                    onChunk?.(chunk, done)

                    // 根据模式处理数据
                    if (plainText) {
                        // 纯文本模式：直接传递内容
                        this.fullText += chunk
                        onContent?.(chunk)
                    } else {
                        // SSE 模式：逐行解析
                        let buffer = chunk
                        const lines = buffer.split('\n')

                        for (const line of lines) {
                            const trimmedLine = line.trim()
                            
                            // 跳过空行
                            if (!trimmedLine) continue
                            
                            // 跳过非 data: 开头的行
                            if (!trimmedLine.startsWith('data:')) continue

                            // 提取 JSON 数据
                            const jsonStr = trimmedLine.slice(5).trim()
                            
                            // 跳过 [DONE] 标记
                            if (jsonStr === '[DONE]') {
                                done = true
                                continue
                            }
                            
                            // 跳过空数据
                            if (!jsonStr) continue

                            try {
                                const eventData = JSON.parse(jsonStr)
                                
                                // 解析事件类型
                                const event: SSEEvent = {
                                    type: eventData.type,
                                    content: eventData.content,
                                    conversationId: eventData.conversation_id || eventData.conversationId,
                                    error: eventData.error
                                }

                                // 回调 SSE 事件
                                onSSEEvent?.(event)

                                // 如果是内容事件，提取 content
                                if (event.type === 'content' && event.content) {
                                    this.fullText += event.content
                                    this.contentBuffer += event.content
                                    this.scheduleFlush(onContent)
                                }

                                // 如果是结束事件，设置 done
                                if (event.type === 'end') {
                                    done = true
                                }

                                // 如果是错误事件
                                if (event.type === 'error' || event.error) {
                                    const streamError: StreamError = {
                                        code: -1,
                                        message: event.error || 'SSE 错误',
                                        requestId
                                    }
                                    onError?.(streamError)
                                    done = true
                                }
                            } catch (parseError) {
                                console.warn('SSE JSON 解析失败:', jsonStr)
                            }
                        }
                    }
                }
            }

            // 确保最后剩余的内容被刷新
                    this.flushContent(onContent)

                    return { success: true, fullText: this.fullText }

        } catch (error: any) {
            // 清理资源
            this.cleanup()

            // 处理错误
            let errorMessage = '未知错误'
            let errorCode = -1

            if (error.name === 'AbortError') {
                errorMessage = '请求被中断'
                errorCode = 0
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = '网络错误，请检查网络连接'
                errorCode = -2
            } else {
                errorMessage = error.message || '请求失败'
                errorCode = -1
            }

            const streamError: StreamError = {
                code: errorCode,
                message: errorMessage,
                requestId
            }

            onError?.(streamError)

            return { success: false, fullText: this.fullText, error: streamError }

        } finally {
            onFinally?.()
            this.cleanup()
        }
    }

    /**
     * 中断当前请求
     */
    abort(): void {
        if (this.abortController) {
            this.abortController.abort()
            this.cleanup()
        }
    }

    /**
     * 从 Store 获取 Token
     */
    private getToken(): string | null {
        try {
            const userStore = useUserStore()
            return userStore.accessToken || null
        } catch {
            return null
        }
    }

    /**
     * 清理超时定时器
     */
    private cleanupTimeout(): void {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        this.cleanupTimeout()
        this.cleanupFlush()
        this.abortController = null
    }

    /**
     * 清理刷新定时器
     */
    private cleanupFlush(): void {
        if (this.flushTimeoutId !== null) {
            clearTimeout(this.flushTimeoutId)
            this.flushTimeoutId = null
        }
    }

    /**
     * 调度内容刷新（节流）
     */
    private scheduleFlush(callback?: (content: string) => void): void {
        // 如果缓冲足够大，立即刷新
        if (this.contentBuffer.length >= BUFFER_MIN_SIZE) {
            this.flushContent(callback)
            return
        }

        // 如果已有定时器，取消并重新设置
        this.cleanupFlush()
        this.flushTimeoutId = window.setTimeout(() => {
            this.flushContent(callback)
        }, THROTTLE_DELAY)
    }

    /**
     * 刷新缓冲内容
     */
    private flushContent(callback?: (content: string) => void): void {
        this.cleanupFlush()
        if (this.contentBuffer && callback) {
            const content = this.contentBuffer
            this.contentBuffer = ''
            callback(content)
        }
    }
}

// 导出单例
export const streamRequest = new StreamRequest()

// 导出便捷方法
export const streamGet = (
    url: string,
    options?: Omit<StreamRequestOptions, 'method'>
) => streamRequest.get(url, options)

export const streamPost = (
    url: string,
    options?: Omit<StreamRequestOptions, 'method'>
) => streamRequest.post(url, options)

/**
 * 创建新的流式请求实例 (用于并发请求)
 */
export const createStreamRequest = () => new StreamRequest()

export default streamRequest
