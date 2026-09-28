import { computed, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'

/** 小屏断点：低于该宽度使用抽屉式会话列表 */
const SMALL_SCREEN_BREAKPOINT = 900

/**
 * 布局与响应式状态：
 * - 大屏：侧边栏会话列表（showConversations 控制显隐）
 * - 小屏：抽屉式会话列表（drawerVisible 控制）
 */
export function useChatLayout() {
    const { width } = useWindowSize()
    const isSmallScreen = computed(() => width.value < SMALL_SCREEN_BREAKPOINT)

    // 控制会话列表显示/隐藏（大屏侧边栏）
    const showConversations = ref(true)
    // 抽屉显示状态（小屏）
    const drawerVisible = ref(false)

    /** 切换会话列表：小屏切换抽屉，大屏切换侧边栏 */
    function toggleConversations() {
        if (isSmallScreen.value) {
            drawerVisible.value = !drawerVisible.value
        } else {
            showConversations.value = !showConversations.value
        }
    }

    // 屏幕尺寸变化时归一化侧边栏/抽屉状态，避免状态错乱
    watch(isSmallScreen, (small) => {
        if (!small && !showConversations.value) showConversations.value = true
        if (!small && drawerVisible.value) drawerVisible.value = false
        if (small && showConversations.value) showConversations.value = false
    })

    return { isSmallScreen, showConversations, drawerVisible, toggleConversations }
}
