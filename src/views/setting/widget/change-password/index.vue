<!-- setting/widget/ChangePassword.vue -->
<template>
    <div class="change-password">
        <h3>修改密码</h3>
        <DynamicForm ref="formRef" v-model="formData" :form-items="formItems"
            :form-props="formProps" />
        <ElButton @click="handleUpdata">保存修改</ElButton>
    </div>
</template>

<script setup lang="ts">
type PasswordChange = Api.PasswordChange.Change
import { type FormProps, ElMessage } from "element-plus"
import { UserService } from "@/api/userApi"
const formRef = ref()
const formData = reactive<PasswordChange>({
    oldPassword: '',
    password: '',
    confirmPassword: ''
})
const handleUpdata = async () => {
    if (!formRef.value) return
    
    try {
        await formRef.value.validate()
        await UserService.passwordChange(formData)
        ElMessage.success("修改成功")
        // 清除表单数据，重置表单校验
        formRef.value.resetForm()
    } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('修改密码失败，请检查原密码是否正确')
    }
}
// 自定义确认密码校验函数
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (value === '') {
        callback(new Error('请再次输入新密码'))
    } else if (value !== formData.password) {
        callback(new Error('两次输入的新密码不一致'))
    } else {
        callback()
    }
}
const formItems = ref([
    {
        type: 'Input',
        label: "原密码",
        prop: 'oldPassword',
        props: {
            type: "password",
            showPassword: true
        },
        rules: [
            { required: true, message: '请输入原密码', trigger: 'blur' }
        ]
    },
    {
        type: 'Input',
        label: "新密码",
        prop: 'password',
        props: {
            type: "password",
            showPassword: true
        },
        rules: [
            { required: true, message: '请输入新密码', trigger: 'blur' },
            { min: 6, message: '密码长度至少为6位', trigger: 'blur' },
        ]
    },
    {
        type: 'Input',
        label: "确认密码",
        prop: 'confirmPassword',
        props: {
            type: "password",
            showPassword: true
        },
        rules: [
            { required: true, message: '请再次输入新密码', trigger: 'blur' },
            { validator: validateConfirmPassword, trigger: ['blur', 'change'] }
        ]
    }
])
const formProps = reactive<FormProps>({
    labelPosition: 'top'
})
</script>
<style lang="scss" scoped>
.change-password {
    padding: 20px;

    h3 {
        padding-bottom: 20px;
    }
}
</style>