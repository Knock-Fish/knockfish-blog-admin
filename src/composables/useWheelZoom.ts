import type { Ref } from 'vue'
import type { ScaleType } from '../components/gantt-chart/types'

export interface UseWheelZoomOptions {
  ganttWrapRef: Ref<HTMLDivElement | undefined>
  columnWidths: Record<ScaleType, number>
  currentScale: Ref<ScaleType>
}

/**
 * 滚轮缩放 composable
 * 处理甘特图区域的滚轮事件：
 * - Shift + 滚轮 / 横向滚轮：水平滚动
 * - Ctrl/Cmd + 滚轮：缩放列宽（20px ~ 240px）
 * - 普通滚轮：垂直滚动
 */
export function useWheelZoom(options: UseWheelZoomOptions) {
  const { ganttWrapRef, columnWidths, currentScale } = options

  /** 甘特图滚轮事件处理入口 */
  function onGanttWheel(e: WheelEvent) {
    const wrap = ganttWrapRef.value
    if (!wrap) return
    const delta = e.deltaY || e.deltaX
    // Shift + 滚轮 或 横向滚轮 → 水平滚动
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      wrap.scrollLeft += (e.deltaX || delta)
      return
    }
    // Ctrl/Cmd + 滚轮 → 缩放列宽
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const cur = columnWidths[currentScale.value]
      const next = Math.max(20, Math.min(240, cur + (delta < 0 ? 8 : -8)))
      if (next !== cur) {
        columnWidths[currentScale.value] = next
      }
      return
    }
    // 普通滚轮 → 垂直滚动
    wrap.scrollTop += delta
  }

  return {
    onGanttWheel,
  }
}
