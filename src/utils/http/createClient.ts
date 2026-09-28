/**
 * axios 工厂，多后端 HTTP 客户端的统一创建入口
 */
import axios from 'axios'
import type {
    AxiosInstance,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from 'axios'
import { ApiStatus } from './status'
import { ElMessage } from 'element-plus'
import { router } from '@/router/index'
import type { HttpClient, HttpClientConfig } from './types'

/** 需要把 params 并入 data 的请求方法*/
const BODY_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

export function createHttpClient(config: HttpClientConfig): HttpClient {
    const { baseURL, timeout = 15000, getToken, headers } = config
    // 创建axios实例
    const service: AxiosInstance = axios.create({
        baseURL,
        timeout,
    })

    // 添加请求拦截器
    service.interceptors.request.use(
        (request: InternalAxiosRequestConfig) => {
            const token = getToken?.()
            // 设置 token
            if (token) {
                // Bearer 是一种用于 HTTP 认证的身份验证机制
                request.headers.set('Authorization', `Bearer ${token}`)
            }
            // 固定附加头（如服务登记的 headers）
            if (headers) {
                for (const [k, v] of Object.entries(headers)) {
                    request.headers.set(k, v)
                }
            }
            // 非 FormData 且未显式声明 Content-Type 时，默认 JSON 序列化
            if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
                request.headers.set('Content-Type', 'application/json')
                request.data = JSON.stringify(request.data)
            }
            return request
        },
        (error) => Promise.reject(error),
    )

    // 响应拦截器==
    service.interceptors.response.use(
        (response: AxiosResponse<Api.Http.BaseResponse>) => {
            const res = response.data
            // 业务码非成功即视为失败
            if (res.code !== ApiStatus.success) {
                return Promise.reject(new Error(res.msg || 'Error'))
            }
            // 解包：调用方直接拿到 data 载荷
            return res.data
        },
        (error) => {
            if (error.status === 401) {
                localStorage.clear()
                router.push({ name: 'Login' })
                ElMessage.error('登录信息过期，请重新登录')
            }
            return Promise.reject(error)
        },
    )

    // 请求函数
    async function request<T = any>(reqConfig: AxiosRequestConfig): Promise<T> {
        // POST | PUT | DELETE | PATCH：若只传了 params，并入 data
        if (BODY_METHODS.has((reqConfig.method ?? '').toUpperCase()) &&
            reqConfig.params && !reqConfig.data) {
            reqConfig.data = reqConfig.params
            reqConfig.params = undefined
        }
        const res = await service.request<Api.Http.BaseResponse<T>>(reqConfig)
        return res as T
    }

    return {
        service,
        get<T>(config: AxiosRequestConfig) {
            return request<T>({ ...config, method: 'GET' })
        },
        post<T>(config: AxiosRequestConfig) {
            return request<T>({ ...config, method: 'POST' })
        },
        put<T>(config: AxiosRequestConfig) {
            return request<T>({ ...config, method: 'PUT' })
        },
        patch<T>(config: AxiosRequestConfig) {
            return request<T>({ ...config, method: 'PATCH' })
        },
        del<T>(config: AxiosRequestConfig) {
            return request<T>({ ...config, method: 'DELETE' })
        },
        request<T>(config: AxiosRequestConfig): Promise<T> {
            return request<T>({ ...config })
        }
    }
}
