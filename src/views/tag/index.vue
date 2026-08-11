<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :full-target-ref="divRef" @refresh="getTagListData" :page="page"
            slot-header="header" @current-page="getTagListData"
            @page-size="getTagListData">
            <!-- 自定义头部 -->
            <template #header>
                <DialogButton :permission="TagPerm.ADD" @submit="handleAdd"
                    @closed="clearData">
                    新增标签
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems">
                            <template #colorSlot>
                                <div style="margin-left: 10px;">
                                    {{ formData.color || "暂无" }}
                                </div>
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
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
                <ElTag :color="row.color"
                    style="color: #fff; font-weight: bold;">
                    {{ row.tagName }}
                </ElTag>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton :permission="TagPerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps" :dialog-props="dialogProps"
                    @click="getData(row)" @submit="handleUpdate"
                    @closed="clearData">
                    <SvgIcon icon="ri:pencil-line" />
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
                <DialogButton type="confirm" :buttonBorder="false"
                    :permission="TagPerm.DELETE" @click="handleDel(row)"
                    :button-props="delButtonProps">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { TagPerm } from '@/constants'
import { useUserStore } from "@/store/modules/user"
import { TagService } from "@/api/tagApi"
import { ElMessage, ElMessageBox, type ButtonProps, type DialogProps, type DialogEmits } from "element-plus"
type Tag = Api.Tag.TagInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
const userStore = useUserStore()
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
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'tagName', label: '标签名称', minWidth: '150' },
    { prop: 'color', label: '标签颜色', slot: 'color', minWidth: '150' },
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', show: true, permission: ['tag:edit', 'tag:delete'] }
])
useTableColumnPermission(columns)
const editButtonProps = ref<ButtonProps>({
    type: "primary",
    plain: true
})
const delButtonProps = ref<ButtonProps>({
    type: "danger",
    plain: true
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
    await TagService.updateTag(formData)
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    await getTagListData()
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
onMounted(async () => {
    await getTagListData()
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
