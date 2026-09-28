<template>
  <div class="todo-page" v-loading="loading">
    <GanttChart
      :tasks="tasks"
      :links="links"
      @add-task="onAddTask"
      @update-task="onUpdateTask"
      @delete-task="onDeleteTask"
      @add-link="onAddLink"
      @delete-link="onDeleteLink"
    />
  </div>
</template>

<script setup lang='ts'>
import { ElMessage } from 'element-plus'
import GanttChart from '@comps/gantt-chart/index.vue'
import type { GanttTask, GanttLink } from '@comps/gantt-chart/types'
import { GanttTaskService } from '@/api/ganttTaskApi'
import { GanttLinkService } from '@/api/ganttLinkApi'

const loading = ref(false)
const tasks = ref<GanttTask[]>([])
const links = ref<GanttLink[]>([])

/** 后端 TaskInfo（snake_case、id 为 number）→ 前端 GanttTask（camelCase、id 为 string） */
function toGanttTask(t: Api.GanttTask.TaskInfo): GanttTask {
  return {
    id: String(t.task_id ?? ''),
    text: t.text ?? '',
    start: t.start ?? '',
    end: t.end ?? '',
    progress: t.progress ?? 0,
    type: t.type ?? 'task',
    status: t.status ?? 'todo',
    owner: t.owner ?? '',
    description: t.description ?? '',
    parentId: t.parent_id != null ? String(t.parent_id) : null,
    // open: null 时保持 undefined（默认展开），0=收起，1=展开
    open: t.open == null ? undefined : t.open === 1,
    children: t.children?.map(toGanttTask),
  }
}

/** 后端 LinkInfo → 前端 GanttLink */
function toGanttLink(l: Api.GanttLink.LinkInfo): GanttLink {
  return {
    id: String(l.link_id ?? ''),
    source: String(l.source ?? ''),
    target: String(l.target ?? ''),
    type: l.type ?? 0,
  }
}

/** 加载任务树 + 依赖连线 */
async function loadData(silent = false) {
  if (!silent) loading.value = true
  try {
    const [taskList, linkList] = await Promise.all([
      GanttTaskService.getTaskTree(),
      GanttLinkService.getLinkList(),
    ])
    tasks.value = (taskList || []).map(toGanttTask)
    links.value = (linkList || []).map(toGanttLink)
  } catch (e) {
    ElMessage.error('加载甘特图数据失败')
  } finally {
    if (!silent) loading.value = false
  }
}

/** 仅重载任务树（用于写操作成功后对齐后端派生的 PROJECT 字段，links 不动也不清空选中） */
async function reloadTasksOnly() {
  try {
    const taskList = await GanttTaskService.getTaskTree()
    tasks.value = (taskList || []).map(toGanttTask)
  } catch {
    // 忽略：本地已经即时派生了一份近似值，失败不打扰用户
  }
}

/** 替换任务树中临时 id 为后端真实 id，并同步更新子任务 parentId 和连线引用 */
function replaceTaskId(list: GanttTask[], oldId: string, newId: string) {
  for (const t of list) {
    if (t.id === oldId) t.id = newId
    if (t.children) {
      for (const c of t.children) {
        if (c.parentId === oldId) c.parentId = newId
      }
      replaceTaskId(t.children, oldId, newId)
    }
  }
  for (const l of links.value) {
    if (l.source === oldId) l.source = newId
    if (l.target === oldId) l.target = newId
  }
}

/** 从任务树中递归移除指定 id 的任务 */
function removeTaskFromList(list: GanttTask[], id: string) {
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i]
    if (!item) continue
    if (item.id === id) {
      list.splice(i, 1)
      return
    }
    if (item.children) removeTaskFromList(item.children, id)
  }
}

/** 新增任务：调用后端 → 用真实 id 替换前端临时 id */
async function onAddTask(task: GanttTask, _parentId: string | null, insertAfterId: string | null) {
  const payload: Api.GanttTask.TaskInfo = {
    text: task.text,
    start: task.start,
    end: task.end,
    progress: task.progress,
    type: task.type,
    status: task.status,
    owner: task.owner,
    description: task.description,
    parent_id: task.parentId != null ? Number(task.parentId) || null : null,
    insert_after_id: insertAfterId != null ? Number(insertAfterId) || null : null,
  }
  try {
    const newId = await GanttTaskService.addTask(payload)
    // 用真实 id 替换前端临时 id，同步更新子任务 parentId 和连线引用
    replaceTaskId(tasks.value, task.id, String(newId))
    // 对齐后端派生的 PROJECT 字段（比如新建 project 后立即派生，或新增子项后父派生）
    await reloadTasksOnly()
  } catch (e) {
    ElMessage.error('新增任务失败')
    await loadData(true)
  }
}

/** 更新任务：调用后端持久化（失败时静默重载以回滚本地修改） */
async function onUpdateTask(task: GanttTask) {
  const taskId = Number(task.id)
  if (Number.isNaN(taskId)) return  // 临时 id（尚未保存到后端）跳过
  const payload: Api.GanttTask.TaskInfo = {
    task_id: taskId,
    text: task.text,
    start: task.start,
    end: task.end,
    progress: task.progress,
    type: task.type,
    status: task.status,
    owner: task.owner,
    description: task.description,
    parent_id: task.parentId != null ? Number(task.parentId) || null : null,
  }
  try {
    await GanttTaskService.updateTask(payload)
    // 对齐后端派生的 PROJECT 字段（子项 progress/status/时间 变化 → 父 PROJECT 派生值变化）
    await reloadTasksOnly()
  } catch (e) {
    ElMessage.error('更新任务失败')
    await loadData(true)
  }
}

/** 删除任务：调用后端 → 从本地移除任务和关联连线 */
async function onDeleteTask(id: string) {
  const taskId = Number(id)
  if (Number.isNaN(taskId)) return
  try {
    await GanttTaskService.delTask(taskId)
    removeTaskFromList(tasks.value, id)
    links.value = links.value.filter(l => l.source !== id && l.target !== id)
    // 对齐后端派生的 PROJECT 字段（删除子项后父派生变化）
    await reloadTasksOnly()
  } catch (e) {
    ElMessage.error('删除任务失败')
    await loadData(true)
  }
}

/** 新增依赖连线：调用后端 → 用真实 id 替换前端临时 id */
async function onAddLink(link: GanttLink) {
  const sourceId = Number(link.source)
  const targetId = Number(link.target)
  if (Number.isNaN(sourceId) || Number.isNaN(targetId)) return
  const payload: Api.GanttLink.LinkInfo = {
    source: sourceId,
    target: targetId,
    type: link.type,
  }
  try {
    const newId = await GanttLinkService.addLink(payload)
    const target = links.value.find(l => l.id === link.id)
    if (target) target.id = String(newId)
  } catch (e) {
    ElMessage.error('新增依赖连线失败')
    await loadData(true)
  }
}

/** 删除依赖连线：调用后端 → 从本地移除 */
async function onDeleteLink(id: string) {
  const linkId = Number(id)
  if (Number.isNaN(linkId)) return
  try {
    await GanttLinkService.delLink(linkId)
    links.value = links.value.filter(l => l.id !== id)
  } catch (e) {
    ElMessage.error('删除依赖连线失败')
    await loadData(true)
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.todo-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
