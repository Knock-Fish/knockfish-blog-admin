import axios from "axios"
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from "axios"
import { ApiStatus } from "./status"
import { router } from '@/router/index'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const REQUEST_TIMEOUT = 15000
const { VITE_API_URL } = import.meta.env

interface CacheItem {
  data: any
  timestamp: number
  ttl: number
}

const requestCache = new Map<string, CacheItem>()
const pendingRequests = new Map<string, Promise<any>>()
const MAX_CACHE_SIZE = 100

let cleanupInterval: ReturnType<typeof setInterval>

const initCacheCleanup = () => {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    requestCache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        requestCache.delete(key)
      }
    })
    while (requestCache.size > MAX_CACHE_SIZE) {
      const firstKey = requestCache.keys().next().value
      if (firstKey) {
        requestCache.delete(firstKey)
      }
    }
  }, 60000)
}

initCacheCleanup()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }
    requestCache.clear()
    pendingRequests.clear()
  })
}

function generateCacheKey(config: AxiosRequestConfig): string {
  const method = config.method?.toUpperCase() || 'GET'
  const url = config.url || ''
  const params = config.params ? JSON.stringify(config.params) : ''
  const data = config.data && typeof config.data === 'object' ? JSON.stringify(config.data) : ''
  return `${method}_${url}_${params}_${data}`
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let inThrottle = false
  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

const service = axios.create({
    baseURL: VITE_API_URL,
    timeout: REQUEST_TIMEOUT,
})

service.interceptors.request.use(
    (request: InternalAxiosRequestConfig) => {
        const { accessToken } = useUserStore()
        if (accessToken) {
            request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
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

service.interceptors.response.use(
    (response: AxiosResponse<Api.Http.BaseResponse>) => {
        const res = response.data
        if (res.code !== ApiStatus.success) {
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

async function request<T = any>(config: AxiosRequestConfig & { cache?: boolean; ttl?: number }): Promise<T> {
    const { cache = false, ttl = 60000, ...axiosConfig } = config

    if (axiosConfig.method?.toUpperCase() === 'POST' ||
        axiosConfig.method?.toUpperCase() === 'PUT' ||
        axiosConfig.method?.toUpperCase() === 'DELETE') {
        if (axiosConfig.params && !axiosConfig.data) {
            axiosConfig.data = axiosConfig.params
            axiosConfig.params = undefined
        }
    }

    const cacheKey = generateCacheKey(axiosConfig)

    if (cache && axiosConfig.method?.toUpperCase() === 'GET') {
        const cached = requestCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data as T
        }
    }

    const pending = pendingRequests.get(cacheKey)
    if (pending) {
        return pending as Promise<T>
    }

    const requestPromise = service.request<Api.Http.BaseResponse<T>>(axiosConfig).then((data) => {
        if (cache && axiosConfig.method?.toUpperCase() === 'GET') {
            requestCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                ttl
            })
        }
        pendingRequests.delete(cacheKey)
        return data
    }).catch((error) => {
        pendingRequests.delete(cacheKey)
        throw error
    })

    pendingRequests.set(cacheKey, requestPromise)
    return requestPromise as Promise<T>
}

function clearCache(url?: string): void {
    if (url) {
        requestCache.forEach((_, key) => {
            if (key.includes(url)) {
                requestCache.delete(key)
            }
        })
    } else {
        requestCache.clear()
    }
}

const api = {
    get<T>(config: AxiosRequestConfig & { cache?: boolean; ttl?: number }): Promise<T> {
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
    request<T>(config: AxiosRequestConfig & { cache?: boolean; ttl?: number }): Promise<T> {
        return request<T>({ ...config })
    },
    clearCache
}

export { debounce, throttle, clearCache }
export default api