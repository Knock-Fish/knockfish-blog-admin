<template>
  <div
    class="gantt-chart"
    :class="{ 'is-dragging-task': !!drag.taskId, 'is-panning-chart': pan.active, 'is-resizing': splitter.dragging, 'is-panel-collapsed': splitter.collapsed }"
    style="box-shadow: var(--el-border-color-light) 0px 0px 10px"
  >
    <!-- 右侧甘特图：物理宽度=外层容器宽度，padding-left 控制可视起始位置，不被挤压 -->
    <div class="gantt-right">
      <GanttToolbar
        :current-scale="currentScale"
        @add="openAddDialog"
        @scale-change="setScale"
        @fit-view="fitView"
        @locate-today="locateToday"
        @locate-date="locateDate"
      />

      <!-- 甘特图主区域 -->
      <div
        ref="ganttWrapRef"
        class="gantt-view"
        :class="{ 'is-panning': pan.active }"
        @scroll.passive="onScroll"
        @mousedown="onPanStart"
        @wheel.prevent.passive="onGanttWheel"
      >
          <!-- 时间轴表头 -->
          <GanttTimeline
            :timeline-width="timelineWidth"
            :top-header-groups="topHeaderGroups"
            :sub-header-cells="subHeaderCells"
          />

          <!-- 任务区 + SVG 连线层 -->
          <div class="gantt-body" :style="{ width: timelineWidth + 'px', height: bodyHeight + 'px' }">
            <!-- 行背景：基于 bodyHeight 计算，无数据时也显示占位行 -->
            <div
              v-for="i in rowCount"
              :key="'bg-' + i"
              class="row-bg"
              :class="{ 'row-even': (i - 1) % 2 === 0 }"
              :style="{ top: (i - 1) * rowHeight + 'px', height: rowHeight + 'px' }"
            ></div>

            <!-- 周末背景柱 -->
            <div
              v-for="col in weekendColumns"
              :key="col.key"
              class="weekend-bg"
              :style="{ left: col.left + 'px', width: col.width + 'px', top: 0, height: bodyHeight + 'px' }"
            ></div>

            <!-- 今日竖线 -->
            <div class="today-line" :style="{ left: todayLineLeft + 'px' }"></div>

            <!-- SVG 连线层 -->
            <GanttLinkLayer
              :width="timelineWidth"
              :height="bodyHeight"
              :links="renderedLinks"
              :preview="dragLink.preview"
              :is-dark="isDark"
              @click="onLinkClick"
            />

            <!-- 任务条 -->
            <GanttTaskBar
              v-for="(row, idx) in flatTasks"
              :key="'bar-' + row.id"
              :task="row"
              :bar-style="getBarStyle(row, idx)"
              :is-selected="selectedId === row.id"
              :is-dragging="drag.taskId === row.id"
              @mousedown="onBarMouseDown"
              @dblclick="openEditDialog"
              @contextmenu="openContextMenu"
              @link-start="onLinkMouseDown"
              @link-end="onLinkMouseDown"
            />
          </div>
        </div>
    </div>

    <!-- 左侧：任务列表面板（绝对定位覆盖在甘特图上方，不挤压甘特图） -->
    <div class="gantt-left" :style="{ width: splitter.collapsed ? '0px' : splitter.leftWidth + 'px' }">
      <div class="gantt-left-header">
        <div class="gantt-left-title">
          <Icon icon="ri:list-check" />
          <span>任务列表</span>
        </div>
        <ElButton
          size="small"
          text
          @click="togglePanelCollapse"
          :title="splitter.collapsed ? '展开任务列表' : '隐藏任务列表'"
        >
          <Icon :icon="splitter.collapsed ? 'ri:arrow-right-s-line' : 'ri:arrow-left-s-line'" />
        </ElButton>
      </div>
      <TaskListPanel
        :tasks="ganttTasks"
        :row-height="rowHeight"
        @expand-change="handleExpandChange"
        @add-child="(row: GanttTask) => openAddDialog(row.id, 'child')"
        @edit="openEditDialog"
        @delete="handleDeleteTask"
      />
    </div>

    <!-- 竖分割条（左右拖拽） -->
    <div
      class="splitter-bar"
      :style="{ left: splitter.collapsed ? '0px' : splitter.leftWidth + 'px' }"
      @mousedown.left.stop="onSplitterMouseDown"
    >
      <div class="splitter-handle"></div>
      <ElButton
        v-if="splitter.collapsed"
        class="splitter-expand-btn"
        size="small"
        text
        @click.stop="togglePanelCollapse"
        title="展开任务列表"
      >
        <Icon icon="ri:arrow-right-s-line" />
      </ElButton>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      v-model:visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      @select="onContextClick"
    />

    <!-- 任务弹窗 -->
    <TaskDialog
      v-model:visible="taskDialogVisible"
      :is-edit="taskDialogMode === 'edit'"
      :saving="saving"
      :form="dialogFormData"
      :rules="dialogRules"
      @submit="onTaskSubmit"
    />

    <!-- 删除确认 -->
    <ElDialog v-model="deleteDialog.visible" title="删除确认" width="420px" align-center>
      <div style="padding: 12px 0">
        <ElAlert
          type="warning"
          :closable="false"
          show-icon
          title="确定要删除此任务吗？"
          description="删除后无法恢复，如果任务有子任务，子任务也会一并被删除。"
        />
      </div>
      <template #footer>
        <ElButton @click="deleteDialog.visible = false">取消</ElButton>
        <ElButton type="danger" :loading="deleteDialog.deleting" @click="confirmDelete">确认删除</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(isoWeek)
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDark } from '@vueuse/core'
import TaskListPanel from './widget/TaskListPanel.vue'
import GanttToolbar from './widget/GanttToolbar.vue'
import TaskDialog from './widget/TaskDialog.vue'
import ContextMenu from './widget/ContextMenu.vue'
import GanttTimeline from './widget/GanttTimeline.vue'
import GanttLinkLayer from './widget/GanttLinkLayer.vue'
import GanttTaskBar from './widget/GanttTaskBar.vue'
import type { GanttTask, GanttLink, RenderedLink } from './types'

