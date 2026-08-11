<template>
    <div ref="divRef" class="page">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getUserListData" @page-size="getUserListData">
            <template #header>
                    <DialogButton :permission="UserPerm.ADD" @submit="handleAdd"
                        @closed="clearData" @click="isUsername = false">
                        新增用户
                        <template #content>
                            <DynamicForm ref="formRef" v-model="formData"
                                :form-items="formItems">
                                <template #upload="{ model }">
                                    <Upload v-model="model.avatar"
                                        :props="uploadProps" tip="建议尺寸1:1"
                                        :width="100" :height="100" />
                                </template>
                                <template #role-select="{ model }">
                                    <ElSelect v-model="model.roleIds" multiple
                                        placeholder="请选择角色" :style="{ width: '100%' }">
                                        <ElOption v-for="role in roleList" :key="role.roleId"
                                            :label="role.roleName" :value="role.roleId" />
                                    </ElSelect>
                                </template>
                            </DynamicForm>
                        </template>
                    </DialogButton>
            </template>
            <template #username="{ row }">
                <div class="user">
                    <img :src="row.avatar" />
                    <div class="info">
                        <p>{{ row.username }}</p>
                        <p>{{ row.email }}</p>
                    </div>
                </div>
            </template>
            <template #roles="{ row }">
                <div class="role-tags">
                    <span v-for="role in row.roles" :key="role.roleId"
                        class="role-tag">{{ role.roleName }}</span>
                    <span v-if="!row.roles || row.roles.length === 0"
                        class="no-role">未分配角色</span>
                </div>
            </template>
            <template #option="{ row }">
                <DialogButton :permission="UserPerm.EDIT" :buttonBorder="false" @click="getData(row)"
                    @closed="clearData" @submit="handleUpdate"
                    :button-props="editButtonProps">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems">
                            <template #upload="{ model }">
                                <Upload v-model="model.avatar"
                                    :props="uploadProps" tip="建议尺寸1:1"
                                    width="100px" height="100px" />
                            </template>
                            <template #role-select="{ model }">
                                <ElSelect v-model="model.roleIds" multiple
                                    placeholder="请选择角色" :style="{ width: '100%' }">
                                    <ElOption v-for="role in roleList" :key="role.roleId"
                                        :label="role.roleName" :value="role.roleId" />
                                </ElSelect>
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :buttonBorder="false" :permission="UserPerm.DELETE"
                    :button-props="delButtonProps">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { UserPerm } from '@/constants'
