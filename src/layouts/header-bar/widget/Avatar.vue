<template>
    <div class="avatar">
        <el-dropdown>
            <span class="el-dropdown-link">
                <img :src="avatar" class="user">
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item
                        @click="handleLoginOut">退出</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

    </div>
</template>

<script setup lang='ts'>
import { useTabStore } from "@/store/modules/worktab"
import { useUserStore } from "@/store/modules/user"
import { RoutesAlias } from "@/router/routesAlias"
import { router } from '@/router'
const tabStore = useTabStore()
const userStore = useUserStore()
const { avatar }  = toRefs(userStore.info)
/** 登出 */
const handleLoginOut = () => {
    router.push(RoutesAlias.Login)
    userStore.logOut()
    tabStore.clearTab()
}
</script>

<style lang="scss" scoped>
.avatar {
    .el-dropdown-link {
        .user {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }
    }
}
</style>