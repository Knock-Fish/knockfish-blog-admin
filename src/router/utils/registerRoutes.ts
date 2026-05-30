import type { Router } from 'vue-router'
import type { RouteRecordRaw } from "vue-router"
import { type AppRouteRecord } from '@/types'
/**
 * 注册异步路由
 * 将路由列表转换为 Vue Router 路由配置，并添加到传入的 router 实例中
 * @param router Vue Router 实例
 * @param routes 路由列表
 */
const modules: Record<string, () => Promise<any>> = import.meta.glob('../../views/**/*.vue')
export async function registerDynamicRoutes(router: Router, routes: AppRouteRecord[]) {
  const routesCopy = JSON.parse(JSON.stringify(routes)) as AppRouteRecord[]
  routesCopy.forEach(route => {
    const routeName = route.name as NonNullable<AppRouteRecord['name']>
    if (route.name && !router.hasRoute(routeName)) {
        const url = `../../views${route.component}/index.vue`
        route.component = modules[url]

      if (route.children && route.children.length > 0) {
        // 先注册父路由（挂到 Layout 下）
        router.addRoute(route as RouteRecordRaw)
        // 再注册子路由（挂到父路由名下）
        route.children.forEach(child => {
          const childUrl = `../../views${child.component}/index.vue`
          child.component = modules[childUrl]
          // 挂到父路由下，不是 Layout
          router.addRoute(routeName, child as RouteRecordRaw)
        })
      } else {
        // children 挂到 Layout 下
        router.addRoute('Layout', route as RouteRecordRaw)
      }
    }
  })
}