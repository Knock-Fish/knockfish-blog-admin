/**
 * HTTP 层统一出口
 * ------------------------------------------------------------------
 * 设计：用 axios 工厂（createHttpClient）按「服务注册表（services）」配置，
 * 为每个后端生成相互独立的请求客户端。所有客户端共用同一套拦截器
 * （token 注入 / {code,msg,data} 解包 / 401 处理），与具体后端无关。
 *
 * 当前已登记（按各后端「主技术栈」命名）：
 *   - springBootClient : 主后端（Spring Boot / Java）—— api/ 下各文件按具名导入使用
 *   - fastApiClient    : Agent 服务（FastAPI / Python），已与主后端统一信封
 *
 * 默认导出是「客户端集合」{ springBootClient, fastApiClient }（便于一次性取用）；
 * 业务代码推荐用具名导入，如 import { springBootClient } from '@/utils/http'。
 *
 * 新增一个后端：在 services.ts 登记一项 + 在此 createHttpClient 一次即可。
 */
export { createHttpClient } from './createClient'
export { services } from './services'
export type { HttpClient, HttpClientConfig } from './types'

import { createHttpClient } from './createClient'
import { services } from './services'

/** 主后端 HTTP 客户端 */
export const springBootClient = createHttpClient(services.springBoot)

/** Agent 服务HTTP 客户端 */
export const fastApiClient = createHttpClient(services.fastApi)

export default {
    springBootClient,
    fastApiClient
}

// 流式请求封装（Fetch + ReadableStream）保持独立出口
export * from './stream'
