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
                <DialogButton :permission="SitePerm.ADD" @click="openAdd"
                    @submit="handleAdd" @closed="clearForm">
                    新增站点
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('add', el)"
                            v-model="formData" :form-items="formItems">
                            <template #ico>
                                <img style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.ico">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
            </template>
            <template #ico="{ row }">
                <div class="site">
                    <img :src="row.ico" alt="" />
                    <div class="info">
                        <p class="site-name">{{ row.siteName }} </p>
                        <p class="description">{{ row.description }}</p>
                    </div>
                </div>
            </template>
            <template #siteUrl="{ row }">
                <a style="color: #7893FE;" :href="row.siteUrl"
                    target="_blank">{{
                        row.siteUrl }}</a>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton :permission="SitePerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps"
                    :dialog-props="{ title: '站点信息', destroyOnClose: true }"
                    @click="openEdit(row)" @submit="handleUpdate" @closed="clearForm">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('edit', el)"
                            v-model="formData" :form-items="formItems">
                            <template #ico>
                                <img style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.ico">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :permission="SitePerm.DELETE"
                    :buttonBorder="false" :button-props="delButtonProps"
                    @click="handleDel(row)">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { onMounted, reactive, ref, watch } from 'vue'
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { useCrudPage } from '@/composables/useCrudPage'
import { SitePerm } from '@/constants'
import { SiteService } from "@/api/siteApi"
import { CategoryService } from "@/api/categoryApi"
type Site = Api.Site.SiteInfo
type Category = Api.Category.CategoryInfo
interface CategoryOptions {
    value: Category['categoryId']
    label: Category['categoryName']
}

const {
  query, formData, page, tableData, loading,
  getList, populateForm, clearForm, handleAdd, handleUpdate, handleDel,
  handleSearch, handleReset, editButtonProps, delButtonProps,
  setFormRef, openAdd, openEdit,
} = useCrudPage<Site>({
  api: {
    getList: SiteService.getSiteListData,
    add: SiteService.addSite,
    update: SiteService.updateSite,
    del: SiteService.delSite,
  },
  idKey: 'siteId',
  // 编辑只回填需要的字段，排除 createTime / categoryName 等冗余字段，避免误提交
  editFields: (row) => ({
    siteId: row.siteId,
    siteName: row.siteName,
    description: row.description,
    ico: row.ico,
    siteUrl: row.siteUrl,
    categoryId: row.categoryId,
  }),
  messages: {
    delConfirm: '确定要删除该站点吗？删除后无法恢复！',
    delConfirmButton: '确定删除',
    invalidId: '无效的站点ID',
  },
})

// --------------- 分类下拉选项（页面特有逻辑，保留在页面） ---------------
const categoryOptions = ref<CategoryOptions[]>([])
const loadCategoryOptions = () => {
  CategoryService.getCategoryOptions().then((data) => {
    categoryOptions.value = data.map(item => ({
      value: item.categoryId,  // 数值类型，与 editFields 回填的 categoryId 一致
      label: item.categoryName,
    }))
  })
}
interface FormItemConfig {
  type: string
  prop?: string
  label?: string
  slot?: string
  props?: Record<string, any>
  rules?: Record<string, any>
  options?: any[]
}
// 基础表单配置
const baseFormItems: FormItemConfig[] = [
  {
    type: 'Input',
    prop: 'siteName',
    label: '名称',
    slot: "ico",
    props: {
      placeholder: '请输入站点名称',
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
    prop: 'ico',
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
    prop: 'siteUrl',
    label: '链接',
    props: {
      placeholder: '请输入链接',
    },
    rules: {
      required: true,
      message: '名称不能为空',
      trigger: 'blur'
    }
  },
  {
    type: 'Select',
    prop: 'categoryId',
    label: '所属分类',
    props: {
      placeholder: '请选择分类',
      clearable: true,
    },
    rules: {
      required: true,
      message: '类别不能为空',
      trigger: 'change'
    }
  }
]
// 动态表单配置：把分类选项注入到 categoryId 表单项
const formItems = ref<FormItemConfig[]>(
  baseFormItems.map(item =>
    item.prop === 'categoryId'
      ? { ...item, options: categoryOptions.value }
      : item
  )
)
// 选项加载完后，刷新 formItems 让 Select 拿到最新 options
watch(categoryOptions, (val) => {
  formItems.value = baseFormItems.map(item =>
    item.prop === 'categoryId' ? { ...item, options: val } : item
  )
}, { immediate: false })

const columns = reactive([
  { type: 'index', label: '序号' },
  { prop: 'siteName', label: '站点名称', slot: 'ico', minWidth: '150', showOverflowTooltip: true },
  { slot: 'siteUrl', label: 'URL', minWidth: '180', showOverflowTooltip: true },
  { prop: 'createTime', label: '创建时间', minWidth: '150' },
  { prop: 'categoryName', label: '所属分类', minWidth: '150' },
  { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['site:edit', 'site:delete'] }
])
useTableColumnPermission(columns)

/** 搜索栏配置 */
const searchList = [
  {
    prop: 'siteName',
    current: 'input',
    label: "站点名称",
    props: {
      placeholder: "请输入站点名称"
    }
  },
  {
    prop: 'categoryName',
    current: 'input',
    label: "所属分类",
    props: {
      placeholder: "请输入分类"
    }
  }
]

onMounted(async () => {
  await getList()
  loadCategoryOptions()
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

.site {
  display: flex;
  align-items: center;

  img {
    width: 30px;
    height: 30px;
    /* vertical-align: middle; */
  }

  .info {
    margin-left: 10px;

    .site-name {
      font-size: 13px;
      font-weight: bold;
    }

    .description {
      font-size: 11px;
      color: #5f7f9e;
    }
  }

}
</style>
