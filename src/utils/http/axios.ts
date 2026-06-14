/**
 * 基于 Axios 的封装，支持 RESTful 风格的 API 调用（GET/POST/PUT/DELETE）
 */
import axios from "axios"
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from "axios"
import { ApiStatus } from "./status"
import { router } from '@/router/index'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
// 常量定义
const REQUEST_TIMEOUT = 15000 // 请求超时时间(毫秒)
const { VITE_API_URL } = import.meta.env
// 创建axios实例
const service = axios.create({
    baseURL: VITE_API_URL,
    timeout: REQUEST_TIMEOUT,
})
// 添加请求拦截器
service.interceptors.request.use(
    (request: InternalAxiosRequestConfig) => {
        const { accessToken } = useUserStore()
        // 设置 token
        if (accessToken) {
            // Bearer 是一种用于 HTTP 认证的身份验证机制
            request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
        // 根据请求数据类型设置 Content-Type
        if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
            request.headers.set('Content-Type', 'application/json')
            request.data = JSON.stringify(request.data)
        }
        return request
    },
    (error) => {
        return Promise.reject(error)
    }
)
// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse<Api.Http.BaseResponse>) => {
        const res = response.data
        if (res.code !== ApiStatus.success) {
            // 处理业务状态码错误（如 403、500 等业务错误）
            const errorMsg = res.msg || 'Error'
            switch (res.code) {
                case 403:
                    ElMessage.error('没有权限访问该资源')
                    router.push('/exception/403')
                    break
                case 500:
                    ElMessage.error('服务器错误，请稍后重试')
                    router.push('/exception/500')
                    break
                default:
                    ElMessage.error(errorMsg)
            }
            return Promise.reject(new Error(errorMsg))
        }
        return res.data
    },
    (error) => {
        if (error.status === 401) {
            localStorage.clear()
            router.push({ name: 'Login' })
            ElMessage.error('登录信息过期，请重新登录')
        }
        return Promise.reject(error)
    }
)
// 请求函数
async function request<T = any>(config: AxiosRequestConfig): Promise<T> {
    // 对 POST | PUT  请求特殊处理
    if (config.method?.toUpperCase() === 'POST' ||
        config.method?.toUpperCase() === 'PUT' ||
        config.method?.toUpperCase() === 'DELETE') {
        if (config.params && !config.data) {
            config.data = config.params
            config.params = undefined
        }
    }
    const res = await service.request<Api.Http.BaseResponse<T>>(config)
    return res as T
}

// API 方法集合
const api = {
    get<T>(config: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...config, method: 'GET' })
    },
    post<T>(config: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...config, method: 'POST' })
    },
    put<T>(config: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...config, method: 'PUT' })
    },
    del<T>(config: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...config, method: 'DELETE' })
    },
    request<T>(config: AxiosRequestConfig): Promise<T> {
        return request<T>({ ...config })
    },
}

export default api