import { watch } from 'vue'
import { useUserStore } from '@/store/modules/user'

interface TableColumn {
    type?: string
    prop?: string
    label?: string
    show?: boolean
    permission?: string | string[]  // 列显示所需的权限码（任一即可），直接在列上声明
    _userSetShow?: boolean
    _permissionControlled?: boolean
}

/**
 * 根据权限控制表格列的显示
 *
 * 使用方式：直接在列定义上声明 permission
 * ```ts
 * const columns = reactive([
 *   { prop: 'action', label: '操作', permission: ['tag:edit', 'tag:delete'] }
 * ])
 * useTableColumnPermission(columns)
 * ```
 *
 * @param columns 响应式的列数组，有权限控制的列在定义时添加 permission 属性
 * @param options 配置项（可选）
 */
export function useTableColumnPermission(
  columns: TableColumn[],
  options?: { preserveUserSetting?: boolean }
) {
  const userStore = useUserStore()

  // 补全权限码前缀，与 DialogButton.resolvePermission 保持一致
  const resolvePermission = (permission: string): string => {
    return permission.startsWith('blog:') ? permission : `blog:${permission}`
  }

  const hasAnyPermission = (perms: string | string[]): boolean => {
    const permList = Array.isArray(perms) ? perms : [perms]
    return permList.some(p => userStore.permissions.includes(resolvePermission(p)))
  }

  const updateColumnsVisibility = () => {
    columns.forEach((col: TableColumn) => {
      if (col.permission) {
        const shouldShow = hasAnyPermission(col.permission)
        // 仅在用户无权限导致列被隐藏时标记为受控（用于禁用复选框）
        col._permissionControlled = !shouldShow
        if (options?.preserveUserSetting && col._userSetShow !== undefined) {
          return
        }
        col.show = shouldShow
        if (!shouldShow) {
          col._userSetShow = undefined
        }
      } else {
        col._permissionControlled = false
        if (col.show === undefined) {
          col.show = true
        }
      }
    })
  }

  watch(
    () => userStore.permissions,
    updateColumnsVisibility,
    { immediate: true, deep: true }
  )

  return {
    updateColumnsVisibility,
  }
}