import { UserService } from "@/api/userApi"
import { R2FileService } from "@/api/r2FileApi"
import { RoleService } from "@/api/roleApi"
import { useUserStore } from "@/store/modules/user"
import { type ButtonProps, type UploadRequestOptions, ElMessage } from "element-plus"
type User = Api.User.UserInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
type Query = {
    username?: string
    nickname?: string
}
const useStore = useUserStore()
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)
const userId = useStore.info.userId
const fileId = ref<number>(0)
const updateAvatar = ref<string[]>([])
const query = reactive<Query>({})
const isUsername = ref<boolean>(false)
const tableData = ref<User[]>([])
const loading = ref(true)
const formData = reactive<User>({
    username: '',
    avatar: '',
    nickname: '',
    description: '',
    githubUrl: '',
    bilibiliUrl: '',
    roleIds: []
})
const page = reactive({
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const editButtonProps = ref<ButtonProps>({
    type: "primary",
    plain: true
})
const delButtonProps = ref<ButtonProps>({
    type: "danger",
    plain: true
})
const roleList = ref<Api.Role.RoleInfo[]>([])
const roleLoaded = ref<boolean>(false)
/** 新增/编辑 表单配置 */
const formItems = computed(() => [
    {
        type: 'Input',
        prop: 'username',
        label: '账户',
        props: {
            placeholder: '请输入账户',
            disabled: isUsername.value
        },
        rules: {
            required: true,
            message: '账户不能为空',
            trigger: 'blur'
        },
    },
    {
        type: 'Input',
        prop: 'nickname',
        label: '昵称',
        props: {
            placeholder: '请输入昵称',
        },
        rules: {
            required: true,
            message: '昵称不能为空',
            trigger: 'blur'
        },
    },
    {
        type: 'Input',
        prop: 'email',
        label: '邮箱',
        props: {
            placeholder: '请输入邮箱',
        },
        rules: {
            // required: true,
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: '请输入正确的邮箱格式',
            trigger: 'blur'
        },
    },
    {
        prop: 'avatar',
        label: '头像',
        slot: 'upload'
    },
    {
        type: 'Input',
        prop: 'description',
        label: '简介',
        props: {
            type: "textarea",
            placeholder: '请输入简介',
            rows: 4
        },
        rules: {
            required: true,
            message: '简介不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'githubUrl',
        label: 'GitHub地址',
        props: {
            placeholder: '请输入GitHub地址'
        }
    },
    {
        type: 'Input',
        prop: 'bilibiliUrl',
        label: 'B站地址',
        props: {
            placeholder: '请输入B站地址'
        }
    },
    {
        prop: 'roleIds',
        label: '角色',
        slot: 'role-select'
    }
])
const uploadProps = ref<Record<string, any>>({
    showFileList: false,
    httpRequest: async (options: UploadRequestOptions) => {
        const { file } = options
        if (userId) {
            const res = await R2FileService.uploadR2File({ file, type: "avatar", userId })
            fileId.value = res.fileId
            updateAvatar.value.push(res.key)
            return res.url
        }
    },
    action: '',
})
const getUserListData = async () => {
    loading.value = true
    try {
        const data: PaginatingParams<User> = await UserService.getUserListData({
            ...query,
            pageNum: page.pageNum,  // 当前页码
            pageSize: page.pageSize,    // 每页条数
        })
        tableData.value = data.list
        page.total = data.total
    } finally {
        loading.value = false
    }
}
const handleAdd = async () => {
    isUsername.value = false
    await getRoleListData()
}
const handleUpdate = async () => {
    await UserService.updateUser(formData)
    if (formData.userId && formData.roleIds) {
        await UserService.updateUserRoles({
            userId: formData.userId,
            roleIds: formData.roleIds
        })
    }
    if (updateAvatar.value.length != 0) {
        const avatarKey = formData.avatar ? new URL(formData.avatar).pathname.substring(1) : ''
        if (formData.avatar && updateAvatar.value.includes(avatarKey)) {
            const coversToDelete = updateAvatar.value.filter(
                url => url !== avatarKey
            )
            if (coversToDelete.length > 0) {
                await R2FileService.batchDelR2File(coversToDelete)
            }
            updateAvatar.value = [avatarKey]
        }
    }
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    await getUserListData()
}
const getData = async (row: User) => {
    isUsername.value = true
    const { userId, username, nickname, email, description, avatar, githubUrl, bilibiliUrl } = row
    Object.assign(formData, { userId, username, nickname, email, description, avatar, githubUrl, bilibiliUrl })
    await getRoleListData()
    const roles = await UserService.getUserRoles(row.userId!)
    formData.roleIds = roles.map(r => r.roleId!).filter(Boolean)
}
const clearData = () => {
    if (formRef.value) {
        formRef.value.resetForm()
    }
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof User] as any) = ""
    })
}
const getRoleListData = async () => {
    if (roleLoaded.value) return
    const data: PaginatingParams<Api.Role.RoleInfo> = await RoleService.getRoleListData({
        pageNum: 1,
        pageSize: 100
    })
    roleList.value = data.list
    roleLoaded.value = true
}

/** 搜索 */
const handleSearch = () => {
    getUserListData()
}
/** 搜索重置 */
const handleReset = () => {
    getUserListData()
}
/** 搜索栏配置 */
const searchList = [
    {
        prop: 'username',
        current: 'input',
        label: "账号",
        props: {
            placeholder: "请输入账号"
        }
    },
    {
        prop: 'nickname',
        current: 'input',
        label: "昵称",
        props: {
            placeholder: "请输入昵称"
        }
    },
    {
        prop: 'email',
        current: 'input',
        label: "邮箱",
        props: {
            placeholder: "请输入邮箱"
        }
    },
]
/** 表格 */
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'username', label: '账号', minWidth: '160', slot: 'username' },
    { prop: 'nickname', label: '昵称', minWidth: '160', },
    { prop: 'roles', label: '角色', minWidth: '150', slot: 'roles' },
    { prop: 'description', label: '简介', minWidth: '200', showOverflowTooltip: true },
    { prop: 'createTime', label: '创建时间', minWidth: '140' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '200', permission: ['user:edit', 'user:delete'] }
])
useTableColumnPermission(columns)
onMounted(async () => {
    await getUserListData()
})
</script>

<style lang="scss" scoped>
.page {
    @include page;

    .search {
        flex: 0 0 auto;
    }

    .table {
        margin-top: 10px;
        flex: 1 1 auto;
    }

    .roleText {
        color: rgb(255, 158, 97);
    }
}

.user {
    display: flex;
    align-items: center;

    img {
        border-radius: 50%;
        width: 40px;
        height: 40px;
    }

    .info {
        margin-left: 10px;
    }
}

.role-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .role-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .role-tag {
            padding: 2px 8px;
            background: #ecf5ff;
            color: #409eff;
            border-radius: 4px;
            font-size: 12px;
        }

        .no-role {
            color: #909399;
            font-size: 12px;
        }
    }
}
</style>
