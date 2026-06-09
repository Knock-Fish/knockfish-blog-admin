import type { Router, RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { RoutesAlias } from "@/router/routesAlias"
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { registerDynamicRoutes } from "@/router/utils/registerRoutes"
// 是否已注册动态路由
const isRouteRegistered = ref(false)
// 白名单路由（不需要登录即可访问）
const whiteList = ['/login', '/404', '/500']

/**
 * 设置路由全局前置守卫
 */

export function setupBeforeEachGuard(router: Router): void {
    router.beforeEach(
        async (
            to: RouteLocationNormalized,
            from: RouteLocationNormalized,
        ) => {
            try {
                return await handleRouterGuard(to, from, router)
            } catch (error) {
                console.error('路由守卫处理失败:', error)
                return '/400'
            }
        }
    )
}

/**
 * 处理路由守卫逻辑
 */
async function handleRouterGuard(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    router: Router
): Promise<boolean | string> {
    const userStore = useUserStore()
    const menuStore = useMenuStore()

    // 白名单直接放行
    if (whiteList.includes(to.path)) {
        return true
    }

    // 处理登录状态（如果未登录，返回登录页路径）
    const loginResult = await handleLoginStatus(to, userStore)
    if (loginResult !== true) {
        return loginResult
    }

    // 处理动态路由注册
    if (!isRouteRegistered.value && userStore.isLogin) {
        await handleDynamicRoutes(to, from, menuStore, router)
        return to.path
    }

    // 处理根路径跳转到首页
    if (userStore.isLogin && to.path === '/') {
        return RoutesAlias.Workbench
    }

    return true
}

/** 处理登录状态 */
async function handleLoginStatus(
    to: RouteLocationNormalized,
    userStore: ReturnType<typeof useUserStore>,
): Promise<boolean | string> {
    if (!userStore.isLogin && to.path !== RoutesAlias.Login) {
        userStore.logOut()
        return RoutesAlias.Login
    }
    return true
}

/** 处理动态路由 */
async function handleDynamicRoutes(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    menuStore: ReturnType<typeof useMenuStore>,
    router: Router
): Promise<boolean | RouteLocationRaw> {
    if (!isRouteRegistered.value) {
        const menuList = menuStore.menuList
        await registerDynamicRoutes(router, menuList)
        // 注册动态路由
        isRouteRegistered.value = true // 标记为已注册
        // 确保重定向的目标路径是已注册的路由
        const targetPath = to.matched.length > 0 ? to.path : RoutesAlias.Workbench
        router.addRoute({
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            redirect: RoutesAlias.Exception404
        })
        return { ...to, path: targetPath, replace: true }
    }
    return true
}
/** 重置路由相关状态 */
export function resetRouterState(): void {
    isRouteRegistered.value = false
    const menuStore = useMenuStore()
    menuStore.setMenuList([])
}