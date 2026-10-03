<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :full-target-ref="divRef" @refresh="getList" :page="page"
            :loading="loading" slot-header="header" @current-page="getList"
            @page-size="getList">
            <!-- 自定义头部 -->
            <template #header>
                <DialogButton :permission="TagPerm.ADD" @click="openAdd"
                    @submit="handleAdd" @closed="clearForm">
                    新增标签
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('add', el)"
                            v-model="formData" :form-items="formItems">
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
                    :button-props="editButtonProps" :dialog-props="{ destroyOnClose: true }"
                    @click="openEdit(row)" @submit="handleUpdate"
                    @closed="clearForm">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('edit', el)"
                            v-model="formData" :form-items="formItems">
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
import { onMounted, reactive, ref } from 'vue'
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { useCrudPage } from '@/composables/useCrudPage'
import { TagPerm } from '@/constants'
import { TagService } from '@/api/tagApi'
type Tag = Api.Tag.TagInfo

const divRef = ref<HTMLElement | null>(null)

const {
  query, formData, page, tableData, loading,
  getList, clearForm, handleAdd, handleUpdate, handleDel,
  handleSearch, handleReset, editButtonProps, delButtonProps,
  setFormRef, openAdd, openEdit,
} = useCrudPage<Tag>({
  api: {
    getList: TagService.getTagListData,
    add: TagService.addTag,
    update: TagService.updateTag,
    del: TagService.delTag,
  },
  idKey: 'tagId',
  editFields: (row) => ({ tagId: row.tagId, tagName: row.tagName, color: row.color }),
  initialFormData: { color: '#f4f4f5' },
  messages: {
    delConfirm: '确定要删除该标签吗？删除后无法恢复！',
    invalidId: '无效的标签ID',
  },
})

// --------------- 表单项配置 ---------------
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
// --------------- 表格项配置 ---------------
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'tagName', label: '标签名称', minWidth: '150' },
    { prop: 'color', label: '标签颜色', slot: 'color', minWidth: '150' },
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', show: true, permission: ['tag:edit', 'tag:delete'] }
])
useTableColumnPermission(columns)
// --------------- 搜索栏配置 ---------------
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

onMounted(getList)
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
