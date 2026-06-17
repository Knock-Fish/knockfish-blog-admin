<template>
    <div ref="divRef" class="page">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading" @current-page="getLinkListData"
            @page-size="getLinkListData">
            <template #header>
                <div class="table-header">
                    <DialogButton permission="link:add" @submit="handleAdd" @closed="clearData">
                        新增友链
                        <template #content>
                            <DynamicForm v-model="formData"
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
                    <div class="icon-list">
                        <DataRefresh @click="getLinkListData" />
                        <FullScreenPage :target-ref="divRef" />
                        <ExcelExport :table-data="tableData" />
                    </div>
                </div>
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
                <a class="link-url" :href="row.linkUrl" target="_blank">{{ row.linkUrl }}</a>
            </template>
            <template #option="{ row }">
                <DialogButton permission="link:edit" :button-props="editButtonProps"
                    :dialog-props="dialogProps" @click="getData(row)"
                    @closed="clearData">
                    编辑
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
                <DialogButton permission="link:delete" :button-props="delButtonProps" @click="handleDel(row)">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { LinkService } from "@/api/linkApi"
import { ElMessage, ElMessageBox, type ButtonProps, type DialogProps } from "element-plus"

type Link = Api.Link.LinkInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>

const query = reactive<Link>({})
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)
const tableData = ref<Link[]>([])
const loading = ref(true)

const page = reactive({
    total: 0,
    pageNum: 1,
    pageSize: 10
})

const formData = reactive<Link>({})
const editButtonProps = ref<ButtonProps>({
    size: "small"
})
const delButtonProps = ref<ButtonProps>({
    size: "small",
    type: "danger"
})
const dialogProps = ref<DialogProps>({
    title: "友链信息"
})

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

const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'linkName', label: '友链信息', slot: 'linkInfo', minWidth: '250', showOverflowTooltip: true },
    { slot: 'linkUrl', label: '链接', minWidth: '200', showOverflowTooltip: true },
    { prop: 'createTime', label: '创建时间', minWidth: '140' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])

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

const getData = (row: Link) => {
    const { linkName, description, avatar, linkUrl, linkId } = row
    Object.assign(formData, { linkName, description, avatar, linkUrl, linkId })
}

const clearData = () => {
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Link] as any) = ""
    })
    if (formRef.value) {
        formRef.value.resetForm()
    }
}

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

const handleSearch = () => {
    getLinkListData()
}

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