import { useGanttData } from '@/composables/useGanttData'
import { useTimeline } from '@/composables/useTimeline'
import { useDragTask } from '@/composables/useDragTask'
import { usePan } from '@/composables/usePan'
import { useWheelZoom } from '@/composables/useWheelZoom'
import { useLinkDrag } from '@/composables/useLinkDrag'
import { useSplitter } from '@/composables/useSplitter'
import { useContextMenu } from '@/composables/useContextMenu'
import { useTaskDialog } from '@/composables/useTaskDialog'
import { useTimelineExpand } from '@/composables/useTimelineExpand'

const isDark = useDark()

// ======================= Props 定义（父组件传入） =======================
const props = withDefaults(
  defineProps<{
    /** 任务数据（父子层级结构），由父组件传入 */
    tasks?: GanttTask[]
    /** 依赖连线数据，由父组件传入 */
    links?: GanttLink[]
  }>(),
  {
    tasks: () => [],
    links: () => [],
  },
)

// ======================= Emits（暴露增删改事件给父组件） =======================
const emit = defineEmits<{
  /** 新增任务：task 新任务对象，parentId 父任务 id（顶层为 null），insertAfterId 插入到该兄弟任务之后（追加末尾为 null） */
  (e: 'add-task', task: GanttTask, parentId: string | null, insertAfterId: string | null): void
  /** 更新任务：拖拽结束或编辑提交时触发，传回更新后的完整任务对象 */
  (e: 'update-task', task: GanttTask): void
  /** 删除任务：递归删除子任务及关联连线 */
  (e: 'delete-task', id: string): void
  /** 新增依赖连线：传回新建的连线对象（id 为前端临时 id） */
  (e: 'add-link', link: GanttLink): void
  /** 删除依赖连线 */
  (e: 'delete-link', id: string): void
}>()

// ======================= 基础常量 =======================
const rowHeight = ref(32)
const initialized = ref(false)

// ======================= 1. 任务数据管理（从 props 注入） =======================
const {
  ganttTasks,
  ganttLinks,
  selectedId,
  flatTasks,
  flatTaskIndexMap,
  getTaskById,
  updateTaskInTree,
  handleExpandChange,
  addTask,
  addLink,
  removeLink,
  deleteTaskById,
  setTasks,
  setLinks,
} = useGanttData({
  initialTasks: props.tasks,
  initialLinks: props.links,
})

// 父组件 props 变化时，同步更新内部响应式状态
watch(
  () => props.tasks,
  val => {
    setTasks(val)
  },
  { deep: true },
)
watch(
  () => props.links,
  val => {
    setLinks(val)
  },
  { deep: true },
)

