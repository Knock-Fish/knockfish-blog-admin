<template>
    <div class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getList" @page-size="getList">
            <!-- 自定义头部 -->
            <template #header>
                <DialogButton :permission="CodeCategoryPerm.ADD" @click="openAdd"
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
                <DialogButton :permission="CodeCategoryPerm.EDIT"
                    :button-props="editButtonProps" @submit="handleUpdate"
                    :buttonBorder="false" :dialog-props="{ destroyOnClose: true }"
                    @click="openEdit(row)" @closed="clearForm">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('edit', el)"
                            v-model="formData" :form-items="formItems" />
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :permission="CodeCategoryPerm.DELETE"
                    :buttonBorder="false"
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
import { CodeCategoryPerm } from '@/constants'
import { CodeCategoryService } from "@/api/codeCategoryApi"

type CodeCategory = Api.CodeCategory.CodeCategoryInfo

const {
  query, formData, page, tableData, loading,
  getList, populateForm, clearForm, handleAdd, handleUpdate, handleDel,
  handleSearch, handleReset, editButtonProps, delButtonProps,
  setFormRef, openAdd, openEdit,
} = useCrudPage<CodeCategory>({
  api: {
    getList: CodeCategoryService.getCodeCategoryList,
    add: CodeCategoryService.addCodeCategory,
    update: CodeCategoryService.updateCodeCategory,
    del: CodeCategoryService.delCodeCategory,
  },
  idKey: 'codeCategoryId',
  // 编辑只回填需要的字段，排除 snippetCount / createTime 冗余字段
  editFields: (row) => ({
    codeCategoryId: row.codeCategoryId,
    codeCategoryName: row.codeCategoryName,
    sort: row.sort,
  }),
  // 排序号允许为空，提交时空值兜底为 0（还原原 handleAdd/handleUpdate 的 `sort || 0` 行为）
  buildPayload: (fd, mode) => ({
    codeCategoryName: fd.codeCategoryName,
    sort: fd.sort || 0,
    ...(mode === 'update' ? { codeCategoryId: fd.codeCategoryId } : {}),
  }),
  messages: {
    delConfirm: '确定要删除该分类吗？删除后无法恢复！',
    delConfirmButton: '确定删除',
    invalidId: '无效的分类ID',
  },
})

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

const columns = reactive([
  { type: 'index', label: '序号' },
  { prop: 'codeCategoryName', label: '分类名称', minWidth: '150' },
  { prop: 'snippetCount', label: '关联片段数量', minWidth: '150' },
  { prop: 'createTime', label: '创建时间', minWidth: '150' },
  { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['code-category:edit', 'code-category:delete'] }
])
useTableColumnPermission(columns)

const searchList = [
  {
    prop: 'codeCategoryName',
    current: 'input',
    label: '分类名称',
    props: { placeholder: '请输入分类名称' }
  }
]

onMounted(() => getList())
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
