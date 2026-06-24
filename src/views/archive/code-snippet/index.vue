<template>
  <div ref="divRef" class="page">
    <!-- PC端侧边栏 -->
    <div 
      class="sidebar" 
      v-if="!isSmallScreen"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <div class="sidebar-content">
        <div class="category-select">
          <el-select v-model="selectedCategory" placeholder="选择分类" clearable
            @change="handleCategoryChange">
            <el-option v-for="item in categoryOptions"
              :key="item.codeCategoryId ?? 0" :label="item.codeCategoryName"
              :value="item.codeCategoryId ?? 0"></el-option>
          </el-select>
        </div>
        <div class="snippet-list">
          <div class="list-header">
            <span>片段列表</span>
            <span class="count">{{ snippetList.length }} 个</span>
          </div>
          <div class="list-content">
            <div v-for="snippet in snippetList" :key="snippet.codeSnippetId"
              class="snippet-item"
              :class="{ active: currentSnippetId === snippet.codeSnippetId }"
              @click="handleSelectSnippet(snippet)">
              <SvgIcon icon="mdi:code-tags" class="snippet-icon" />
              <span class="snippet-title">{{ snippet.title }}</span>
              <el-button type="danger" size="small" link class="delete-btn"
                @click.stop="handleDel(snippet)">
                <SvgIcon icon="mdi:delete">删除</SvgIcon>
              </el-button>
            </div>
            <div v-if="snippetList.length === 0" class="empty-tip">
              暂无片段
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端抽屉 统一样式 修复close清空问题 -->
    <ElDrawer
      v-model="drawerVisible"
      title="代码片段列表"
      direction="ltr"
      size="280px"
      :body-style="{ padding: '0' }"
      @close="drawerVisible = false"
    >
      <div class="sidebar-drawer-inner">
        <div class="category-select">
          <el-select v-model="selectedCategory" placeholder="选择分类" clearable
            @change="handleCategoryChange">
            <el-option v-for="item in categoryOptions"
              :key="item.codeCategoryId ?? 0" :label="item.codeCategoryName"
              :value="item.codeCategoryId ?? 0"></el-option>
          </el-select>
        </div>
        <div class="snippet-list">
          <div class="list-header">
            <span>片段列表</span>
            <span class="count">{{ snippetList.length }} 个</span>
          </div>
          <div class="list-content">
            <div v-for="snippet in snippetList" :key="snippet.codeSnippetId"
              class="snippet-item"
              :class="{ active: currentSnippetId === snippet.codeSnippetId }"
              @click="()=>{handleSelectSnippet(snippet);drawerVisible=false}">
              <SvgIcon icon="mdi:code-tags" class="snippet-icon" />
              <span class="snippet-title">{{ snippet.title }}</span>
              <el-button type="danger" size="small" link class="delete-btn"
                @click.stop="handleDel(snippet)">
                <SvgIcon icon="mdi:delete" />
              </el-button>
            </div>
            <div v-if="snippetList.length === 0" class="empty-tip">
              暂无片段
            </div>
          </div>
        </div>
      </div>
    </ElDrawer>

    <!-- 右侧编辑器区域 -->
    <div class="main-area">
      <div class="editor-section">
        <div class="editor-header">
          <div class="sidebar-toggle">
            <el-button 
              @click="isSmallScreen ? drawerVisible = true : sidebarCollapsed = !sidebarCollapsed"
              class="collapse-btn" circle size="small"
            >
              <SvgIcon
                :icon="isSmallScreen ? 'mdi:menu' : (sidebarCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-left')" 
              />
            </el-button>
            <span class="editor-title">
              <SvgIcon icon="mdi:pencil" />
              {{ editorTitle || '代码编辑器' }}
            </span>
          </div>

          <div class="editor-actions">
            <el-button @click="handleClear()" size="small">
              新增
            </el-button>
            <el-button type="primary" @click="handleSave" size="small">
              保存
            </el-button>
          </div>
        </div>
        <div class="editor-form">
          <div class="form-row">
            <div class="form-item">
              <span class="label">标题：</span>
              <el-input v-model="editorForm.title" placeholder="请输入片段标题"
                show-word-limit clearable maxlength="100" />
            </div>
            <div class="form-item">
              <span class="label">分类：</span>
              <el-select v-model="editorForm.codeCategoryId" placeholder="请选择分类"
                clearable>
                <el-option v-for="item in categoryOptions"
                  :key="item.codeCategoryId ?? 0" :label="item.codeCategoryName"
                  :value="item.codeCategoryId ?? 0"></el-option>
              </el-select>
            </div>
          </div>
        </div>
        <div class="md-editor">
          <MdEditor v-model="editorForm.codeContent"
            :theme="isDark ? 'dark' : 'light'" placeholder="请输入代码内容..." />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CodeSnippetService } from "@/api/codeSnippetApi"