// ======================= 包装 useGanttData 的增删改方法：本地修改 + emit 事件给父组件 =======================
// 新增任务：本地插入 + emit add-task
function wrappedAddTask(task: GanttTask, parentId: string | null, insertAfterId: string | null = null) {
  addTask(task, parentId, insertAfterId)
  emit('add-task', task, parentId, insertAfterId)
}
// 更新任务：本地合并 + emit update-task（传回完整 task，用于编辑提交场景）
function wrappedUpdateTaskInTree(id: string, patch: Partial<GanttTask>) {
  updateTaskInTree(id, patch)
  const updated = getTaskById(id)
  if (updated) emit('update-task', updated)
}
// 删除任务：本地递归删除 + emit delete-task
function wrappedDeleteTaskById(id: string) {
  deleteTaskById(id)
  emit('delete-task', id)
}
// 新增依赖连线：本地 push + emit add-link（传回新建连线对象）
function wrappedAddLink(sourceId: string, targetId: string, sourceSide: 'start' | 'end') {
  addLink(sourceId, targetId, sourceSide)
  const newLink = ganttLinks.value[ganttLinks.value.length - 1]
  if (newLink) emit('add-link', newLink)
}
// 删除依赖连线：本地移除 + emit delete-link
function wrappedRemoveLink(id: string) {
  removeLink(id)
  emit('delete-link', id)
}

// ======================= 2. 时间轴 =======================
const timeline = useTimeline({
  flatTasks,
  rowHeight,
  ganttTasks,
})
const {
  currentScale,
  timelineStart,
  timelineEnd,
  columnWidths,
  scaleCfg,
  timelineWidth,
  bodyHeight,
  topHeaderGroups,
  subHeaderCells,
  weekendColumns,
  todayLineLeft,
  getX,
  setScale,
  fitView,
} = timeline
const ganttWrapRef = timeline.ganttWrapRef

// 行背景渲染行数：基于 bodyHeight 计算，无数据时也填满可视区
const rowCount = computed(() => Math.ceil(bodyHeight.value / rowHeight.value))

// ======================= 3. 依赖连线渲染（在父组件中保留，依赖多个 composable） =======================
const renderedLinks = computed<RenderedLink[]>(() => {
  const tasks = flatTasks.value
  const idxMap = flatTaskIndexMap.value
  const rh = rowHeight.value
  const halfRh = rh / 2
  return ganttLinks.value.map(link => {
    const s = idxMap.get(link.source)
    const t = idxMap.get(link.target)
    if (s === undefined || t === undefined) return { id: link.id, path: '' }
    const sRow = tasks[s]
    const tRow = tasks[t]
    if (!sRow || !tRow) return { id: link.id, path: '' }
    const sx = getX(sRow.end || sRow.start)
    const sy = s * rh + halfRh
    const tx = getX(tRow.start)
    const ty = t * rh + halfRh
    const path = buildLinkPath(sx, sy, tx, ty, link.type)
    return { id: link.id, path }
  }).filter(l => l.path)
})

function buildLinkPath(sx: number, sy: number, tx: number, ty: number, type: number) {
  const arrowLen = 8
  const startX = sx
  const startY = sy
  let endX = tx
  let endY = ty
  const offsetEnd = arrowLen + 2
  endX = endX - offsetEnd

  const parts: string[] = [`M ${startX.toFixed(2)},${startY.toFixed(2)}`]

  if (Math.abs(endY - startY) < 1) {
    parts.push(`L ${endX.toFixed(2)},${endY.toFixed(2)}`)
    return parts.join(' ')
  }

  if (endX >= startX) {
    const midX = (startX + endX) / 2
    parts.push(`L ${midX.toFixed(2)},${startY.toFixed(2)}`)
    parts.push(`L ${midX.toFixed(2)},${endY.toFixed(2)}`)
    parts.push(`L ${endX.toFixed(2)},${endY.toFixed(2)}`)
  } else {
    const out = 24
    const turnX = startX + out
    parts.push(`L ${turnX.toFixed(2)},${startY.toFixed(2)}`)
    parts.push(`L ${turnX.toFixed(2)},${endY.toFixed(2)}`)
    parts.push(`L ${endX.toFixed(2)},${endY.toFixed(2)}`)
  }
  return parts.join(' ')
}

function onLinkClick(link: { id: string }) {
  ElMessageBox.confirm('删除此依赖关系？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(() => {
      wrappedRemoveLink(link.id)
      ElMessage.success('依赖关系已删除')
    })
    .catch(() => {})
}

// ======================= 4. 任务条拖拽 =======================
const { drag, onBarMouseDown, getBarStyle } = useDragTask({
  selectedId,
  getTaskById,
  // 拖拽过程用原始 updateTaskInTree（避免每帧 emit），结束统一在 onDragEnd emit
  updateTaskInTree,
  getX,
  scaleCfg,
  rowHeight,
  ganttWrapRef,
  onDragEnd: (task) => {
    if (task) emit('update-task', task)
  },
})

