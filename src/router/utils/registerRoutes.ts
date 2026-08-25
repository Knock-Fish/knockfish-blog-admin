import type { Router, RouteRecordRaw } from 'vue-router'
import { type AppRouteRecord } from '@/types'

const VIEW_MODULES: Record<string, () => Promise<any>> = import.meta.glob('../../views/**/*.vue')
// 组件路径缓存：复用同一组件时避免重复解析与查找
const componentCache = new Map<string, () => Promise<any>>()
// 已注册路由名称集合（含所有层级子路由）
const registeredRouteNames = new Set<string>()

/**
 * 解析路由组件对应的懒加载函数（带缓存）
 * @param componentPath 路由组件路径
 * @returns 懒加载组件函数
 */
function resolveComponent(componentPath: string): () => Promise<any> {
  const cached = componentCache.get(componentPath)
  if (cached) return cached

  const moduleKey = `../../views${componentPath}/index.vue`
  const component = VIEW_MODULES[moduleKey]

  // 兜底：组件不存在时返回空组件并打印警告，可替换为项目内的404组件
  if (!component) {
    console.warn(`[DynamicRoute] 组件路径不存在: ${componentPath}`)
    const fallback = () => Promise.resolve({ default: { render: () => null } })
    componentCache.set(componentPath, fallback)
    return fallback
  }

  componentCache.set(componentPath, component)
  return component
}

/** 规范化路径：去掉首尾 '/'，用于比较 */
const normalizePath = (s: string | undefined | null) => (s ?? '').toString().replace(/^\/+|\/+$/g, '')

/** 判断是否 chat-ai 路由（基于 path 或 component） */
function isChatAiRoute(route: AppRouteRecord): boolean {
  return (
    normalizePath(route.path as string) === 'chat-ai' ||
    normalizePath(typeof route.component === 'string' ? route.component : '') === 'chat-ai'
  )
}

/**
 * 对路由（递归 children）做业务级规范化：
 * - chat-ai 路由追加可选 :sessionId 参数
 * - chat-ai 路由固定 name = 'ChatAi'，供命名路由跳转
 * 返回浅拷贝，不污染原对象
 */
function normalizeRoute(route: AppRouteRecord): AppRouteRecord {
  const r = { ...route } as AppRouteRecord
  if (isChatAiRoute(r)) {
    r.path = 'chat-ai/:sessionId?'
    r.name = 'ChatAi'
  }
  if (r.children && r.children.length > 0) {
    r.children = r.children.map((c) => normalizeRoute(c))
  }
  return r
}

/**
 * 递归转换单条路由（替换component为懒加载函数，处理所有子路由）
 * @param route 原始路由配置（已通过 normalizeRoute 规范化）
 * @returns 转换后的路由配置（浅拷贝）
 */
function transformRoute(route: AppRouteRecord): AppRouteRecord {
  // 此处的 route 已经是 normalizeRoute 的输出（chat-ai 路径/名称已修正）
  const transformed = { ...route } as AppRouteRecord

  // 替换组件为懒加载函数
  if (typeof transformed.component === 'string') {
    transformed.component = resolveComponent(transformed.component)
  }

  // 递归处理子路由
  if (transformed.children && transformed.children.length > 0) {
    transformed.children = transformed.children.map(child => transformRoute(child))
  }

  return transformed
}

/**
 * 递归收集路由树中所有路由名称（基于 normalizeRoute 规范化后收集，保证 name 一致）
 * @param route 路由配置
 * @returns 路由名称数组
 */
function collectRouteNames(route: AppRouteRecord): string[] {
  const names: string[] = []
  const normalized = normalizeRoute(route)
  const innerCollect = (r: AppRouteRecord) => {
    if (r.name) names.push(r.name as string)
    if (r.children) r.children.forEach(innerCollect)
  }
  innerCollect(normalized)
  return names
}

/**
 * 注册异步路由
 * 将路由列表转换为 Vue Router 路由配置，并添加到传入的 router 实例中
 * @param router Vue Router 实例
 * @param routes 路由列表
 */
export async function registerDynamicRoutes(router: Router, routes: AppRouteRecord[]) {
  routes.forEach(route => {
    // 1) 业务规范化：chat-ai 路由统一 path + name（先于名称收集和转换，保证一致性）
    const normalized = normalizeRoute(route)

    // 2) 提前收集所有路由名，先去重再转换，避免无效计算
    const allNames = collectRouteNames(route)
    const hasRegistered = allNames.some(name => registeredRouteNames.has(name))
    if (hasRegistered) return

    // 3) 递归转换整棵路由树的组件（component 字符串 -> 懒加载函数）
    const transformedRoute = transformRoute(normalized)

    // 按业务规则注册路由
    if (transformedRoute.children && transformedRoute.children.length > 0) {
      // 带子路由的路由：根级注册（Vue Router 自动处理子路由）
      router.addRoute(transformedRoute as RouteRecordRaw)
    } else {
      // 无子路由的路由：挂载到 Layout 下
      router.addRoute('Layout', transformedRoute as RouteRecordRaw)
    }

    // 批量记录已注册的路由名称
    allNames.forEach(name => registeredRouteNames.add(name))
  })
}

/**
 * 清理已注册路由记录与缓存
 */
export function clearRegisteredRoutes() {
  registeredRouteNames.clear()
  componentCache.clear()
}