import type { App } from "vue"
import { createRouter, createWebHistory } from 'vue-router'
import { staticRoutes } from "./routes/staticRoutes"
import { setupBeforeEachGuard } from "./guards/beforeEach"
import { setupAfterEachGuard } from "./guards/afterEach"
// 创建路由实例
export const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes  // 静态路由
})
// 初始化路由
export function initRouter(app: App<Element>): void {
  setupBeforeEachGuard(router)
  setupAfterEachGuard(router)
  app.use(router)
}