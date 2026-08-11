<template>
  <div>
    <Transition name="fade" mode="out-in">
      <div ref="divRef" class="page" v-if="!isEditor">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
          :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
          :page="page" slot-header="header" :loading="loading"
          @current-page="getNoteListData" @page-size="getNoteListData">
          <!-- 自定义头部 -->
          <template #header>
              <el-button @click="handleAdd" v-permission="NotePerm.ADD">
                新增笔记
              </el-button>
          </template>
          <!-- 自定义操作列 -->
          <template #option="{ row }">
            <el-button type="primary" size="small" link
              @click="handleEdit(row)" v-permission="NotePerm.EDIT">
              编辑
            </el-button>
            <el-button type="danger" size="small" link @click="handleDel(row)" v-permission="NotePerm.DELETE">
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
              <ElButton type="primary" @click="handleSave">保存</ElButton>
            </div>
          </template>
        </ElPageHeader>
        <div class="title-input">
          <span class="label">标题：</span>
          <ElInput v-model="formData.noteTitle" placeholder="请输入笔记标题"
            show-word-limit clearable />
        </div>
        <div class="md-editor">
          <MdEditor v-model="formData.noteContent" @onUploadImg="onUploadImg"
            :theme="isDark ? 'dark' : 'light'" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { NotePerm } from '@/constants'
import { NoteService } from "@/api/noteApi"
import { R2FileService } from "@/api/r2FileApi"
import { useUserStore } from "@/store/modules/user"
import { ElMessage, ElMessageBox } from "element-plus"
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

type Note = Api.Note.NoteData
type PaginatingParams<T> = Api.Common.PaginatingParams<T>

const router = useRouter()
const userStore = useUserStore()
const userId = userStore.info.userId
const isDark = useDark()
const query = reactive<Note>({})
const divRef = ref<HTMLElement | null>(null)
const formData = reactive<Note>({})
const tableData = ref<Note[]>([])
const loading = ref(true)
const page = reactive({ total: 0, pageNum: 1, pageSize: 10 })
const isEditor = ref<boolean>(false)
const columns = reactive([
  { type: "index", label: "序号" },
  { prop: "noteTitle", label: "笔记标题", minWidth: "150", showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", minWidth: "160" },
  { prop: "action", label: "操作", fixed: "right", slot: "option", minWidth: "150", permission: ['note:edit', 'note:delete'] }
])
useTableColumnPermission(columns)
/** 确保笔记已创建（上传图片时触发：首次上传即创建空笔记获取 noteId 供图片关联） */
let notePromise: Promise<number | undefined> | null = null
let isPlaceholder = false  // 标记是否为 ensureNote 创建的占位笔记（用于 onBack 清理判断）
const ensureNote = (): Promise<number | undefined> => {
  if (formData.noteId) return Promise.resolve(formData.noteId)
  if (notePromise) return notePromise
  notePromise = (async () => {
    try {
      const noteId = await NoteService.addNote({ noteTitle: '', noteContent: '' })
      formData.noteId = noteId
      isPlaceholder = true
      return noteId
    } finally {
      notePromise = null
    }
  })()
  return notePromise!
}
/** 切换到列表（清理 ensureNote 创建的占位空笔记，或解绑未使用图片） */
const onBack = async () => {
  if (isPlaceholder && formData.noteId && !formData.noteTitle && !formData.noteContent) {
    // 占位笔记且无内容，直接删除（delNote 会清理关联文件）
    try {
      await NoteService.delNote(formData.noteId)
    } catch (e) {
      console.error('清理占位笔记失败：', e)
    }
  } else if (formData.noteId) {
    // 非占位删除场景：解绑未使用图片
    try {
      await NoteService.unbindUnusedFiles(formData.noteId)
    } catch (e) {
      console.warn('解绑未使用图片失败：', e)
    }
  }
  isPlaceholder = false
  isEditor.value = false
}
const getNoteListData = async () => {
  loading.value = true
  try {
    const data: PaginatingParams<Note> = await NoteService.getNoteList(
      {
        ...query,
        pageNum: page.pageNum,
        pageSize: page.pageSize
      })
    tableData.value = data.list
    page.total = data.total
  } finally {
    loading.value = false
  }
}
const clearData = () => {
  formData.noteContent = ''
  formData.noteTitle = ''
  formData.noteId = undefined
}
const handleAdd = () => {
  clearData()
  isEditor.value = true
}

const handleEdit = async (row: Note) => {
  clearData()
  isEditor.value = true
  const { noteId, noteContent, noteTitle } = await NoteService.getNoteDetail(Number(row.noteId))
  formData.noteId = noteId
  formData.noteContent = noteContent
  formData.noteTitle = noteTitle
}

const handleDel = async (row: Note) => {
  if (!row.noteId) {
    ElMessage.warning("无效的笔记ID")
    return
  }
  try {
    await ElMessageBox.confirm("确定要删除该笔记吗？删除后无法恢复！", "警告", { confirmButtonText: "确定删除", cancelButtonText: "取消", type: "warning", appendTo: document.body })
    await NoteService.delNote(row.noteId)
    ElMessage.success("删除成功")
    getNoteListData()
  } catch {
    ElMessage.info("已取消")
  }
}
const handleSave = async () => {
  if (!formData.noteTitle) {
    ElMessage.warning('请输入笔记标题')
    return
  }
  if (!formData.noteContent) {
    ElMessage.warning('请输入笔记内容')
    return
  }

  try {
    if (formData.noteId) {
      await NoteService.updateNote(formData)
      ElMessage.success("修改成功")
    } else {
      await NoteService.addNote(formData)
      console.log(formData)
      ElMessage.success("新增成功")
    }
    onBack()
    getNoteListData()
  } catch {
    ElMessage.warning("操作失败")
  }
}
const handleSearch = () => {
  page.pageNum = 1
  getNoteListData()
}
const handleReset = () => {
  query.noteTitle = ''
  page.pageNum = 1
  getNoteListData()
}
const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  try {
    // 只取第一张图片
    const file = files[0]
    if (!file) {
      callback([])
      return
    }
    if (userId) {
      // 确保笔记已创建，拿到 noteId 供图片关联
      await ensureNote()
      // 执行单图上传，拿到图片在线地址
      const { url } = await R2FileService.uploadR2File({ file, type: "note", userId, referenceId: formData.noteId })
      callback([url])
    } else {
      ElMessage.error('用户不存在')
      throw new Error('用户不存在')
    }
  } catch (err) {
    console.error('图片上传失败：', err)
    // 异常兜底，结束上传状态
    callback([])
  }
}
const searchList = [{ prop: "noteTitle", current: "input", label: "笔记标题", props: { placeholder: "请输入笔记标题" } }]

onMounted(async () => await getNoteListData())
</script>

<style lang="scss" scoped>
.page {
  @include page;
}

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

.page {
  .search {
    flex: 0 0 auto;
  }

  .table {
    margin-top: 10px;
    flex: 1 1 auto;


    .content-preview {
      display: inline-block;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
  }
}

.editor {
  @include page;

  .title-input {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 15px 0;
    padding: 0 4px;

    .label {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
    }

    :deep(.el-input) {
      flex: 1;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      margin-left: auto;
    }
  }

  .md-editor {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border-color);
  }
}
</style>