import type { Router, RouteLocationNormalized } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3,
})

/**
 * 设置路由全局后置守卫
 */
export function setupAfterEachGuard(router: Router): void {
    router.afterEach(
        (
            to: RouteLocationNormalized,
            from: RouteLocationNormalized,
        ) => {
            NProgress.done()
        }
    )
}
