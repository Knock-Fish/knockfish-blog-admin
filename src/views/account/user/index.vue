<template>
    <div ref="divRef" class="page">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getUserListData" @page-size="getUserListData">
            <template #header>
                <div class="table-header">
                    <DialogButton permission="user:add" @submit="handleAdd"
                        @closed="clearData" @click="isUsername = false">
                        新增角色
                        <template #content>
                            <DynamicForm ref="formRef" v-model="formData"
                                :form-items="formItems">
                                <template #upload="{ model }">
                                    <Upload v-model="model.avatar"
                                        :props="uploadProps" tip="建议尺寸1:1"
                                        :width="100" :height="100" />
                                </template>
                            </DynamicForm>
                        </template>
                    </DialogButton>
                    <div class="icon-list">
                        <DataRefresh @click="getUserListData" />
                        <FullScreenPage :target-ref="divRef" />
                        <ExcelExport :table-data="tableData" />
                    </div>
                </div>
            </template>
            <!-- 自定义列内容 -->
            <template #username="{ row }">
                <div class="user">
                    <img :src="row.avatar" />
                    <div class="info">
                        <p>{{ row.username }}</p>
                        <p>{{ row.email }}</p>
                    </div>
                </div>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton permission="user:edit" @click="getData(row)"
                    @closed="clearData" @submit="handleUpdate"
                    :button-props="editButtinProps">
                    编辑
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems">
                            <template #upload="{ model }">
                                <Upload v-model="model.avatar"
                                    :props="uploadProps" tip="建议尺寸1:1"
                                    width="100px" height="100px" />
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton permission="user:delete"
                    :button-props="delButtonProps">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { UserService } from "@/api/userApi"
import { R2FileService } from "@/api/r2FileApi"
import { useUserStore } from "@/store/modules/user"
import { type ButtonProps, type UploadRequestOptions, ElMessage } from "element-plus"
type User = Api.User.UserInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
type Query = {
    username?: string
    nickname?: string
}
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)
const updateAvatar = ref<string[]>([])
const query = reactive<Query>({})
const isUsername = ref<boolean>(false)
const tableData = ref<User[]>([])
const loading = ref(true)
const formData = reactive<User>({
    username: '',
    avatar: '',
    nickname: '',
    description: ''
})
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const editButtinProps = ref<ButtonProps>({
    size: "small",
})
const delButtonProps = ref<ButtonProps>({
    size: "small",
    type: "danger"
})
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
    }
])
const uploadProps = ref<Record<string, any>>({
    showFileList: false,
    httpRequest: async (options: UploadRequestOptions) => {
        const { file } = options
        const res = await R2FileService.uploadR2File({ file })
        updateAvatar.value.push(res.key)
        return res.url
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
const handleAdd = () => {
    isUsername.value = false
}
const handleUpdate = async () => {
    await UserService.updateUser(formData)
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
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    await getUserListData()
}
const getData = (row: User) => {
    isUsername.value = true
    const { userId, username, nickname, email, description, avatar } = row
    Object.assign(formData, { userId, username, nickname, email, description, avatar })
}
const clearData = () => {
    // 清除表单数据，重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
    // 清空formData数据
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof User] as any) = ""
    })

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
const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'username', label: '账号', minWidth: '160', slot: 'username' },
    { prop: 'nickname', label: '昵称', minWidth: '160', },
    { prop: 'description', label: '简介', minWidth: '200', showOverflowTooltip: true },
    { prop: 'createTime', label: '创建时间', minWidth: '140' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])
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

        .table-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .icon-list {
                display: flex;
            }
        }
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
</style>
