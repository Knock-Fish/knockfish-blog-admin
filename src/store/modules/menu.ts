import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { type AppRouteRecord } from '@/types'
/**
 * 菜单状态管理
 * 管理应用的菜单列表、首页路径、菜单宽度和动态路由移除函数
 */
export const useMenuStore = defineStore('menuStore', () => {
    /** 菜单宽度 */
    const menuWidth = ref('0px')
    /** 菜单折叠 */
    const isCollapse = ref(false)
    /** 菜单列表 */
    const menuList = ref<AppRouteRecord[]>([])
    /** 使用 VueUse 监听窗口大小 */
    const { width } = useWindowSize()
    /** 菜单隐藏 */
    const isHide = ref(false)

    /**
   * 设置菜单列表
   * @param list 菜单路由记录数组
   */
    const setMenuList = (list: AppRouteRecord[]) => {
        menuList.value = list
    }
    /**
     * 设置菜单路由
     * @param routes 注册菜单路由
     */
    /**
     * 设置菜单宽度
     * @param width 菜单宽度值
     */
    const setMenuWidth = (width: string) => (menuWidth.value = width)
    /**
     * 设置菜单折叠
     * @param  菜单宽度值
     */
    const setIsCollapse = (collapse: boolean) => (isCollapse.value = collapse)
    /**
     * 登出清除菜单状态
     */
    const clearMenu = () => {
        menuList.value = []
    }
    /**
     * 设置响应式菜单
     */
    const initMenuState = () => {
        const currentWidth = width.value;
        // 移动端（<800px）
        if (currentWidth < 800) {
            isCollapse.value = true
            menuWidth.value = '0px'
            isHide.value = true
            return
        }

        // 平板/小屏幕桌面（800px-1024px）
        if (currentWidth >= 800 && currentWidth < 1024) {
            isCollapse.value = true // 保持当前状态
            menuWidth.value = '70px'
            isHide.value = false
            return
        }

        // 大屏幕桌面（>=1024px）
        if (currentWidth >= 1024) {
            if (isCollapse.value) { // 只有当前是折叠状态才展开
                isCollapse.value = false
            }
            isHide.value = false
            menuWidth.value = '240px'
        }
    }
    initMenuState()
    // 监听窗口变化，自动调整侧边栏
    watch(width, () => {
        initMenuState()
    })
    return {
        // 属性
        menuWidth,
        isCollapse,
        menuList,
        isHide,
        width,

        // 方法
        setMenuWidth,
        setIsCollapse,
        setMenuList,
        clearMenu
    }
}, {
    persist: {
        key: 'menu',
        storage: localStorage,
    }
})