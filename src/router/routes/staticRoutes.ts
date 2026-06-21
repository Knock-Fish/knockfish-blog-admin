import { type RouteRecordRaw } from 'vue-router'
import { RoutesAlias } from '../routesAlias'
/**
 * 静态路由配置
 */
export const staticRoutes: RouteRecordRaw[] = [
    {
        path: RoutesAlias.Layout,
        name: "Layout",
        component: () => import("@views/index/index.vue"),
        meta: { requiresAuth: true },
        children: []
    },
    {
        path: RoutesAlias.Login,
        name: "Login",
        component: () => import("@views/login/index.vue")
    },
    {
        path: '/md-editor',
        name: 'MdEditor',
        component: () => import("@views/md-editor/index.vue"),
        meta: { requiresAuth: true }
    },
    {
        path: '/exception',
        name: 'Exception',
        children: [
            {
                path: RoutesAlias.Exception404,
                name: "Exception404",
                component: () => import("@views/exception/404/index.vue")
            },
            {
                path: RoutesAlias.Exception403,
                name: "Exception403",
                component: () => import("@views/exception/403/index.vue")
            },
            {
                path: RoutesAlias.Exception500,
                name: "Exception500",
                component: () => import("@views/exception/500/index.vue")
            },
        ]
    },
]