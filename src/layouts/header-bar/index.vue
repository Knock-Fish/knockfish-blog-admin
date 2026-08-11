<template>
    <div class="header-container">
        <div class="left">
            <div class="btn-box">
                <div class="btn" @click="handleMenu">
                    <SvgIcon icon="mdi:format-align-left" color="#78809D" />
                </div>
            </div>
            <div class="btn-box">
                <div class="btn refresh-btn" @click="handleRefresh">
                    <SvgIcon icon="ri:refresh-line" color="#78809D" />
                </div>
            </div>
            <Breadcrumb class="breadcrumb" />
        </div>
        <div class="right">
            <SearchHeader class="search-header" />
            <div class="btn-box">
                <div class="btn fullscreen-btn" @click="toggleFullscreen">
                    <SvgIcon
                        :icon="fullScreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'"
                        color="#78809D" />
                </div>
            </div>
            <div class="btn-box">
                <div class="btn">
                    <SvgIcon icon="mdi:settings-outline" color="#78809D" />
                </div>
            </div>
            <div class="btn-box">
                <div class="btn" @click="toggleTheme($event)">
                    <SvgIcon
                        :icon="isDark ? 'mdi:white-balance-sunny' : 'mdi:weather-night'"
                        color="#78809D" />
                </div>
            </div>
            <Avatar />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { useMenuStore } from "@/store/modules/menu"
import Breadcrumb from "./widget/Breadcrumb.vue"
import Avatar from "./widget/Avatar.vue"
import SearchHeader from "./widget/SearchHeader.vue"

const { isFullscreen, enter, exit, toggle } = useFullscreen()
const menuStore = useMenuStore()
const { isCollapse } = storeToRefs(menuStore)   // 菜单显示隐藏
const fullScreen = ref<boolean>(false)  // 控制全屏
const menuWidth = computed(() => menuStore.menuWidth)
const isHide = computed(() => menuStore.isHide)
const isDark = useDark()    // 响应式布尔值，表示当前是否暗黑模式
const toggleDark = useToggle(isDark)    // 切换函数
const toggleTheme = async (event: MouseEvent) => {
    const transition = document.startViewTransition(() => {
        toggleDark() // 实际切换主题
    })
    transition.ready.then(() => {
        const x = event.clientX
        const y = event.clientY
        // 从点击点到窗口最远边缘的距离，这个距离即为圆的半径，用于确定一个圆形裁剪路径 (clip path) 的最大尺寸，以便覆盖整个视窗。
        // 勾股定理：a² + b² = c²
        const radius = Math.sqrt(
            Math.max(x, innerWidth - x) ** 2 + Math.max(y, innerHeight - y) ** 2
        )

        const clipPath = [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
        // 实现过渡的过程 circle
        document.documentElement.animate(
            {
                clipPath: isDark.value ? clipPath.reverse() : clipPath,
            },
            {
                duration: 500,
                easing: 'ease-in',
                fill: "both",
                pseudoElement: isDark.value ? '::view-transition-old(root)' : '::view-transition-new(root)',
            }
        )
    })
}
/** 菜单状态 */
const handleMenu = () => {
    if (!isHide.value) {
        let width = isCollapse.value ? "240px" : "70px"
        menuStore.setIsCollapse(!isCollapse.value)
        menuStore.setMenuWidth(width)
    } else {
        menuStore.setIsCollapse(!isCollapse.value)
    }
}
/** 刷新当前页面 */
const handleRefresh = () => {
    window.location.reload();
}
/** 全屏 */
const toggleFullscreen = () => {
    fullScreen.value = !fullScreen.value
    toggle()
}
</script>

<style lang="scss" scoped>
@use "./style";

// 菜单折叠或展开后重新计算顶部导航栏宽度
.header-container {
    width: calc(100% - v-bind(menuWidth));
}
</style>
<style lang="scss">
/* 关闭默认动画，否则影响自定义动画的执行 */
::view-transition-old(root),
::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal !important;
}

.dark::view-transition-old(root) {
    z-index: 99999;
}
</style>
