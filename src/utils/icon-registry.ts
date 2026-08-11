// 图标注册表 - 按需加载
// 使用 unplugin-icons 实现按需加载

// 静态图标注册表
const iconRegistry: Record<string, () => Promise<any>> = {
  // MDI 图标
  'mdi:add': () => import('~icons/mdi/add'),
  'mdi:delete-outline': () => import('~icons/mdi/delete-outline'),
  'mdi:file-document-box-outline': () => import('~icons/mdi/file-document-box-outline'),
  'mdi:close': () => import('~icons/mdi/close'),
  'mdi:chevron-down': () => import('~icons/mdi/chevron-down'),
  'mdi:pin-outline': () => import('~icons/mdi/pin-outline'),
  'mdi:pin-off-outline': () => import('~icons/mdi/pin-off-outline'),
  'mdi:chevron-left': () => import('~icons/mdi/chevron-left'),
  'mdi:chevron-right': () => import('~icons/mdi/chevron-right'),
  'mdi:account-box-edit-outline': () => import('~icons/mdi/account-box-edit-outline'),
  'mdi:search': () => import('~icons/mdi/search'),
  'mdi:keyboard': () => import('~icons/mdi/keyboard'),
  'mdi:file-search-outline': () => import('~icons/mdi/file-search-outline'),
  'mdi:file-document-outline': () => import('~icons/mdi/file-document-outline'),
  'mdi:arrow-right': () => import('~icons/mdi/arrow-right'),
  'mdi:checkbox-marked-outline': () => import('~icons/mdi/checkbox-marked-outline'),
  'mdi:file-edit-outline': () => import('~icons/mdi/file-edit-outline'),
  'mdi:user-outline': () => import('~icons/mdi/user-outline'),
  'mdi:lock-outline': () => import('~icons/mdi/lock-outline'),
  'mdi:home': () => import('~icons/mdi/home'),
  'mdi:resource-description-framework': () => import('~icons/mdi/resource-description-framework'),
  'material-symbols:fingerprint': () => import('~icons/material-symbols/fingerprint'),
}

/**
 * 获取图标组件
 * @param iconName 图标名称，如 'mdi:home'
 * @returns 图标组件或 null
 */
export async function getIconComponent(iconName: string): Promise<any | null> {
  const loader = iconRegistry[iconName]
  if (loader) {
    const module = await loader()
    return module.default || module
  }
  return null
}

/**
 * 同步获取图标组件（用于已加载的图标）
 * @param iconName 图标名称
 * @returns 图标组件或 null
 */
export function getCachedIcon(iconName: string): any | null {
  // 返回 null 表示需要动态加载
  return null
}

/**
 * 检查图标是否在注册表中
 * @param iconName 图标名称
 */
export function hasIcon(iconName: string): boolean {
  return iconName in iconRegistry
}
