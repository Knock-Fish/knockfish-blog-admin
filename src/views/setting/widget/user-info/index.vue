<!-- setting/widget/UserInfo.vue -->
<template>
    <div class="user-info">
        <h3>个人信息</h3>
        <DynamicForm v-model="formData" :form-items="formItems"
            :form-props="formProps">
            <template #avatar="{ model }">
                <Upload v-model="model.avatar" :props="uploadProps('avatar')"
                    :width="100" :height="100" tip="" />
            </template>
            <template #background="{ model }">
                <Upload v-model="model.background" @remove="handleRemove" :showDelete="true"
                    :props="uploadProps('background')" tip="" />
            </template>
        </DynamicForm>
        <ElButton @click="handleUpdata">保存修改</ElButton>
    </div>
</template>

<script setup lang="ts">
import { UserService } from "@/api/userApi"
import { R2FileService } from "@/api/r2FileApi"
import { useUserStore } from "@/store/modules/user"
import { type FormProps, type UploadRequestOptions, ElMessage, type UploadFile } from "element-plus"
type User = Api.User.UserInfo
const userStore = useUserStore()
const { userId, username, nickname, avatar, email, description, githubUrl, bilibiliUrl, background } = userStore.info
const updateAvatar = ref<string[]>([])
const formData = reactive<User>({
    username: username,
    nickname: nickname,
    avatar: avatar,
    email: email,
    description: description,
    githubUrl: githubUrl,
    bilibiliUrl: bilibiliUrl,
    background: background
})
const formItems = ref([
    {
        type: 'avatar',
        prop: 'avatar',
        label: '头像预览',
        slot: "avatar",
        props: {

        },
    },
    {
        type: 'background',
        prop: 'background',
        label: '个人背景图',
        slot: "background",
        props: {

        },
    },
    {
        type: 'Input',
        prop: 'nickname',
        label: '昵称',
        props: {

        },
    },
    {
        type: 'Input',
        prop: 'email',
        label: '邮箱',
        props: {

        },
    },
    {
        type: 'Input',
        prop: 'githubUrl',
        label: 'GitHub账号',
        props: {

        },
    },
    {
        type: 'Input',
        prop: 'bilibiliUrl',
        label: 'B站账号',
        props: {

        },
    },
    {
        type: 'Input',
        prop: 'description',
        label: '概要',
        props: {
            type: 'textarea'
        },
    }
])
const formProps = reactive<FormProps>({
    labelPosition: 'top'
})
// 监听 remove 事件
const handleRemove = (file: UploadFile) => {
    console.log('图片被移除', file)
    // 这里可以执行其他清理逻辑
    // 例如：删除服务器上的图片、重置表单状态等
}
const handleUpdata = async () => {
    if (!formData.username) {
        ElMessage.warning('无效的账户')
        return
    }
    const userInfo = await UserService.updateUser(formData)
    if (updateAvatar.value.length != 0) {
        const avatarKey = formData.avatar ? new URL(formData.avatar).pathname.substring(1) : ''
        if (formData.avatar && updateAvatar.value.includes(avatarKey)) {
            // 删除除了当前头像以外的所有临时头像
            const coversToDelete = updateAvatar.value.filter(
                url => url !== avatarKey
            )
            if (coversToDelete.length > 0) {
                await R2FileService.batchDelR2File(coversToDelete)
            }
            // 清空数组（保留正在使用的头像）
            updateAvatar.value = [avatarKey]
        }
    }
    userStore.setUserInfo(userInfo)
    ElMessage.success('修改成功')
}
const uploadProps = (type: string) => {
    return {
        showFileList: false,
        httpRequest: async (options: UploadRequestOptions) => {
            const { file } = options
            if (userId) {
                const res = await R2FileService.uploadR2File({ file, type, userId })
                updateAvatar.value.push(res.key)
                return res.url
            }
        },
        action: '',
    }
}
</script>
<style lang="scss" scoped>
.user-info {
    padding: 20px;

    h3 {
        padding-bottom: 20px;
    }
}
</style>