<template>
    <ElScrollbar>
        <ElMenu :default-active="activeMenu" :collapse="isCollapse"
            :router="true" :collapse-transition="true">
            <div class="logo">
                <img :src="isDark ? dark : light" alt="logo" />
                <p :style="{
                    display: isCollapse ? 'none' : 'block'
                }">KnockFishBlog</p>
            </div>
            <TreeMenu :menuData="menuData" />
        </ElMenu>
        <div class="modal" @click="handleModal" v-show="!isCollapse" />
    </ElScrollbar>
</template>

<script setup lang='ts'>
import { useMenuStore } from "@/store/modules/menu"
import { useRoute } from "vue-router"
import { type AppRouteRecord } from '@/types'
const route = useRoute()
const isDark = useDark()
const light = new URL("@/assets/svg/logo.light.svg", import.meta.url).href
const dark = new URL("@/assets/svg/logo.dark.svg", import.meta.url).href
const menuStore = useMenuStore()
const isCollapse = computed(() => menuStore.isCollapse)
const menuData: AppRouteRecord[] =  menuStore.menuList.filter(item => item.meta?.icon) || []
const handleModal = () => {
    menuStore.setIsCollapse(!isCollapse.value)
}
// 自动根据当前路由设置菜单高亮（刷新也不会丢）
const activeMenu = computed(() => {
    return route.path
})
</script>
<style lang="scss" scoped>
@use "./style.scss";
</style>
