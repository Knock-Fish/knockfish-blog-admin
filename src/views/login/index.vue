<template>
    <div class="page-wrapper">
        <SakuraBackground />
        <div class="login-container">
            <div class="laffy"></div>
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
                
                <div class="verify-wrapper">
                    <DragVerify
                        ref="verifyRef"
                        :width="240"
                        :height="36"
                        :tips-text="verifyTips"
                        :success-text="'验证成功'"
                        :bg-color="'rgba(255, 255, 255, 0.2)'"
                        :fill-color="'rgba(240, 168, 192, 0.8)'"
                        :block-bg="'#F0A8C0'"
                        @success="onVerifySuccess"
                        @fail="onVerifyFail"
                    />
                </div>
                
                <ElButton 
                    class="login-btn" 
                    :disabled="!isVerified"
                    @click="handleLogin">
                    Log In
                </ElButton>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import DragVerify from "@comps/drag-verify/index.vue"
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

const formRef = ref()
const verifyRef = ref()
const isVerified = ref(false)
const verifyTips = ref('向右拖动滑块进行验证')

const formData = reactive<LoginParasm>({
    username: '',
    password: '',
})

const onVerifySuccess = () => {
    isVerified.value = true
    verifyTips.value = '验证成功'
    ElMessage.success('验证成功')
}

const onVerifyFail = () => {
    isVerified.value = false
    verifyTips.value = '向右拖动滑块进行验证'
    ElMessage.error('验证失败，请重试')
}

const handleLogin = async () => {
    if (!isVerified.value) {
        ElMessage.warning('请先完成滑块验证')
        return
    }
    
    if (formRef.value) {
        try {
            await formRef.value.validate()
            await performLogin()
        } catch (error) {
            console.log('表单验证失败')
        }
    }
}

const performLogin = async () => {
    const {
        userId, username, description, nickname, avatar, email, token
    } = await AuthService.login(formData)
    
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
</script>
<style lang="scss" scoped>
.page-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;

    .login-container {
        position: relative;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 320px;
        height: auto;
        @include frosted-glass;
        background-color: rgba(255, 255, 255, 0.1);

        .laffy {
            width: 100%;
            height: 100%;
            position: absolute;
            top: -187px;
            left: 0;
            overflow: hidden;
            background: url("../../assets/imgs/laffy.webp") no-repeat center center;
            background-size: contain;
            background-position: center;
            z-index: 1;
        }

        .login-form {
            width: 100%;
            padding: 40px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            z-index: 2;
            
            h2 {
                text-align: center;
                font-weight: bold;
                margin-bottom: 20px;
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
                border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
                border-radius: 0 !important;
            }

            :deep(.el-input__inner) {
                color: white !important;
                caret-color: white;
            }

            :deep(.el-input__inner::placeholder) {
                color: rgb(255, 255, 255) !important;
            }

            .verify-wrapper {
                margin-top: 20px;
                display: flex;
                justify-content: center;
            }

            .login-btn {
                width: 100%;
                height: 45px;
                margin-top: 20px;
                border: none !important;

                &:hover:not(:disabled) {
                    background-color: white !important;
                    color: #F0A8C0 !important;
                }

                &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            }
        }
    }
}
</style>