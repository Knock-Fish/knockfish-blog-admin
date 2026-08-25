import type { RouteRecordRaw } from "vue-router"
import { type AppRouteRecord } from '@/types'
type Permission = Api.Permission.PermissionInfo

/**
 * 【核心】权限数组 转换为  Vue 动态路由表
 * @param permissions 后端返回的权限列表
 */
const modules: Record<string, () => Promise<any>> = import.meta.glob('../../views/**/*.vue')
export function buildDynamicRoutes(permissions: Permission[]): AppRouteRecord[] {
  // 1. 过滤出【页面路由】：type=MENU 且有 component
  const routePermissions = permissions.filter(
    p => p.type === "menu" && p.component && p.path && p.routeName
  )
  // 2. 转换成路由结构
  const routes = routePermissions.map(p => {
    let url = `../../views${p.component}/index.vue`
    const route: AppRouteRecord = {
      path: p.path!,
      name: p.routeName!,
      component: modules[url]!,
      meta: {
        title: p.permissionName,
        icon: p.icon || undefined,
        permissionCode: p.permissionCode
      }
    }
    return route
  })
  return routes
}