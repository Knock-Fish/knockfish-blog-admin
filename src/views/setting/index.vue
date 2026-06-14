<template>
    <div class="setting-page">
        <ElTabs v-model="activeTab" :tab-position="tabPosition">
            <ElTabPane v-for="item in tabItems" :key="item.name"
                :label="item.label" :name="item.name">
                <!-- 核心：keep-alive + 条件渲染 -->
                <KeepAlive>
                    <Transition name="fade" mode="out-in">
                        <component :is="components[item.current]"
                            v-if="activeTab === item.name" />
                    </Transition>
                </KeepAlive>
            </ElTabPane>
        </ElTabs>
    </div>
</template>

<script setup lang='ts'>
import type { ElTabPane, TabsInstance } from 'element-plus'

import BlogSetting from "./widget/blog-setting/index.vue"
import ChangePassword from "./widget/change-password/index.vue"
import UserInfo from "./widget/user-info/index.vue"
import { ref, markRaw, onMounted } from 'vue'

const tabPosition = ref<TabsInstance['tabPosition']>('left')

// 默认激活第一个
const activeTab = ref('user-info')

// 组件必须用 markRaw
const components: Record<string, Component> = {
    userInfo: markRaw(UserInfo),
    blogSetting: markRaw(BlogSetting),
    changePassword: markRaw(ChangePassword)
}

const tabItems = ref([
    {
        name: 'user-info',
        label: '个人信息',
        current: 'userInfo',
    },
    {
        name: 'blog-setting',
        label: '系统设置',
        current: 'blogSetting',
    },
    {
        name: 'change-password',
        label: '修改密码',
        current: 'changePassword',
    },
] as const)

onMounted(() => {
    console.log('默认激活的标签页:', activeTab.value)
})
</script>

<style lang="scss" scoped>
.setting-page {
    box-sizing: border-box;
    margin: 15px auto;
    width: 80%;
    padding: 20px;
    background-color: var(--header-color);
    border: 1px solid var(--border-color);
    transition: all 0.5s;

    @media screen and (max-width: $screen-larger) {
        width: 100%;
    }
}
/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
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