<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" slot-header="header" :table-data="tableData"
            :columns="columns" :page="page" @current-page="getCategoryListData"
            @page-size="getCategoryListData">
            <!-- 自定义头部 -->
            <template #header>
                <div class="table-header">
                    <DialogButton permission="category:add" @submit="handleAdd"
                        @closed="clearData">
                        新增分类
                        <template #content>
                            <DynamicForm v-model="formData"
                                :form-items="formItems" />
                        </template>
                    </DialogButton>
                    <div class="icon-list">
                        <DataRefresh @click="getCategoryListData" />
                        <FullScreenPage :target-ref="divRef" />
                        <ExcelExport :table-data="tableData" />
                    </div>
                </div>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton permission="category:edit"
                    :button-props="editButtonProps" @click="getData(row)"
                    @submit="handleUpdate" @closed="clearData">
                    编辑
                    <template #content>
                        <DynamicForm v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
                <DialogButton permission="category:delete"
                    @click="handleDel(row)" :button-props="delButtonProps">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { CategoryService } from '@/api/categoryApi'
import { ElMessage, ElMessageBox, type ButtonProps, type DialogProps, type DialogEmits } from "element-plus"
type Category = Api.Category.CategoryInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
const query = reactive<Category>({})
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)    // 根标签DOM
const tableData = ref<Category[]>([])
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const editButtonProps = ref<ButtonProps>({
    size: "small"
})
const delButtonProps = ref<ButtonProps>({
    size: "small",
    type: "danger"
})
const formData = reactive<Category>({})
const formItems = ref([
    {
        type: 'Input',
        prop: 'categoryName',
        label: '名称',
        slot: "ico",
        props: {
            placeholder: '请输入分类名称',
        },
        rules: {
            required: true,
            message: '名称不能为空',
            trigger: 'blur'
        }
    },
])
const getCategoryListData = async () => {
    const data: PaginatingParams<Category> = await CategoryService.getCategoryListData({
        ...query,
        pageNum: page.pageNum,  // 当前页码
        pageSize: page.pageSize,    // 每页条数
    })
    tableData.value = data.list
    page.total = data.total
}
const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'categoryName', label: '类别', minWidth: '80' },
    { prop: 'createTime', label: '创建时间', minWidth: '100' },
    { prop: 'siteCount', label: '关联站点数量', minWidth: '70' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])
const handleAdd = async () => {
    await CategoryService.addCategory(formData)
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    getCategoryListData()
}
const handleDel = async (row: Category) => {
    if (!row.categoryId) {
        ElMessage.warning('无效的标签ID')
        return
    }
    try {
        await ElMessageBox.confirm('确定要删除该文章吗？删除后无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            appendTo: document.body,
        })

        // 确认后才执行
        await CategoryService.delCategory(row.categoryId)
        ElMessage.success('删除成功')
        getCategoryListData()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
/** 编辑 */
const handleUpdate = async () => {
    await CategoryService.updateCategory(formData)
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    getCategoryListData()
}
/** 编辑前获取数据 */
const getData = (row: Category) => {
    const { categoryId, categoryName } = row
    Object.assign(formData, { categoryId, categoryName })
}
const clearData = () => {
    // 清空formData数据
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Category] as any) = ""
    })
    // 清除表单数据，重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
}
/** 搜索栏配置 */
const searchList = [
    {
        prop: 'categoryName',
        current: 'input',
        label: "类别",
        props: {
            placeholder: "请输入类别"
        }
    }
]
/** 搜索重置 */
const handleReset = () => {
    getCategoryListData()
}
/** 搜索 */
const handleSearch = () => {
    getCategoryListData()
}
onMounted(() => {
    getCategoryListData()
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
</style>
