<template>
    <div ref="divRef" class="page">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getLinkListData" @page-size="getLinkListData">
            <template #header>
                <DialogButton :permission="LinkPerm.ADD" @submit="handleAdd"
                    @closed="clearData">
                    新增友链
                    <template #content>
                        <DynamicForm v-model="formData" :form-items="formItems">
                            <template #icon>
                                <img v-if="formData.avatar" style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.avatar">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>

            </template>
            <template #linkInfo="{ row }">
                <div class="link-item">
                    <div class="link-icon">
                        <img :src="row.avatar" :alt="row.linkName" />
                    </div>
                    <div class="link-content">
                        <h4 class="link-name">{{ row.linkName }}</h4>
                        <p class="link-desc">{{ row.description }}</p>
                    </div>
                </div>
            </template>
            <template #linkUrl="{ row }">
                <a class="link-url" :href="row.linkUrl" target="_blank">{{
                    row.linkUrl }}</a>
            </template>
            <template #option="{ row }">
                <DialogButton :permission="LinkPerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps" :dialog-props="dialogProps"
                    @click="getData(row)" @closed="clearData">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems">
                            <template #icon>
                                <img v-if="formData.avatar" style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.avatar">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :buttonBorder="false" :permission="LinkPerm.DELETE"
                    :button-props="delButtonProps" @click="handleDel(row)">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { LinkPerm } from '@/constants'
import { LinkService } from "@/api/linkApi"
import { ElMessage, ElMessageBox, type ButtonProps, type DialogProps } from "element-plus"

type Link = Api.Link.LinkInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>

const query = reactive<Link>({})    // 搜索关键词
const formRef = ref()   // 表单DOM
const divRef = ref<HTMLElement | null>(null)    // 根标签DOM
const tableData = ref<Link[]>([])   // 表格数据
const formData = reactive<Link>({}) // 表单数据
const loading = ref<boolean>(true)   // 是否加载
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})

// --------------- 按钮配置 ---------------
const editButtonProps = ref<ButtonProps>({
    type: "primary",
    plain: true
})
const delButtonProps = ref<ButtonProps>({
    type: "danger",
    plain: true
})
// --------------- 模态框配置 ---------------
const dialogProps = ref<DialogProps>({
    title: "友链信息"
})
// --------------- 表单项配置 ---------------
const formItems = computed(() => [
    {
        type: 'Input',
        prop: 'linkName',
        label: '友链名称',
        slot: "icon",
        props: {
            placeholder: '请输入友链名称',
            style: {
                width: '80%'
            }
        },
        rules: {
            required: true,
            message: '名称不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'icon',
        label: '图标',
        props: {
            placeholder: '请输入图标链接',
        },
        rules: {
            required: true,
            message: '图标链接不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'description',
        label: '描述',
        props: {
            type: 'textarea',
            placeholder: '请输入描述',
        },
        rules: {
            required: true,
            message: '描述不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'linkUrl',
        label: '链接',
        props: {
            placeholder: '请输入链接',
        },
        rules: {
            required: true,
            message: '链接不能为空',
            trigger: 'blur'
        }
    }
])
// --------------- 表格项配置 ---------------
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'linkName', label: '友链信息', slot: 'linkInfo', minWidth: '150', showOverflowTooltip: true },
    { slot: 'linkUrl', label: '链接', minWidth: '150', showOverflowTooltip: true },
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['link:edit', 'link:delete'] }
])
useTableColumnPermission(columns)
// --------------- 搜索栏配置 ---------------
const searchList = [
    {
        prop: 'linkName',
        current: 'input',
        label: "友链名称",
        props: {
            placeholder: "请输入友链名称"
        }
    }
]
/** 获取友链数据 */
const getLinkListData = async () => {
    loading.value = true
    try {
        const data: PaginatingParams<Link> = await LinkService.getLinkListData({
            ...query,
            pageNum: page.pageNum,
            pageSize: page.pageSize,
        })
        tableData.value = data.list
        page.total = data.total
    } finally {
        loading.value = false
    }
}
/** 编辑前获取数据 */
const getData = (row: Link) => {
    const { linkName, description, avatar, linkUrl, linkId } = row
    Object.assign(formData, { linkName, description, avatar, linkUrl, linkId })
}
/** 清除表单数据 */
const clearData = () => {
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Link] as any) = ""
    })
    // 重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
}
/** 添加友链 */
const handleAdd = async () => {
    if (formData.linkId) {
        await LinkService.updateLink(formData)
    } else {
        await LinkService.addLink(formData)
    }
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    getLinkListData()
}
/** 删除友链 */
const handleDel = async (row: Link) => {
    if (!row.linkId) {
        ElMessage.warning('无效的友链ID')
        return
    }

    try {
        await ElMessageBox.confirm('确定要删除该友链吗？删除后无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            appendTo: document.body,
        })

        await LinkService.delLink(row.linkId)
        ElMessage.success('删除成功')
        getLinkListData()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
/** 搜索 */
const handleSearch = () => {
    getLinkListData()
}

/** 重置 */
const handleReset = () => {
    getLinkListData()
}

onMounted(async () => {
    await getLinkListData()
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

.link-item {
    display: flex;
    align-items: center;
    padding: 8px 0;

    .link-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f7fa;
        flex-shrink: 0;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .link-content {
        margin-left: 12px;
        flex: 1;
        min-width: 0;

        .link-name {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 4px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .link-desc {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.link-url {
    color: #4f46e5;
    font-size: 13px;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}
</style>
