<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" slot-header="header" :table-data="tableData"
            :columns="columns" :page="page" :loading="loading" @current-page="getList"
            @page-size="getList">
            <!-- 自定义头部 -->
            <template #header>
                <DialogButton :permission="CategoryPerm.ADD" @click="openAdd"
                    @submit="handleAdd" @closed="clearForm">
                    新增分类
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('add', el)"
                            v-model="formData" :form-items="formItems" />
                    </template>
                </DialogButton>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton :permission="CategoryPerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps" :dialog-props="{ destroyOnClose: true }"
                    @click="openEdit(row)" @submit="handleUpdate" @closed="clearForm">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('edit', el)"
                            v-model="formData" :form-items="formItems" />
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :buttonBorder="false" :permission="CategoryPerm.DELETE"
                    :button-props="delButtonProps" @click="handleDel(row)">
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
import { CategoryPerm } from '@/constants'
import { CategoryService } from '@/api/categoryApi'
import type { ButtonProps } from 'element-plus'
type Category = Api.Category.CategoryInfo

const divRef = ref<HTMLElement | null>(null)    // 根标签DOM

const {
  query, formData, page, tableData, loading,
  getList, populateForm, clearForm, handleAdd, handleUpdate, handleDel,
  handleSearch, handleReset, editButtonProps, delButtonProps,
  setFormRef, openAdd, openEdit,
} = useCrudPage<Category>({
  api: {
    getList: CategoryService.getCategoryListData,
    add: CategoryService.addCategory,
    update: CategoryService.updateCategory,
    del: CategoryService.delCategory,
  },
  idKey: 'categoryId',
  editFields: (row) => ({ categoryId: row.categoryId, categoryName: row.categoryName }),
  messages: {
    delConfirm: '确定要删除该分类吗？删除后无法恢复！',
    invalidId: '无效的分类ID',
  },
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
