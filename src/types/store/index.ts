/**
 * Store相关类型定义
 */
import { RoutesAlias } from "@/router/routesAlias"
export interface Tab{
    title: string
    name: string
    path: string
    fixedTab?: boolean
    isActive?: boolean
}
export interface MenuItem {
    id: number | string,
    name: string,
    path: RoutesAlias | string,
    icon?: string,
    children?: MenuItem[]
}