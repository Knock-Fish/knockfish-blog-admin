import { reactive, type Ref, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import type { GanttTask } from '../types'

export interface UseLinkDragOptions {
  ganttWrapRef: Ref<HTMLDivElement | undefined>
  getTaskById: (id: string) => GanttTask | undefined
  flatTaskIndexMap: Ref<Map<string, number>>
  flatTasks: Ref<GanttTask[]>
  rowHeight: Ref<number>
  getX: (date: string | dayjs.Dayjs) => number
  addLink: (sourceId: string, targetId: string, sourceSide: 'start' | 'end') => void
}

/**
 * 依赖连线拖拽 composable
 * 从任务条端点（start/end）按下拖拽，实时绘制预览连线，
 * 释放在另一任务条上时建立依赖关系
 */
export function useLinkDrag(options: UseLinkDragOptions) {
  const {
    ganttWrapRef,
    getTaskById,
    flatTaskIndexMap,
    flatTasks,
    rowHeight,
    getX,
    addLink,
  } = options

  // 连线拖拽状态
  const dragLink = reactive({
    active: false,                          // 是否正在拖拽连线
    sourceId: null as string | null,        // 起点任务 id
    sourceSide: '' as 'start' | 'end',      // 起点侧（start=左端点 / end=右端点）
    preview: '' as string,                  // 预览连线的 SVG path
  })

  let linkRafId: number | null = null       // rAF 节流句柄
  let linkLastEvent: MouseEvent | null = null  // 最新一次鼠标移动事件

  /**
   * 构建曼哈顿折线预览路径
   * 同高度走直线，目标在右侧走中点折线，在左侧走外绕折线
   */
  function buildLinkPreview(sx: number, sy: number, tx: number, ty: number) {
    const parts: string[] = [`M ${sx.toFixed(2)},${sy.toFixed(2)}`]
    if (Math.abs(ty - sy) < 1) {
      parts.push(`L ${tx.toFixed(2)},${ty.toFixed(2)}`)
      return parts.join(' ')
    }
    if (tx >= sx) {
      const midX = (sx + tx) / 2
      parts.push(`L ${midX.toFixed(2)},${sy.toFixed(2)}`)
      parts.push(`L ${midX.toFixed(2)},${ty.toFixed(2)}`)
      parts.push(`L ${tx.toFixed(2)},${ty.toFixed(2)}`)
    } else {
      const turnX = sx + 24
      parts.push(`L ${turnX.toFixed(2)},${sy.toFixed(2)}`)
      parts.push(`L ${turnX.toFixed(2)},${ty.toFixed(2)}`)
      parts.push(`L ${tx.toFixed(2)},${ty.toFixed(2)}`)
    }
    return parts.join(' ')
  }

  /** 通过 DOM 顺序匹配任务条元素，反查任务 id（当 data-id 缺失时的兜底） */
  function findTaskIdByElement(el: HTMLElement): string | null {
    const bars = document.querySelectorAll('.task-bar')
    for (let i = 0; i < bars.length; i++) {
      if (bars[i] === el) {
        return flatTasks.value[i]?.id || null
      }
    }
    return null
  }

  /**
   * 连线端点鼠标按下：开始拖拽连线
   * 计算起点坐标（端点位置 + 行中线），初始化预览路径
   */
  function onLinkMouseDown(e: MouseEvent, row: GanttTask, side: 'start' | 'end') {
    e.preventDefault()
    e.stopPropagation()
    dragLink.active = true
    dragLink.sourceId = row.id
    dragLink.sourceSide = side
    const wrapRect = ganttWrapRef.value!.getBoundingClientRect()
    const startX = side === 'end' ? getX(row.end || row.start) : getX(row.start)
    const idx = flatTaskIndexMap.value.get(row.id) ?? -1
    const startY = idx * rowHeight.value + rowHeight.value / 2
    const endX = e.clientX - wrapRect.left + (ganttWrapRef.value?.scrollLeft || 0)
    const endY = e.clientY - wrapRect.top + (ganttWrapRef.value?.scrollTop || 0) - 48
    dragLink.preview = buildLinkPreview(startX, startY, endX, endY)
    window.addEventListener('mousemove', onLinkMove)
    window.addEventListener('mouseup', onLinkEnd)
  }

  /** 鼠标移动：rAF 节流，实时更新预览连线终点为当前鼠标位置 */
  function onLinkMove(e: MouseEvent) {
    if (!dragLink.active) return
    linkLastEvent = e
    if (linkRafId !== null) return
    linkRafId = requestAnimationFrame(() => {
      linkRafId = null
      if (!linkLastEvent || !dragLink.active) return
      const wrap = ganttWrapRef.value
      if (!wrap) return
      const wrapRect = wrap.getBoundingClientRect()
      const x = linkLastEvent.clientX - wrapRect.left + wrap.scrollLeft
      const y = linkLastEvent.clientY - wrapRect.top + wrap.scrollTop - 48
      const srcRow = getTaskById(dragLink.sourceId!)
      if (!srcRow) return
      const idx = flatTaskIndexMap.value.get(srcRow.id) ?? -1
      const sx = dragLink.sourceSide === 'end' ? getX(srcRow.end || srcRow.start) : getX(srcRow.start)
      const sy = idx * rowHeight.value + rowHeight.value / 2
      dragLink.preview = buildLinkPreview(sx, sy, x, y)
    })
  }

  /**
   * 鼠标释放：若释放在另一任务条上则建立依赖
   * 清理拖拽状态与预览路径
   */
  function onLinkEnd(e: MouseEvent) {
    if (linkRafId !== null) {
      cancelAnimationFrame(linkRafId)
      linkRafId = null
    }
    if (dragLink.active) {
      const target = (e.target as HTMLElement).closest('.task-bar') as HTMLElement | null
      if (target) {
        const targetId = target.getAttribute('data-id') || findTaskIdByElement(target)
        if (targetId && targetId !== dragLink.sourceId) {
          addLink(dragLink.sourceId!, targetId, dragLink.sourceSide)
        }
      }
    }
    dragLink.active = false
    dragLink.sourceId = null
    dragLink.preview = ''
    linkLastEvent = null
    window.removeEventListener('mousemove', onLinkMove)
    window.removeEventListener('mouseup', onLinkEnd)
  }

  /** 清理：取消 rAF 并移除 window 事件监听 */
  function cleanup() {
    if (linkRafId !== null) {
      cancelAnimationFrame(linkRafId)
      linkRafId = null
    }
    window.removeEventListener('mousemove', onLinkMove)
    window.removeEventListener('mouseup', onLinkEnd)
  }

  onBeforeUnmount(cleanup)

  return {
    dragLink,
    onLinkMouseDown,
    _cleanup: cleanup,
  }
}
