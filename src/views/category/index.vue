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
                <DialogButton :permission="CategoryPerm.ADD" @submit="handleAdd"
                    @closed="clearData">
                    新增分类
                    <template #content>
                        <DynamicForm v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton :permission="CategoryPerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps" @click="getData(row)"
                    @submit="handleUpdate" @closed="clearData">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :buttonBorder="false" :permission="CategoryPerm.DELETE"
                    @click="handleDel(row)" :button-props="delButtonProps">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { CategoryPerm } from '@/constants'
import { CategoryService } from '@/api/categoryApi'
import { ElMessage, ElMessageBox, type ButtonProps } from "element-plus"
type Category = Api.Category.CategoryInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
const query = reactive<Category>({})    // 搜索关键词
const formRef = ref()   // 表单DOM
const divRef = ref<HTMLElement | null>(null)    // 根标签DOM
const tableData = ref<Category[]>([])   // 表格数据
const formData = reactive<Category>({}) // 表单数据
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
// --------------- 表单项配置 ---------------
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
// --------------- 表格项配置 ---------------
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'categoryName', label: '类别', minWidth: '150' },
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'siteCount', label: '关联站点数量', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['category:edit', 'category:delete'] }
])
useTableColumnPermission(columns)
// --------------- 搜索栏配置 ---------------
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
/** 获取站点分类数据 */
const getCategoryListData = async () => {
    const data: PaginatingParams<Category> = await CategoryService.getCategoryListData({
        ...query,
        pageNum: page.pageNum,  // 当前页码
        pageSize: page.pageSize,    // 每页条数
    })
    tableData.value = data.list
    page.total = data.total
}
/** 添加分类 */
const handleAdd = async () => {
    await CategoryService.addCategory(formData)
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    getCategoryListData()
}
/** 删除分类 */
const handleDel = async (row: Category) => {
    if (!row.categoryId) {
        ElMessage.warning('无效的分类ID')
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
/** 编辑分类 */
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
/** 清除表单数据 */
const clearData = () => {
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Category] as any) = ""
    })
    // 重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
}

/** 搜索重置 */
const handleReset = () => {
    getCategoryListData()
}
/** 搜索 */
const handleSearch = () => {
    getCategoryListData()
}
onMounted(async () => {
    await getCategoryListData()
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
}
</style>
