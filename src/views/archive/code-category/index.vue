<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getCodeCategoryListData"
            @page-size="getCodeCategoryListData">
            <!-- 自定义头部 -->
            <template #header>
                <div class="table-header">
                    <DialogButton permission="code-category:add"
                        @submit="handleAdd" @closed="clearData">
                        新增分类
                        <template #content>
                            <DynamicForm ref="formRef" v-model="formData"
                                :form-items="formItems" />
                        </template>
                    </DialogButton>
                    <div class="icon-list">
                        <DataRefresh @click="getCodeCategoryListData" />
                        <FullScreenPage :target-ref="divRef" />
                    </div>
                </div>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton permission="code-category:edit"
                    :button-props="editButtonProps" @submit="handleUpdate"
                    @click="getData(row)" @closed="clearData">
                    编辑
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
                <DialogButton permission="code-category:delete"
                    :button-props="delButtonProps" @click="handleDel(row)">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { CodeCategoryService } from "@/api/codeCategoryApi"
import { ElMessage, ElMessageBox, type ButtonProps, type DialogProps } from "element-plus"

type CodeCategory = Api.CodeCategory.CodeCategoryInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>

const query = reactive<CodeCategory>({})
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)
const tableData = ref<CodeCategory[]>([])
const loading = ref(true)
const page = reactive({
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const formData = reactive<Record<string, any>>({})
const editButtonProps = ref<ButtonProps>({ size: "small" })
const delButtonProps = ref<ButtonProps>({ size: "small", type: "danger" })

// 表单配置
const formItems = ref([
    {
        type: 'Input',
        prop: 'codeCategoryName',
        label: '分类名称',
        props: {
            placeholder: '请输入分类名称',
        },
        rules: {
            required: true,
            message: '分类名称不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'sort',
        label: '排序号',
        props: {
            type: 'number',
            placeholder: '请输入排序号',
        },
        rules: {
            required: false,
            message: '',
            trigger: 'blur'
        }
    }
])

const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'codeCategoryName', label: '分类名称', minWidth: '120' },
    { prop: 'snippetCount', label: '关联片段数量', minWidth: '100' },
    { prop: 'createTime', label: '创建时间', minWidth: '160' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])

const getCodeCategoryListData = async () => {
    loading.value = true
    try {
        const data: PaginatingParams<CodeCategory> = await CodeCategoryService.getCodeCategoryList({
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

const getData = (row: CodeCategory) => {
    Object.keys(formData).forEach(key => delete formData[key])
    Object.assign(formData, {
        codeCategoryId: row.codeCategoryId,
        codeCategoryName: row.codeCategoryName,
        sort: row.sort
    })
}

const clearData = () => {
    if (formRef.value) {
        formRef.value.resetForm()
    }
    Object.keys(formData).forEach(key => delete formData[key])
}

const handleAdd = async () => {
    // 表单验证
    if (formRef.value) {
        await formRef.value.validate()
    }
    await CodeCategoryService.addCodeCategory({
        codeCategoryName: formData.codeCategoryName,
        sort: formData.sort || 0
    })
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    await getCodeCategoryListData()
    clearData()
}

const handleUpdate = async () => {
    if (!formData.codeCategoryId) {
        ElMessage.warning('无效的分类ID')
        return
    }
    await CodeCategoryService.updateCodeCategory({
        codeCategoryId: formData.codeCategoryId,
        codeCategoryName: formData.codeCategoryName,
        sort: formData.sort || 0
    })
    ElMessage.success('编辑成功')
    getCodeCategoryListData()
}

const handleDel = async (row: CodeCategory) => {
    if (!row.codeCategoryId) {
        ElMessage.warning('无效的分类ID')
        return
    }
    try {
        await ElMessageBox.confirm('确定要删除该分类吗？删除后无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            appendTo: document.body,
        })
        await CodeCategoryService.delCodeCategory(row.codeCategoryId)
        ElMessage.success('删除成功')
        getCodeCategoryListData()
    } catch {
        ElMessage.info('已取消')
    }
}

const handleSearch = () => getCodeCategoryListData()
const handleReset = () => getCodeCategoryListData()

const searchList = [
    {
        prop: 'codeCategoryName',
        current: 'input',
        label: '分类名称',
        props: { placeholder: '请输入分类名称' }
    }
]

onMounted(() => getCodeCategoryListData())
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
</style>
