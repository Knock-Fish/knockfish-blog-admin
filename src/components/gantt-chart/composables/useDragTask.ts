import { reactive, type Ref, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import type { GanttTask, DragMode, ScaleType, TaskStatus } from '../types'

/** 任务状态对应的主题色（用于任务条 --bar-color） */
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: '#909399',
  doing: '#409eff',
  done: '#67c23a',
  delay: '#f56c6c',
  cancel: '#c0c4cc',
}

export interface UseDragTaskOptions {
  selectedId: Ref<string | null>
  getTaskById: (id: string) => GanttTask | undefined
  updateTaskInTree: (id: string, patch: Partial<GanttTask>) => void
  getX: (date: string | dayjs.Dayjs) => number
  scaleCfg: Ref<{ unit: dayjs.ManipulateType; step: number; columnWidth: number }>
  rowHeight: Ref<number>
  ganttWrapRef: Ref<HTMLDivElement | undefined>
  /** 拖拽结束回调，传回最新任务对象供父组件持久化 */
  onDragEnd?: (task: GanttTask | undefined) => void
}

/**
 * 任务条拖拽 composable
 * 支持四种拖拽模式：整体移动、左拉伸、右拉伸、进度调整
 * 使用 requestAnimationFrame 节流，保证拖拽流畅
 */
