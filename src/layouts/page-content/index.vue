<template>
    <div class="main" :style="{ paddingLeft: menuWidth }">
        <div>
            <RouterView v-slot="{ Component }">
                <Transition name="fade">
                    <keep-alive :include="cacheList">
                        <component :is="Component" />
                    </keep-alive>
                </Transition>
            </RouterView>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch } from "vue"
import { useMenuStore } from "@/store/modules/menu"
import { useRoute } from 'vue-router'
const route = useRoute()
const menuStore = useMenuStore()
const menuWidth = computed(() => menuStore.menuWidth)
const cacheSet = ref<Set<string>>(new Set())
const cacheList = computed(() => Array.from(cacheSet.value))
watch(() => route.name,
    () => {
        if (route.meta?.keepAlive === 1 || route.meta?.keepAlive === true) {
            const routeName = route.name as string
            if (routeName && !cacheSet.value.has(routeName)) {
                cacheSet.value.add(routeName)
            }
        }
    }, { immediate: true })
</script>

<style lang="scss" scoped>
.main {
    box-sizing: border-box;
    padding-top: 95px;
    transition: padding-left 0.4s ease;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from {
    opacity: 0;
}

.fade-leave-to {
    opacity: 0;
}
</style>