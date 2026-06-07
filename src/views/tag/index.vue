<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset" :search-list="searchList"
            :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData" :page="page" slot-header="header"
            @current-page="getTagListData" @page-size="getTagListData">
            <!-- 自定义头部 -->
            <template #header>
                <div class="table-header">
                    <DialogButton permission="tag:add" @submit="handleAdd" @closed="clearData">
                        新增标签
                        <template #content>
                            <DynamicForm ref="formRef" v-model="formData" :form-items="formItems">
                                <template #colorSlot>
                                    <div style="margin-left: 10px;">
                                        {{ formData.color || "暂无" }}
                                    </div>
                                </template>
                            </DynamicForm>
                        </template>
                    </DialogButton>
                    <div class="icon-list">
                        <DataRefresh @click="getTagListData" />
                        <FullScreenPage :target-ref="divRef" />
                        <ExcelExport :table-data="tableData" />
                    </div>
                </div>
            </template>
            <template #color="{ row }">
                <div style="display: flex; gap: 5px;">
                    <div class="column-color" :style="{
                        backgroundColor: row.color,
                        width: '20px',
                        height: '20px',
                    }" />
                    <div>{{ row.color }}</div>
                </div>
            </template>
            <template #preview="{ row }">
                <ElTag :color="row.color" style="color: #fff; font-weight: bold;">
                    {{ row.tagName }}
                </ElTag>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton permission="tag:edit" :button-props="editButtonProps" :dialog-props="dialogProps"
                    @click="getData(row)" @submit="handleUpdate" @closed="clearData">
                    编辑
                    <template #content>
                        <DynamicForm v-model="formData" :form-items="formItems">
                            <template #colorSlot>
                                <div style="margin-left: 10px;">
                                    {{ formData.color || "暂无" }}
                                </div>
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton type="button" permission="tag:delete" @click="handleDel(row)" :button-props="delButtonProps">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import SearchBar from "@comps/search-bar/index.vue"
import { TagService } from "@/api/tagApi"
import { ElMessage, ElMessageBox, type ButtonProps, type DialogProps, type DialogEmits } from "element-plus"
type Tag = Api.Tag.TagInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)
const query = reactive<Tag>({})
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const formData = reactive<Tag>({
    color: '#f4f4f5'
})
const tableData = ref<Tag[]>([])
const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'tagName', label: '标签名称', minWidth: '150' },
    { prop: 'color', label: '标签颜色', slot: 'color', minWidth: '150' },
    { label: '预览', slot: 'preview', minWidth: '150' },
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])
const editButtonProps = ref<ButtonProps>({
    size: "small"
})
const delButtonProps = ref<ButtonProps>({
    size: "small",
    type: "danger"
})
const formItems = ref([
    {
        type: 'Input',
        prop: 'tagName',
        label: '标签名称',
        props: {
            placeholder: '请输入标签名称',
        },
        rules: {
            required: true,
            message: '名称不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'ColorPicker',
        prop: 'color',
        label: '标签颜色',
        slot: 'colorSlot',
        rules: {
            required: true,
            message: '请选择颜色',
            trigger: 'blur'
        },
    },
])
const buttonProps = ref<ButtonProps>({
    size: "small"
})
const dialogProps = ref<DialogProps>({})
const handleAdd = async () => {
    await TagService.addTag(formData)
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    getTagListData()
}
const handleDel = async (row: Tag) => {
    if (!row.tagId) {
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
        await TagService.delTag(row.tagId)
        ElMessage.success('删除成功')
        getTagListData()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
/** 编辑 */
const handleUpdate = async () => {
    await TagService.updataTag(formData)
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    getTagListData()
}
const clearData = () => {
    // 清空formData数据
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Tag] as any) = ""
    })
    // 清除表单数据，重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
}
const getTagListData = async () => {
    const data: PaginatingParams<Tag> = await TagService.getTagListData({
        ...query,
        pageNum: page.pageNum,  // 当前页码
        pageSize: page.pageSize,    // 每页条数
    })
    tableData.value = data.list
    page.total = data.total
}
/** 编辑前获取数据 */
const getData = (row: Tag) => {
    const { tagId, tagName, color } = row
    Object.assign(formData, { tagId, tagName, color })
}
/** 搜索栏配置 */
const searchList = [
    {
        prop: 'tagName',
        current: 'input',
        label: "标签名",
        props: {
            placeholder: "请输入标签名称"
        }
    }
]
/** 搜索 */
const handleSearch = () => {
    getTagListData()
}
/** 搜索重置 */
const handleReset = () => {
    getTagListData()
}
onMounted(() => {
    getTagListData()
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