export function useDragTask(options: UseDragTaskOptions) {
  const {
    selectedId,
    getTaskById,
    updateTaskInTree,
    getX,
    scaleCfg,
    rowHeight,
    ganttWrapRef,
    // 重命名外部回调，避免与内部 onDragEnd 函数同名冲突
    onDragEnd: onDragEndCallback,
  } = options

  // 拖拽状态
  const drag = reactive({
    taskId: null as string | null,       // 正在拖拽的任务 id
    mode: '' as '' | DragMode,           // 拖拽模式
    startX: 0,                           // 鼠标按下时的 clientX
    origStart: '',                       // 拖拽前的开始时间
    origEnd: '',                         // 拖拽前的结束时间
    origProgress: 0,                     // 拖拽前的进度
    origLeft: 0,                         // 拖拽前任务条左边缘 x 坐标
    origWidth: 0,                        // 拖拽前任务条宽度
  })

  let dragRafId: number | null = null    // rAF 节流句柄
  let dragLastEvent: MouseEvent | null = null  // 最新一次鼠标移动事件

  /**
   * 任务条鼠标按下：启动拖拽
   *  - 汇总任务（project）：禁止任何拖拽（时间/进度由子项派生）
   *  - 里程碑（milestone）：只支持整体 move（不支持拉伸），进度由 status 二态控制，不支持 progress 拉伸
   */
  function onBarMouseDown(e: MouseEvent, row: GanttTask, mode: DragMode) {
    if (row.type === 'project') return
    if (row.type === 'milestone' && mode !== 'move') return
    if (mode === 'progress' && row.type === 'milestone') return
    e.preventDefault()
    selectedId.value = row.id
    drag.taskId = row.id
    drag.mode = mode
    drag.startX = e.clientX
    drag.origStart = row.start
    drag.origEnd = row.end
    drag.origProgress = row.progress || 0
    drag.origLeft = getX(row.start)
    drag.origWidth = getX(row.end || row.start) - getX(row.start)
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
  }

  /** 鼠标移动：用 rAF 节流，每帧最多应用一次拖拽 */
  function onDragMove(e: MouseEvent) {
    if (!drag.taskId || !drag.mode) return
    dragLastEvent = e
    if (dragRafId !== null) return
    dragRafId = requestAnimationFrame(() => {
      dragRafId = null
      if (dragLastEvent) applyDrag(dragLastEvent)
    })
  }

  /**
   * 应用拖拽：根据模式计算新的开始/结束时间或进度
   * 像素位移 → 时间单位换算：deltaUnits = dx × (step / columnWidth)
   */
  function applyDrag(e: MouseEvent) {
    if (!drag.taskId || !drag.mode) return
    const row = getTaskById(drag.taskId)
    if (!row) return
    const cfg = scaleCfg.value
    const dx = e.clientX - drag.startX
    const unitsPerPixel = cfg.step / cfg.columnWidth
    const deltaUnits = dx * unitsPerPixel
    const origStartDate = dayjs(drag.origStart)
    if (drag.mode === 'move') {
      // 整体平移：开始和结束同时偏移
      const newStart = origStartDate.add(deltaUnits, cfg.unit)
      const newEnd = dayjs(drag.origEnd).add(deltaUnits, cfg.unit)
      updateTaskInTree(row.id, {
        start: newStart.format('YYYY-MM-DD HH:mm:ss'),
        end: newEnd.format('YYYY-MM-DD HH:mm:ss'),
      })
    } else if (drag.mode === 'resize-left') {
      // 左拉伸：仅修改开始时间，不能超过结束时间
      const newStart = origStartDate.add(deltaUnits, cfg.unit)
      if (newStart.isBefore(drag.origEnd)) {
        updateTaskInTree(row.id, { start: newStart.format('YYYY-MM-DD HH:mm:ss') })
      }
    } else if (drag.mode === 'resize-right') {
      // 右拉伸：仅修改结束时间，不能早于开始时间
      const newEnd = dayjs(drag.origEnd).add(deltaUnits, cfg.unit)
      if (newEnd.isAfter(origStartDate)) {
        updateTaskInTree(row.id, { end: newEnd.format('YYYY-MM-DD HH:mm:ss') })
      }
    } else if (drag.mode === 'progress') {
      // 进度调整：根据鼠标在任务条上的水平比例计算进度
      const totalWidth = drag.origWidth
      if (totalWidth > 0) {
        const wrap = ganttWrapRef.value
        if (!wrap) return
        let ratio = (e.clientX - drag.origLeft - wrap.getBoundingClientRect().left + wrap.scrollLeft) / totalWidth
        ratio = Math.max(0, Math.min(1, ratio))
        updateTaskInTree(row.id, { progress: Math.round(ratio * 100) / 100 })
      }
    }
  }

  /** 鼠标释放：结束拖拽，清理 rAF，修正异常时间（结束早于开始则对齐） */
  function onDragEnd() {
    if (dragRafId !== null) {
      cancelAnimationFrame(dragRafId)
      dragRafId = null
    }
    let finalTask: GanttTask | undefined
    if (drag.taskId) {
      const row = getTaskById(drag.taskId)
      if (row && row.type === 'task' && dayjs(row.end).isBefore(dayjs(row.start))) {
        updateTaskInTree(row.id, { end: row.start })
      }
      // 取修正后的最新任务对象，通知父组件持久化
      finalTask = getTaskById(drag.taskId)
    }
    drag.taskId = null
    drag.mode = ''
    dragLastEvent = null
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
    if (onDragEndCallback) onDragEndCallback(finalTask)
  }

  /**
   * 计算任务条的定位样式
   * @param row 任务对象
   * @param idx 在扁平列表中的下标
   * @returns 包含 left/width/top/height 和 --bar-color 的样式对象
   */
  function getBarStyle(row: GanttTask, idx: number) {
    const left = getX(row.start)
    const right = getX(row.end || row.start)
    let width = Math.max(right - left, 8)
    const rh = rowHeight.value
    let top: number
    let height: number
    if (row.type === 'task') {
      // 普通任务：26px 高的条，在行内垂直居中
      top = idx * rh + (rh - 26) / 2
      height = 26
    } else {
      // 里程碑 / 汇总任务：占满整行高度，便于内部元素通过 top:50% 精准居中在行中央
      // （与连线端点 sy/ty = idx*rh + rh/2 对齐）
      width = row.type === 'milestone' ? 0 : width
      top = idx * rh
      height = rh
    }
    return {
      left: left + 'px',
      width: width + 'px',
      top: top + 'px',
      height: height + 'px',
      '--bar-color': STATUS_COLOR[row.status],
    } as Record<string, string>
  }

  /** 清理：取消 rAF 并移除 window 事件监听 */
  function cleanup() {
    if (dragRafId !== null) {
      cancelAnimationFrame(dragRafId)
      dragRafId = null
    }
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
  }

  onBeforeUnmount(cleanup)

  return {
    drag,
    onBarMouseDown,
    getBarStyle,
    _cleanup: cleanup,
  }
}