import { CodeCategoryService } from "@/api/codeCategoryApi"
import { ElMessage, ElMessageBox } from "element-plus"
import { MdEditor } from 'md-editor-v3'

type CodeSnippet = Api.CodeSnippet.CodeSnippetInfo
type CodeCategory = Api.CodeCategory.CodeCategoryInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>

import 'md-editor-v3/lib/style.css'
const isDark = useDark()
// 响应式状态
const { width } = useWindowSize()
// 响应式断点
const SMALL_SCREEN_BREAKPOINT = 900
// 是否为小屏幕
const isSmallScreen = computed(() => width.value < SMALL_SCREEN_BREAKPOINT)

// 侧边栏状态
const sidebarCollapsed = ref(false)
const drawerVisible = ref(false)

// 窗口宽度变化监听：拉宽到大屏自动关闭抽屉
watch(width, (newWidth) => {
  if (newWidth >= SMALL_SCREEN_BREAKPOINT) {
    drawerVisible.value = false
  }
})

// 分类和片段列表
const categoryOptions = ref<CodeCategory[]>([])
const selectedCategory = ref<number | undefined>(undefined)
const snippetList = ref<CodeSnippet[]>([])

// 编辑器状态
const currentSnippetId = ref<number | undefined>(undefined)
const editorTitle = ref<string>('')
const editorForm = reactive({
  codeSnippetId: undefined as number | undefined,
  title: '',
  codeCategoryId: undefined as number | undefined,
  codeContent: ''
})

// ==================== 业务方法 ====================
const getCategoryOptions = async () => {
  try {
    const res = await CodeCategoryService.getCodeCategoryOptions()
    categoryOptions.value = res || []
  } catch (error) {
    console.error('获取分类列表失败', error)
  }
}

const getSnippetList = async () => {
  try {
    const categoryId = selectedCategory.value ?? 0
    const res = await CodeSnippetService.getCodeSnippetList({ categoryId })
    snippetList.value = res.list || []
  } catch (error) {
    console.error('获取片段列表失败', error)
  }
}

// 点击片段回填编辑器
const handleSelectSnippet = (snippet: CodeSnippet) => {
  currentSnippetId.value = snippet.codeSnippetId
  editorTitle.value = `编辑: ${snippet.title}`
  editorForm.codeSnippetId = snippet.codeSnippetId
  editorForm.title = snippet.title || ''
  editorForm.codeCategoryId = snippet.codeCategoryId
  editorForm.codeContent = snippet.codeContent || ''
}

/**
 * 清空编辑器（新增按钮调用）
 * @param keepCategory 是否保留当前选中分类
 */
const handleClear = (keepCategory = true) => {
  currentSnippetId.value = undefined
  editorTitle.value = '新增片段'
  editorForm.codeSnippetId = undefined
  editorForm.title = ''
  editorForm.codeContent = ''
  if (!keepCategory) {
    editorForm.codeCategoryId = undefined
  } else {
    editorForm.codeCategoryId = selectedCategory.value
  }
}

// 保存片段
const handleSave = async () => {
  if (!editorForm.title) {
    ElMessage.warning('请输入片段标题')
    return
  }
  if (!editorForm.codeCategoryId) {
    ElMessage.warning('请选择分类')
    return
  }
  if (!editorForm.codeContent) {
    ElMessage.warning('请输入代码内容')
    return
  }

  try {
    if (editorForm.codeSnippetId) {
      await CodeSnippetService.updateCodeSnippet({
        codeSnippetId: editorForm.codeSnippetId,
        title: editorForm.title,
        codeCategoryId: editorForm.codeCategoryId,
        codeContent: editorForm.codeContent
      })
      ElMessage.success('修改成功')
    } else {
      await CodeSnippetService.addCodeSnippet({
        codeCategoryId: editorForm.codeCategoryId,
        title: editorForm.title,
        codeContent: editorForm.codeContent
      })
      ElMessage.success('新增成功')
    }
    await getSnippetList()
    handleClear()
  } catch (error) {
    console.error('保存片段失败', error)
    ElMessage.error('保存失败')
  }
}

