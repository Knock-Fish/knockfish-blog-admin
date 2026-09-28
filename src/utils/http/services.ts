/**
 * 多后端服务注册表
 * 项目当前有两类后端（按各后端「主技术栈」命名，与 index.ts 暴露的客户端名一一对应）：
 *   1. springBoot —— 主后端（Spring Boot / Java）：业务、鉴权、文章等常规接口
 *   2. fastApi    —— Agent 服务（FastAPI / Python，博客问答）：已与主后端统一 {code,msg,data} 信封
 *
 * 各服务在此登记「基础地址 / 超时 / 取 token 方式」，createHttpClient 据此
 * 生成相互独立的 axios 实例。新增一个后端只需：
 *   (1) 在 .env(.development/.production) 增加 VITE_XXX_URL
 *   (2) 在 env.d.ts 补类型声明
 *   (3) 在此 services 增加一项
 *   (4) 在 index.ts 用 createHttpClient(...) 暴露一个客户端
 */
import { useUserStore } from '@/store/modules/user'
import type { HttpClientConfig } from './types'

/** 统一 token 读取：优先 Pinia 用户态，越界（如初始化阶段）则回退 null */
const getToken = (): string | null => {
    try {
        return useUserStore().accessToken || null
    } catch {
        return null
    }
}

export const services = {
    /** 主后端 */
    springBoot: {
        baseURL: import.meta.env.VITE_API_URL,
        timeout: 15000,
        getToken,
    },
    /** Agent 服务 */
    fastApi: {
        baseURL: import.meta.env.VITE_AGENT_URL || '',
        timeout: 60000,
        getToken,
    },
} satisfies Record<string, HttpClientConfig>

/** 已登记的服务名，便于按需取配置（如 stream.ts 复用 fastApi 地址） */
export type ServiceName = keyof typeof services
