<template>
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
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CodeSnippetService } from "@/api/codeSnippetApi"
import { CodeCategoryService } from "@/api/codeCategoryApi"

type CodeSnippet = Api.CodeSnippet.CodeSnippetInfo
type CodeCategory = Api.CodeCategory.CodeCategoryInfo

const props = defineProps<{
  currentSnippetId?: number | undefined
}>()

const emit = defineEmits<{
  (e: 'select', snippet: CodeSnippet): void
}>()

const { width } = useWindowSize()
const SMALL_SCREEN_BREAKPOINT = 900
const isSmallScreen = computed(() => width.value < SMALL_SCREEN_BREAKPOINT)

const sidebarCollapsed = ref(false)
const drawerVisible = ref(false)

watch(width, (newWidth) => {
  if (newWidth >= SMALL_SCREEN_BREAKPOINT) {
    drawerVisible.value = false
  }
})

const categoryOptions = ref<CodeCategory[]>([])
const selectedCategory = ref<number | undefined>(undefined)
const snippetList = ref<CodeSnippet[]>([])

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

const handleSelectSnippet = (snippet: CodeSnippet) => {
  emit('select', snippet)
}

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
    if (props.currentSnippetId === snippet.codeSnippetId) {
      emit('select', { codeSnippetId: undefined } as CodeSnippet)
    }
    await getSnippetList()
  } catch {
    ElMessage.info("已取消")
  }
}

const handleCategoryChange = () => {
  getSnippetList()
}

defineExpose({
  sidebarCollapsed,
  drawerVisible,
  refreshList: getSnippetList,
  toggleSidebar: () => { sidebarCollapsed.value = !sidebarCollapsed.value },
  openDrawer: () => { drawerVisible.value = true }
})

onMounted(async () => {
  await getCategoryOptions()
  await getSnippetList()
})
</script>

<style lang="scss" scoped>
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