// ======================= 5. 画布平移 =======================
const { pan, onPanStart } = usePan({
  ganttWrapRef,
})

/** 定位到今天：滚动甘特图使今日竖线显示在视图中央 */
function locateToday() {
  const wrap = ganttWrapRef.value
  if (!wrap) return
  const targetLeft = todayLineLeft.value - wrap.clientWidth / 2
  wrap.scrollTo({
    left: Math.max(0, targetLeft),
    behavior: 'smooth',
  })
}

/** 定位到指定日期：若超出当前时间轴范围则先扩展再滚动居中 */
function locateDate(date: string) {
  const wrap = ganttWrapRef.value
  if (!wrap) return
  const d = dayjs(date)
  if (!d.isValid()) return
  // 若目标时间超出当前时间轴范围，先扩展时间轴
  if (d.isBefore(timelineStart.value)) {
    timelineStart.value = d.subtract(3, 'day')
  } else if (d.isAfter(timelineEnd.value)) {
    timelineEnd.value = d.add(3, 'day')
  }
  nextTick(() => {
    const targetLeft = getX(d) - wrap.clientWidth / 2
    wrap.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    })
  })
}

// ======================= 6. 滚轮缩放 =======================
const { onGanttWheel } = useWheelZoom({
  ganttWrapRef,
  columnWidths,
  currentScale,
})

// ======================= 7. 依赖连线拖拽 =======================
const { dragLink, onLinkMouseDown } = useLinkDrag({
  ganttWrapRef,
  getTaskById,
  flatTaskIndexMap,
  flatTasks,
  rowHeight,
  getX,
  addLink: wrappedAddLink,
})

// ======================= 8. 分割条 =======================
const {
  splitter,
  SPLITTER_MIN,
  SPLITTER_MAX,
  togglePanelCollapse,
  onSplitterMouseDown,
} = useSplitter({
  onResized: () => fitView(),
})

// ======================= 9. 任务弹窗 =======================
const {
  taskDialogVisible,
  taskDialogMode,
  saving,
  dialogFormData,
  dialogRules,
  openAddDialog,
  openEditDialog,
  onTaskSubmit,
} = useTaskDialog({
  getTaskById,
  // 编辑提交时本地更新 + emit update-task
  updateTaskInTree: wrappedUpdateTaskInTree,
  // 新增任务时本地插入 + emit add-task
  addTask: wrappedAddTask,
})

// ======================= 10. 右键菜单 =======================
const { contextMenu, openContextMenu, onContextClick } = useContextMenu({
  getTaskById,
  onAdd: (id, mode) => openAddDialog(id, mode),
  onEdit: openEditDialog,
  onDeleteById: handleDeleteTaskById,
})

// ======================= 11. 时间轴自动扩展 =======================
const { onScroll } = useTimelineExpand({
  ganttWrapRef,
  timelineStart,
  timelineEnd,
  scaleCfg,
  initialized,
})

// ======================= 删除任务弹窗 =======================
const deleteDialog = reactive({
  visible: false,
  deleting: false,
  taskId: null as string | null,
})

function handleDeleteTask(row: GanttTask) {
  deleteDialog.taskId = row.id
  deleteDialog.deleting = false
  deleteDialog.visible = true
}

function handleDeleteTaskById(id: string) {
  deleteDialog.taskId = id
  deleteDialog.deleting = false
  deleteDialog.visible = true
}

function confirmDelete() {
  if (!deleteDialog.taskId) {
    deleteDialog.visible = false
    return
  }
  deleteDialog.deleting = true
  try {
    const id = deleteDialog.taskId
    wrappedDeleteTaskById(id)
    ElMessage.success('任务已删除')
  } finally {
    deleteDialog.deleting = false
    deleteDialog.visible = false
    deleteDialog.taskId = null
  }
}

// ======================= 生命周期 =======================
let resizeObserver: ResizeObserver | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  nextTick(() => {
    const containerWidth = document.querySelector('.gantt-chart')?.clientWidth || 1200
    splitter.leftWidth = Math.max(SPLITTER_MIN, Math.min(SPLITTER_MAX, Math.floor(containerWidth * 0.3)))
    fitView()
    if (ganttWrapRef.value) {
      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          fitView()
        }, 150)
      })
      resizeObserver.observe(ganttWrapRef.value)
    }
    initialized.value = true
  })
})

// onBeforeUnmount: 各 composable 内部通过 onBeforeUnmount 注册自己的 cleanup（RAF、window 事件）
// 组件级 cleanup 负责 ResizeObserver / resizeTimer
onBeforeUnmount(() => {
  if (resizeTimer) clearTimeout(resizeTimer)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
