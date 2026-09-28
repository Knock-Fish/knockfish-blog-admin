/**
 * HTTP 层类型契约
 * ------------------------------------------------------------------
 * 集中两类定义，避免类型散落在各个实现文件里：
 *   1. axios 工厂契约：HttpClientConfig（输入）/ HttpClient（输出）
 *   2. 流式请求（SSE）契约：StreamError / SSEEvent / StreamRequestOptions / StreamResult
 * 两者都与具体业务/后端无关，便于多后端复用与测试。
 *
 * 注：流式类型由 stream.ts 再导出，因此历史 import 路径（@/utils/http/stream）不受影响。
 */
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

/** 单服务配置：工厂据此创建一个相互独立的 axios 实例 */
export interface HttpClientConfig {
    /** 服务基础地址（必填），如 http://localhost:8000 或 /agent */
    baseURL: string
    /** 请求超时（ms），缺省 15000 */
    timeout?: number
    /** 取鉴权 token：返回空串/null 则不携带 Authorization；可按服务覆盖 */
    getToken?: () => string | null
    /** 固定附加请求头（如固定 channel、client 等） */
    headers?: Record<string, string>
}

/**
 * 统一 HTTP 客户端接口。
 * 方法集与历史全局 request 完全一致（get/post/put/patch/del/request），
 * 因此旧 api 文件无需改动调用方式即可接入。
 * 多出来的 instance 便于需要裸 AxiosInstance 的高级用法。
 */
export interface HttpClient {
    /** 底层 axios 实例 */
    service: AxiosInstance
    get<T = any>(config: AxiosRequestConfig): Promise<T>
    post<T = any>(config: AxiosRequestConfig): Promise<T>
    put<T = any>(config: AxiosRequestConfig): Promise<T>
    patch<T = any>(config: AxiosRequestConfig): Promise<T>
    del<T = any>(config: AxiosRequestConfig): Promise<T>
    request<T = any>(config: AxiosRequestConfig): Promise<T>
}

/* ==================== 流式请求（SSE）类型 ==================== */

export interface StreamError {
    /** HTTP 状态码；内部错误用负数：0=已取消，-1=业务/未知，-2=网络错误 */
    code: number
    message: string
    requestId?: string
}

/** SSE 事件。type 为 string 以兼容后端字段演进 */
export interface SSEEvent {
    type: string
    /** token 事件：增量文本 */
    content?: string
    /** error 事件：错误信息 */
    message?: string
    /** done 事件：会话 ID（后端驼峰） */
    threadId?: string
    [key: string]: unknown
}

export interface StreamRequestOptions {
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    /** POST 请求体，对象会自动 JSON 序列化 */
    data?: Record<string, unknown> | string
    /** 超时（毫秒），守护到响应头返回为止，默认 120000 */
    timeout?: number
    /** 每个解析后的事件 */
    onEvent?: (event: SSEEvent) => void
    /** 增量文本；与 onContent 同义（保留旧名），两者都会触发 */
    onToken?: (content: string) => void
    onContent?: (content: string) => void
    /** 收到 done / [DONE] 时触发（event 携带 threadId） */
    onDone?: (event: SSEEvent) => void
    /** 未解析的 data 原文 */
    onRaw?: (raw: string) => void
    /** HTTP 错误 / SSE error 事件 / 网络错误 / 取消 */
    onError?: (error: StreamError) => void
    onHeaders?: (headers: Headers) => void
    /** 无论成败都会触发 */
    onFinally?: () => void
    /** 是否自动携带 Bearer Token，默认 true */
    withToken?: boolean
    requestId?: string
}

export interface StreamResult {
    success: boolean
    /** 累积的 token 文本 */
    fullText: string
    error?: StreamError
}
