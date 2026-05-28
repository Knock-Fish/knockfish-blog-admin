// /**
//  * 将扁平数据构建成树形结构
//  */
// interface Permission {
//     permissionId: number
//     permissionName: string
//     permissionCode: string
//     permissionType: string | null
//     parentId: number
//     path: string | null
//     icon: string | null
//     component: string | null
//     sortOrder: number
//     createTime: string
//     status: 'ENABLE' | 'DISABLE'
//     children?: Permission[]
// }
// export function buildPermissionTree(permissions: Permission[]): Permission[] {
//     if (!permissions || permissions.length === 0) {
//         return []
//     }

//     // 1. 过滤出启用的权限
//     const enabledPermissions = permissions.filter(p => p.status === 'ENABLE')

//     // 2. 创建 ID 映射
//     const permissionMap = new Map<number, Permission>()

//     // 3. 初始化所有节点，添加 children 属性
//     enabledPermissions.forEach(permission => {
//         permissionMap.set(permission.permissionId, {
//             ...permission,
//             children: []
//         })
//     })

//     // 4. 构建树形结构
//     const tree: Permission[] = []

//     enabledPermissions.forEach(permission => {
//         const node = permissionMap.get(permission.permissionId)!

//         if (permission.parentId === 0) {
//             // 根节点
//             tree.push(node)
//         } else {
//             // 子节点，找到父节点并添加
//             const parent = permissionMap.get(permission.parentId)
//             if (parent) {
//                 parent.children!.push(node)
//             } else {
//                 // 如果父节点不存在（可能被禁用或未加载），作为根节点处理
//                 tree.push(node)
//             }
//         }
//     })

//     // 5. 对树进行排序（按 sortOrder）
//     const sortTree = (nodes: Permission[]) => {
//         nodes.sort((a, b) => a.sortOrder - b.sortOrder)
//         nodes.forEach(node => {
//             if (node.children && node.children.length > 0) {
//                 sortTree(node.children)
//             }
//         })
//     }
//     sortTree(tree)

//     return tree
// }

// /**
//  * 获取菜单树（只获取显示在侧边栏的菜单）
//  * 规则：type 为 MENU 且 sortOrder > 0
//  */
// export function getMenuTree(permissions: Permission[]): Permission[] {
//     // 先构建完整树
//     const fullTree = buildPermissionTree(permissions)

//     // 过滤：只保留 MENU 类型且 sortOrder > 0 的节点
//     const filterMenuNodes = (nodes: Permission[]): Permission[] => {
//         return nodes
//             .filter(node => node.sortOrder > 0) // sortOrder > 0 才显示
//             .map(node => ({
//                 ...node,
//                 children: node.children ? filterMenuNodes(node.children) : []
//             }))
//             .filter(node => {
//                 // 保留有组件或有子节点的菜单
//                 return node.component || (node.children && node.children.length > 0)
//             })
//     }

//     return filterMenuNodes(fullTree)
// }

// /**
//  * 获取所有路由（包括隐藏路由）
//  */
// export function getAllRoutes(permissions: Permission[]): Permission[] {
//     const fullTree = buildPermissionTree(permissions)

//     const filterRoutes = (nodes: Permission[]): Permission[] => {
//         return nodes
//             .filter(node => node.sortOrder !== undefined) // 保留所有有排序的
//             .map(node => ({
//                 ...node,
//                 children: node.children ? filterRoutes(node.children) : []
//             }))
//     }

//     return filterRoutes(fullTree)
// }

// /**
//  * 获取按钮权限列表（用于细粒度控制）
//  */
// export function getButtonPermissions(permissions: Permission[]): string[] {
//     return permissions
//         .filter(p => p.permissionCode && !p.path && !p.component) // 没有路径和组件的通常是按钮
//         .map(p => p.permissionCode)
// }

// /**
//  * 根据父ID查找子节点
//  */
// export function findChildrenById(permissions: Permission[], parentId: number): Permission[] {
//     const tree = buildPermissionTree(permissions)

//     const findNode = (nodes: Permission[]): Permission | null => {
//         for (const node of nodes) {
//             if (node.permissionId === parentId) {
//                 return node
//             }
//             if (node.children) {
//                 const found = findNode(node.children)
//                 if (found) return found
//             }
//         }
//         return null
//     }

//     const node = findNode(tree)
//     return node?.children || []
// }

// /**
//  * 获取权限路径（用于面包屑）
//  */
// export function getPermissionPath(permissions: Permission[], permissionId: number): Permission[] {
//     const tree = buildPermissionTree(permissions)
//     const path: Permission[] = []

//     const findPath = (nodes: Permission[], targetId: number, currentPath: Permission[]): boolean => {
//         for (const node of nodes) {
//             currentPath.push(node)
//             if (node.permissionId === targetId) {
//                 path.push(...currentPath)
//                 return true
//             }
//             if (node.children && findPath(node.children, targetId, currentPath)) {
//                 return true
//             }
//             currentPath.pop()
//         }
//         return false
//     }

//     findPath(tree, permissionId, [])
//     return path
// }