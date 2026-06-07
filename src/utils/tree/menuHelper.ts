import { type MenuItem } from "@/types/store/index"
import { type AppRouteRecord } from '@/types'
type Permission = Api.Permission.PermissionInfo

/**
 * 判断是否为菜单项
 * 条件：sortOrder !== 0 且有 component（或者有子菜单）
 */
function isMenuItem(permission: Permission): boolean {
  // return permission.sortOrder !== 0 && !!permission.component
  return !!permission.component && !!permission.path && !!permission.routeName
}

/**
 * 将权限数据转换为菜单数据
 */
export function transformPermissionToMenu(permissions: Permission[]): AppRouteRecord[] {
  // 先过滤出组件
  const menuPermissions = permissions.filter(p => isMenuItem(p))
  // 构建树形结构
  const tree = buildMenuTree(menuPermissions)

  // 转换为菜单组件需要的格式
  return convertToMenuItem(tree)
}

/**
 * 构建菜单树
 */
function buildMenuTree(permissions: Permission[]): Permission[] {
  const permissionMap = new Map<number, Permission>()
  const tree: Permission[] = []

  // 初始化所有节点
  permissions.forEach(permission => {
    permissionMap.set(permission.permissionId, {
      ...permission,
      children: []
    })
  })

  // 构建树形结构
  permissions.forEach(permission => {
    const node = permissionMap.get(permission.permissionId)!

    if (permission.parentId === 0) {
      tree.push(node)
    } else {
      const parent = permissionMap.get(permission.parentId)
      if (parent) {
        parent.children!.push(node)
      } else {
        tree.push(node)
      }
    }
  })

  // 排序
  const sortTree = (nodes: Permission[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children)
      }
    })
  }
  sortTree(tree)

  return tree
}

/**
 * 转换为菜单组件需要的格式
 */
function convertToMenuItem(permissions: Permission[]): AppRouteRecord[] {
  return permissions.map(permission => {
    const menuItem: AppRouteRecord = {
      id: permission.permissionId,
      path: permission.path || '/',
      name: permission.routeName!,
      component: permission.component!,
      meta: {
        title: permission.permissionName,
        permissionCode: permission.permissionCode,
        icon: permission.icon || undefined,
        hidden: permission.hidden,
        keepAlive: permission.keepAlive
      },
      children: permission.children && permission.children.length > 0
        ? convertToMenuItem(permission.children)
        : undefined
    }
    // 有子菜单时，需要 name 字段
    if (menuItem.children && menuItem.children.length > 0 && permission.routeName) {
      menuItem.name = permission.routeName
    }
    return menuItem
  })
}

/**
 * 扁平权限数据转菜单树
 */
export function flatPermissionsToMenuTree(permissions: Permission[]): AppRouteRecord[] {
  return transformPermissionToMenu(permissions)
}