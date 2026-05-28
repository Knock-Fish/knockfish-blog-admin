<template>
    <div class="page-wrapper">
        <SakuraBackground />
        <div class="login-container">
            <div class="login-form">
                <h2>Login</h2>
                <DynamicForm ref="formRef" v-model="formData"
                    :form-items="formItems">
                    <template #prefix="{ item }">
                        <SvgIcon v-if="item.prop === 'username'" color="#ffffff"
                            icon="mdi:user-outline" />
                        <SvgIcon v-else-if="item.prop === 'password'"
                            color="#ffffff" icon="mdi:lock-outline" />
                    </template>
                </DynamicForm>
                <ElButton class="login-btn" @click="handleVerify">Log In
                </ElButton>
            </div>
        </div>
        <ElDialog v-model="isShow" width="340px" :show-close="false">
            <SlideVerify :isSlideConfirm="true" slider-text="按住滑块，拖动完成验证"
                @success="onVerifySuccess" @fail="onVerifyFail"
                @refresh="onRefresh" />
        </ElDialog>
    </div>
</template>
<script setup lang="ts">
import SlideVerify from 'vue3-slide-verify'
import 'vue3-slide-verify/dist/style.css'
import { useUserStore } from "@/store/modules/user"
import { useMenuStore } from "@/store/modules/menu"
import { AuthService } from "@/api/authApi"
import { PermissionService } from '@/api/permissionApi'
import { flatPermissionsToMenuTree } from "@/utils/tree/menuHelper"
import { extractPermissions } from "@/utils/tree/extractPermissions"
import { ElMessage } from "element-plus"
import { type AppRouteRecord } from '@/types'
type LoginParasm = Api.Auth.LoginParams
type Permission = Api.Permission.PermissionInfo
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()
const isShow = ref<boolean>(false)
const formRef = ref()
/** 登录表单数据 */
const formData = reactive<LoginParasm>({
    username: '',
    password: '',
})
// 3. 定义事件处理函数
const onVerifySuccess = async () => {
    isShow.value = false
    await handleLogin()
}
const handleVerify = async () => {
    // 触发表单验证
    if (formRef.value) {
        try {
            await formRef.value.validate()
            // 验证通过，显示滑动验证
            isShow.value = true
        } catch (error) {
            // 验证失败，不显示滑动验证
            // Element Plus 的表单验证会自动显示错误提示，这里不需要额外提示
            console.log('表单验证失败')
        }
    }
}
const onVerifyFail = () => {
    isShow.value = false
    ElMessage.error("验证失败，请重试")
}

const onRefresh = () => {
    ElMessage.success("验证码已刷新")
}
const formItems = ref([
    {
        type: 'Input',
        prop: 'username',
        props: {
            placeholder: '请输入用户名',
        },
        rules: {
            required: true,
            message: '用户名不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'password',
        props: {
            placeholder: '请输入密码',
            type: "password"
        },
        rules: {
            required: true,
            message: '密码不能为空',
            trigger: 'blur'
        }
    }
])
/** 处理登录 */
const handleLogin = async () => {
    const {
        userId, username, description, nickname, avatar, email, token
    } = await AuthService.login(formData)
    // 验证token
    if (!token) {
        throw new Error('登录失败 - 未收到令牌')
    }
    userStore.setToken(token)
    const permissionData = await PermissionService.getUserPermissions(Number(userId))
    
    const menuList: AppRouteRecord[] = flatPermissionsToMenuTree(permissionData.list)
    menuStore.setMenuList(menuList)
    userStore.setLoginStatus(true)
    userStore.setPermissions(extractPermissions(permissionData.list))
    userStore.setUserInfo({ userId, username, description, nickname, email, avatar })
    ElMessage.success(`登录成功`)
    router.push("/dashboard/workbench")
}
</script>
<style lang="scss" scoped>
.page-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh; // 关键：让容器占满整个视口高度
}

.login-container {
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%; // 改为 width，确保响应式
    max-width: 320px; // 表单最大宽度
    height: auto; // 高度自动
    @include frosted-glass;
    // background-color: transparent; // 去掉背景色，让表单自己控制
    background-color: rgba(255, 255, 255, 0.1);

    .login-form {
        width: 100%;
        padding: 40px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

        h2 {
            text-align: center;
            font-weight: bold;
            margin-bottom: 20px;
            color: white; // 标题改为白色
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); // 增加文字阴影，增强可读性
        }

        :deep(.el-input) {
            margin-top: 10px;
        }

        :deep(.el-form-item__content .el-form-item__error) {
            color: rgba(255, 255, 255, 0.8) !important;
            font-size: 12px;
        }

        :deep(.el-input__wrapper) {
            box-shadow: none !important;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important; // 下划线改为半透明白色
            border-radius: 0 !important;

        }

        // 输入框文字颜色
        :deep(.el-input__inner) {
            color: white !important;
            caret-color: white; // 光标颜色也改为白色
        }

        // 设置 placeholder 颜色
        :deep(.el-input__inner::placeholder) {
            color: rgb(255, 255, 255) !important;
        }

        .login-btn {
            width: 100%;
            height: 45px;
            margin-top: 10px;
            border: none !important;

            &:hover {
                background-color: white !important;
                color: #F0A8C0 !important;
            }
        }

    }
}
</style>