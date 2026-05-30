<template>
    <ul class="tabs">
        <li
            v-for="(item, index) in tabs"
            class="custom-card"
            :class="{active: item.isActive}"
            :key="`scroll-li-${index}`"
            @click="clickTab(item)"
        >
            <span>{{ item.title }}</span>
            <span
                v-show="!item.fixedTab"
                class="close"
                @click.stop="closeTab(item.path)"
            >
                <SvgIcon icon="mdi:close"/>
            </span>
        </li>
    </ul>
</template>

<script setup lang='ts'>
import { useRoute } from "vue-router"
import { type Tab } from "@/types"
import { useTabStore } from "@/store/modules/worktab"
const route = useRoute()
const tabStore = useTabStore()
const tabs = computed(() => tabStore.opened)
/** 跳转路由 */
const clickTab = (item: Tab): void => {
    tabStore.safeRouterPush(item)
}
/** 关闭标签页 */
const closeTab = (path: string): void => {
    tabStore.closeTab(path)
}
watch(
    () => route.matched,
    (matched) => {
        const matchedEnd = route.matched.length - 1
        const hidden = route.matched[matchedEnd]?.meta.hidden
        if(hidden === 1 || hidden){
            return
        }
        tabStore.isActiveTab(matched[matchedEnd]?.path as string)
        tabStore.OpenedTab({
            path: matched[matchedEnd]?.path as string,
            title: matched[matchedEnd]?.meta.title as string,
            isActive: true
        })
    },
    { immediate: true }
)
</script>

<style lang="scss" scoped>
.tabs {
    white-space: nowrap;
    .active{
        color: rgb(164, 164, 255);
    }

    .custom-card {
        display: inline-block;
        font-size: 13px;
        padding-left: 6px;
        height: 32px;
        line-height: 32px;
        border: 1px solid var(--border-color);
        border-radius: 5px;
        background-color: var(--card-color);
        margin-right: 6px;
        cursor: pointer;

        &:hover {
            color: rgb(164, 164, 255);
        }

        .close {
            margin-left: 5px;
            border-radius: 10px;

            &:hover {
                background-color: #f0f0f0;
            }
        }
    }
}
</style>