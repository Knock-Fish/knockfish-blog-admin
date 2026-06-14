<template>
    <div class="worktab">
        <div class="worktab-content">
            <div class="scroll-view">
                <TabList />
            </div>
            <div class="right">
                <TabDropdown />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { useMenuStore } from "@/store/modules/menu"
import TabDropdown from './widget/TabDropdown.vue'
import TabList from './widget/TabList.vue'

const menuStore = useMenuStore()
const menuWidth = computed(() => menuStore.menuWidth)

</script>

<style lang="scss" scoped>
.active {
    color: #42b983;
    font-weight: bold;
}

.worktab {
    width: calc(100% - v-bind(menuWidth));
    height: 45px;
    box-sizing: border-box;
    position: fixed;
    right: 0;
    top: 50px;
    padding: 0 20px 10px;
    background-color: var(--header-color);
    // background-color: transparent;
    transition: width 0.4s ease;
    z-index: 10000;
    border-bottom: 1px solid var(--border-color);
    .worktab-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 45px;
        box-sizing: border-box;

        .scroll-view {
            width: 100%;
            overflow: hidden;
        }
    }

}
</style>