<template>
  <div ref="divRef" class="page">
    <Transition name="fade" mode="out-in">
      <div class="table-snippet" v-if="!isEditor" key="table">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
          :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
          :page="page" slot-header="header" :loading="loading"
          @current-page="getCodeSnippetListData"
          @page-size="getCodeSnippetListData">
          <template #header>
            <div class="table-header">
              <el-button type="primary" @click="handleAdd">
                新增片段
              </el-button>
              <div class="icon-list">
                <DataRefresh @click="getCodeSnippetListData" />
                <FullScreenPage :target-ref="divRef" />
              </div>
            </div>
          </template>
          <template #codeContent="{ row }">
            <el-tooltip :content="row.codeContent" placement="top"
              :show-after="300">
              <span class="code-preview">{{ row.codeContent }}</span>
            </el-tooltip>
          </template>
          <template #option="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" link @click="handleDel(row)">
              删除
            </el-button>
          </template>
        </PageTable>
      </div>
      <div class="editor" v-else key="editor">
        <ElPageHeader icon="" title="返回" @back="onBack">
          <template #icon>
            <SvgIcon icon="mdi:arrow-left-bold" />
          </template>
          <template #extra>
            <div class="action-buttons">
              <ElButton @click="onBack">取消</ElButton>
              <ElButton type="primary">保存</ElButton>
            </div>
          </template>
        </ElPageHeader>
        <div class="form-row">
          <div class="form-item">
            <span class="label">标题：</span>
            <ElInput placeholder="请输入片段标题" show-word-limit clearable />
          </div>
          <div class="form-item">
            <span class="label">分类：</span>
            <ElSelect placeholder="请选择分类" clearable>
              <ElOption :label="item.codeCategoryName" :value="item.codeCategoryId ?? 0" v-for="item in categoryOptions" :key="item.codeCategoryId ?? 0" />
            </ElSelect>
          </div>
        </div>
        <div class="md-editor">
          <MdEditor :theme="isDark ? 'dark' : 'light'" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { CodeSnippetService } from "@/api/codeSnippetApi"
import { CodeCategoryService } from "@/api/codeCategoryApi"
import { ElMessage, ElMessageBox } from "element-plus"
import { useRouter } from "vue-router"
import { MdEditor } from 'md-editor-v3'
type CodeSnippet = Api.CodeSnippet.CodeSnippetInfo
type CodeCategory = Api.CodeCategory.CodeCategoryInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
import 'md-editor-v3/lib/style.css'

const router = useRouter()
const isDark = useDark()
const query = reactive<CodeSnippet>({})
const divRef = ref<HTMLElement | null>(null)
const tableData = ref<CodeSnippet[]>([])
const loading = ref(true)
const page = reactive({ total: 0, pageNum: 1, pageSize: 10 })
const isEditor = ref<boolean>(false)
const categoryOptions = ref<CodeCategory[]>([])
const columns = ref([
  { type: "index", label: "序号" },
  { prop: "title", label: "片段标题", minWidth: "150", showOverflowTooltip: true },
  { prop: "codeCategoryName", label: "所属分类", minWidth: "100" },
  { prop: "codeContent", label: "代码内容", slot: "codeContent", minWidth: "200", showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", minWidth: "160" },
  { prop: "action", label: "操作", fixed: "right", slot: "option", minWidth: "150" }
])

/** 返回列表视图 */
const onBack = () => {
  isEditor.value = false
}

const getCodeSnippetListData = async () => {
  loading.value = true
  try {
    const data: PaginatingParams<CodeSnippet> = await CodeSnippetService.getCodeSnippetList({ ...query, pageNum: page.pageNum, pageSize: page.pageSize })
    tableData.value = data.list
    page.total = data.total
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEditor.value = true
}

const handleEdit = (row: CodeSnippet) => {
  isEditor.value = true
}

const handleDel = async (row: CodeSnippet) => {
  if (!row.codeSnippetId) {
    ElMessage.warning("无效的片段ID")
    return
  }
  try {
    await ElMessageBox.confirm("确定要删除该片段吗？删除后无法恢复！", "警告", { confirmButtonText: "确定删除", cancelButtonText: "取消", type: "warning", appendTo: document.body })
    await CodeSnippetService.delCodeSnippet(row.codeSnippetId)
    ElMessage.success("删除成功")
    getCodeSnippetListData()
  } catch {
    ElMessage.info("已取消")
  }
}

const handleSearch = () => getCodeSnippetListData()
const handleReset = () => getCodeSnippetListData()

const searchList = [{ prop: "title", current: "input", label: "片段标题", props: { placeholder: "请输入片段标题" } }]

const getCategoryOptions = async () => {
  const data = await CodeCategoryService.getCodeCategoryOptions()
  categoryOptions.value = data
}

onMounted(async () => {
  await getCategoryOptions()
  getCodeSnippetListData()
})
</script>

<style lang="scss" scoped>
.page {
  @include page;
  position: relative;
  overflow: hidden;

  // 过渡动画
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .fade-enter-from {
    opacity: 0;
    transform: translateX(30px) scale(0.98);
  }

  .fade-leave-to {
    opacity: 0;
    transform: translateX(-30px) scale(0.98);
  }

  // 两个容器都要占满父容器
  .table-snippet,
  .editor {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
  }

  .table-snippet {
    .search {
      flex: 0 0 auto;
    }

    .table {
      margin-top: 10px;
      flex: 1 1 auto;
      min-height: 0;

      .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .icon-list {
          display: flex;
          gap: 8px;
        }
      }

      .code-preview {
        display: inline-block;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
        font-family: monospace;
        font-size: 12px;
        color: #666;
      }
    }
  }

  .editor {
    .form-row {
      display: flex;
      gap: 16px;
      margin: 15px 0;
      padding: 0 4px;

      .form-item {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;

        .label {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }

        :deep(.el-input),
        :deep(.el-select) {
          flex: 1;
        }
      }
    }

    .md-editor {
      flex: 1;
      min-height: 0;
      border: 1px solid var(--border-color);

      :deep(.md-editor) {
        height: 100%;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .editor {
    .form-row {
      flex-direction: column;
      gap: 12px;
      margin: 10px 0;

      .form-item {
        width: 100%;
      }
    }
  }
}
</style>