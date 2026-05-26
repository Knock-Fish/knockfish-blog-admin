<!-- setting/widget/UserInfo.vue -->
<template>
    <div class="user-info">
        <h3>个人信息</h3>
        <DynamicForm v-model="formData" :form-items="formItems"
            :form-props="formProps">
            <template #avatar>
                <ElAvatar :size="100" :src="formData.avatar" />
            </template>
        </DynamicForm>
        <ElButton @click="handleUpdata">保存修改</ElButton>
    </div>
</template>

<script setup lang="ts">
import { UserService } from "@/api/userApi"
import { useUserStore } from "@/store/modules/user"
import { type FormProps, ElMessage } from "element-plus"
type User = Api.User.UserInfo
const userStore = useUserStore()
const { username, nickname, avatar, email, description } = userStore.info
const formData = reactive<User>({
    username: username,
    nickname: nickname,
    avatar: avatar,
    email: email,
    description: description,
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
const handleUpdata = async () => {
    if (!formData.username) {
        ElMessage.warning('无效的账户')
        return
    }
    const userInfo = await UserService.updataUser(formData)
    userStore.setUserInfo(userInfo)
    ElMessage.success('修改成功')
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