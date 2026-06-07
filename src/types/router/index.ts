/**
 * 路由相关类型定义
 */
import { type RouteRecordRaw } from 'vue-router'
// 路由元数据
export interface RouteMeta {
    /** 路由标题 */
    title?: string
    /** 路由图标 */
    icon?: string
    /** 角色权限 */
    roles?: string[]
    /** 是否隐藏 */ 
    hidden?: number | boolean
    /** 是否缓存 */
    keepAlive?: number | boolean
    /** 权限编码 */
    permissionCode?: string
}
export interface RouteRecord {
    id?: number
    meta: RouteMeta
    children?: RouteRecord[]
    component?: string | (() => Promise<any>)
}

// 扩展路由记录
export interface AppRouteRecord extends Omit<RouteRecordRaw, 'meta' | 'children' | 'component'> {
    id?: number
    name: string
    meta?: RouteMeta
    children?: AppRouteRecord[]
    component?: string | (() => Promise<any>)
}