// 删除片段
const handleDel = async (snippet: CodeSnippet) => {
  if (!snippet.codeSnippetId) {
    ElMessage.warning("无效的片段ID")
    return
  }
  try {
    await ElMessageBox.confirm(
      "确定要删除该片段吗？删除后无法恢复！",
      "警告",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        appendTo: document.body
      }
    )
    await CodeSnippetService.delCodeSnippet(snippet.codeSnippetId)
    ElMessage.success("删除成功")
    // 如果删除的是当前正在编辑的片段，则清空编辑器
    if (currentSnippetId.value === snippet.codeSnippetId) handleClear()
    await getSnippetList()
  } catch {
    ElMessage.info("已取消")
  }
}

// 切换分类，只刷新列表，不清空编辑器
const handleCategoryChange = () => {
  getSnippetList()
}

onMounted(async () => {
  await getCategoryOptions()
  await getSnippetList()
})
</script>

<style lang="scss" scoped>
.page {
  height: calc(100vh - 100px);
  position: relative;
  display: flex;
  flex-direction: row;
  overflow: hidden;

  // PC侧边栏
  .sidebar {
    width: 280px;
    background: var(--bg-color);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    overflow: hidden;

    &.collapsed {
      width: 0;
    }

    .sidebar-content {
      min-width: 280px;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .category-select {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
        :deep(.el-select) { width: 100%; }
      }

      .snippet-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .list-header {
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          .count { font-size: 12px; color: var(--text-color-secondary); }
        }

        .list-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          scrollbar-width: none;

          .snippet-item {
            padding: 10px 12px;
            margin-bottom: 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;

            &:hover { background: var(--fill-color-light); }
            &.active {
              background: var(--color-primary-light-9);
              color: var(--color-primary);
              font-weight: 500;
            }

            .snippet-icon { font-size: 16px; flex-shrink: 0; }
            .snippet-title {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 14px;
            }
            .delete-btn {
              opacity: 0;
              transition: opacity 0.2s;
              padding: 4px;
            }
            &:hover .delete-btn { opacity: 1; }
          }

          .empty-tip {
            padding: 40px 20px;
            text-align: center;
            color: var(--text-color-secondary);
            font-size: 14px;
          }
        }
      }
    }
  }

  // 右侧编辑器
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;

    .editor-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;

      .editor-header {
        height: 50px;
        padding: 0 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-color);
        flex-shrink: 0;

        .sidebar-toggle {
          display: flex;
          gap: 15px;
          .editor-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-color);
          }
        }
        .editor-actions { display: flex; gap: 8px; }
      }

      .editor-form {
        padding: 12px 0 12px 10px;
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
        .form-row {
          display: flex;
          gap: 16px;
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
            :deep(.el-input), :deep(.el-select) { flex: 1; }
          }
        }
      }

      .md-editor {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--border-color);
        :deep(.md-editor) { height: 100%; }
      }
    }
  }

  // 移动端媒体查询
  @media (max-width: 768px) {
    .page {
      flex-direction: column;
      padding-top: 50px;
      .sidebar { display: none !important; }
      .main-area {
        .editor-section {
          .editor-form {
            .form-row {
              flex-direction: column;
              gap: 12px;
              .form-item { width: 100%; }
            }
          }
        }
      }
    }
  }
}

// 抽屉内部统一样式（和PC侧边栏完全一致）
.sidebar-drawer-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .category-select {
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    :deep(.el-select) { width: 100%; }
  }

  .snippet-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .list-header {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      .count { font-size: 12px; color: var(--text-color-secondary); }
    }

    .list-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      scrollbar-width: none;

      .snippet-item {
        padding: 10px 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;

        &:hover { background: var(--fill-color-light); }
        &.active {
          background: var(--color-primary-light-9);
          color: var(--color-primary);
          font-weight: 500;
        }

        .snippet-icon { font-size: 16px; flex-shrink: 0; }
        .snippet-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }
        .delete-btn {
          opacity: 0;
          transition: opacity 0.2s;
          padding: 4px;
        }
        &:hover .delete-btn { opacity: 1; }
      }

      .empty-tip {
        padding: 40px 20px;
        text-align: center;
        color: var(--text-color-secondary);
        font-size: 14px;
      }
    }
  }
}
</style>