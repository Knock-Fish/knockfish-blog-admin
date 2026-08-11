<template>
    <div class="layout-container">
        <!-- 侧边栏 -->
        <SidebarMenu />
        <!-- 头部 -->
        <HeaderBar />
        <!-- 菜单选项卡 -->
        <WorkTab />
        <!-- 页面内容 -->
        <PageContent />
    </div>
</template>

<script setup lang='ts'>
import { useUserStore } from "@/store/modules/user"
const userStore = useUserStore()
const backgroundImage = computed(() => {
    const bg = userStore.info.background
    return bg ? `url(${bg})` : 'none'
})
</script>

<style lang="scss" scoped>
.layout-container {
    position: relative;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    min-height: 100vh;

    &::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        background-image: v-bind(backgroundImage);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0.2;
        filter: blur(3px);
        pointer-events: none;
        transform: translateZ(0);
        will-change: transform;
    }
    
}
</style>