import { router } from '@/router'
import { type Tab } from "@/types"

/**
 * 标签页管理
 */
export const useTabStore = defineStore("tabsStore", () => {
  // 状态定义
  const current = ref<Partial<Tab>>({}) // 当前标签
  const opened = ref<Tab[]>([])  // 存储已经打开的菜单

  // 计算属性
  const hasOpenedTabs = computed(() => opened.value.length > 0)
  const currentTabIndex = computed(() =>
    current.value.path ? opened.value.findIndex((tab) => tab.path === current.value.path) : -1
  )

  /** 检查标签页是否可关闭 */
  const isTabClosable = (tab: Tab): boolean => {
    return !tab.fixedTab
  }
  /** 添加已打开的菜单 */
  const OpenedTab = (tab: Tab): void => {
    // 每次点击指定当前标签页
    current.value = tab
    // 判断元素是否已存在
    if (findTabIndex(tab.path) !== -1) {
      return
    }
    opened.value.push(tab)
  }
  /** 查找标签页索引 */
  const findTabIndex = (path: string): number => {
    return opened.value.findIndex((tab) => tab.path === path)
  }
  /** 获取标签页 */
  const getTab = (path: string): Tab | undefined => {
    return opened.value.find((tab) => tab.path === path)
  }
  /** 删除标签页 */
  const closeTab = (path: string) => {
    const targetIndex = findTabIndex(path)
    opened.value.splice(targetIndex, 1)

    // 如果关闭的是当前激活标签，需要激活其他标签
    if (current.value.path === path) {
      const newIndex = targetIndex >= opened.value.length ? opened.value.length - 1 : targetIndex
      current.value = opened.value[newIndex] as Tab
      safeRouterPush(current.value)
    }
  }
  /** 安全的路由跳转 */
  const safeRouterPush = (tab: Partial<Tab>): void => {
    if (!tab.path) {
      console.warn('尝试跳转到无效路径的标签页')
      return
    }

    try {
      router.push({
        path: tab.path
      })
    } catch (error) {
      console.error('路由跳转失败:', error)
    }
  }
  /** 固定/激活标签页 */
  const isFixedTab = (tab: Tab): boolean => {
    const index = findTabIndex(tab.path)
    if (index !== -1 && opened.value[index]) {
      opened.value[index].fixedTab = !opened.value[index].fixedTab
      return opened.value[index].fixedTab
    }
    return false
  }
  /** 清除isActive */
  const isActiveTab = (path: string): void => {
    const tab = getTab(path)
    // 清除所有tab的active状态
    opened.value.forEach(item => {
      item.isActive = false
    })
    if (tab) {
      tab.isActive = true
    }
  }
  /** 关闭左侧选项卡 */
  const removeLeftTabs = (path: string): void => {
    const targetIndex = findTabIndex(path)
    if (targetIndex === -1) {
      console.warn(`尝试关闭左侧标签页，但目标标签页不存在: ${path}`)
      return
    }
    // 获取左侧可关闭的标签页
    const leftTabs = opened.value.slice(0, targetIndex)
    const closableLeftTabs = leftTabs.filter(isTabClosable)

    if (closableLeftTabs.length === 0) {
      console.warn('左侧没有可关闭的标签页')
      return
    }

    // 移除左侧可关闭的标签页
    opened.value = opened.value.filter(
      (tab, index) => index >= targetIndex || !isTabClosable(tab)
    )

    // 确保当前标签是激活状态
    const targetTab = getTab(path)
    if (targetTab) {
      current.value = targetTab
    }

  }

  /** 关闭右侧选项卡 */
  const removeRightTabs = (path: string): void => {
    const targetIndex = findTabIndex(path)

    if (targetIndex === -1) {
      console.warn(`尝试关闭右侧标签页，但目标标签页不存在: ${path}`)
      return
    }

    // 获取右侧可关闭的标签页
    const rightTabs = opened.value.slice(targetIndex + 1)
    const closableRightTabs = rightTabs.filter(isTabClosable)

    if (closableRightTabs.length === 0) {
      console.warn('右侧没有可关闭的标签页')
      return
    }

    // 移除右侧可关闭的标签页
    opened.value = opened.value.filter(
      (tab, index) => index <= targetIndex || !isTabClosable(tab)
    )

    // 确保当前标签是激活状态
    const targetTab = getTab(path)
    if (targetTab) {
      current.value = targetTab
    }
  }

  // 退出登录清空所有相关状态
  const clearTab = () => {
    current.value = {}
    opened.value = []
  }

  return {
    // 状态
    current,
    opened,

    // 计算属性
    hasOpenedTabs,
    currentTabIndex,

    // 方法
    isTabClosable,
    getTab,
    safeRouterPush,
    OpenedTab,
    findTabIndex,
    closeTab,
    isFixedTab,
    isActiveTab,
    removeLeftTabs,
    removeRightTabs,
    clearTab
  }
}, {
  persist: {
    key: 'fish-tabs',
    storage: localStorage
  }
})