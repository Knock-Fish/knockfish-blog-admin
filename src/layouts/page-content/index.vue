<template>
    <div class="main" :style="{ paddingLeft: menuWidth }">
        <div>
            <RouterView v-slot="{ Component }">
                <Transition name="fade" mode="out-in">
                    <keep-alive :include="cacheList">
                        <component :is="Component" />
                    </keep-alive>
                </Transition>
            </RouterView>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed } from "vue"
import { useMenuStore } from "@/store/modules/menu"
import { useRoute } from 'vue-router'
const route = useRoute()
const menuStore = useMenuStore()
const menuWidth = computed(() => menuStore.menuWidth)
const cacheSet = ref<Set<string>>(new Set())
const cacheList = computed(() => Array.from(cacheSet.value))
watch(() => route,
    (newRoute) => {
        // 检查是否需要缓存
        if (newRoute.meta?.keepAlive === 1 || newRoute.meta?.keepAlive === true) {
            const routeName = newRoute.name as string
            if (routeName && !cacheSet.value.has(routeName)) {
                cacheSet.value.add(routeName)
            }
        }
    }, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
.main {
    box-sizing: border-box;
    // padding-left: v-bind(menuWidth);
    padding-top: 95px;
    // margin: 15px;
    transition: padding-left 0.4s ease;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}
</style>