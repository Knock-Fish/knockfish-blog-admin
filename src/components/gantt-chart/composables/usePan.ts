import { reactive, type Ref, onBeforeUnmount } from 'vue'
import type { ScaleType } from '../types'

export interface UsePanOptions {
  ganttWrapRef: Ref<HTMLDivElement | undefined>
}

/**
 * 画布平移 composable
 * 在甘特图空白区域按住鼠标左键/中键拖拽，实现画布的滚动平移
 * 点击任务条或时间轴表头时不触发平移
 */
export function usePan(options: UsePanOptions) {
  const { ganttWrapRef } = options

  // 平移状态
  const pan = reactive({
    active: false,        // 是否正在平移
    startX: 0,            // 鼠标按下时的 clientX
    startY: 0,            // 鼠标按下时的 clientY
    startScrollLeft: 0,   // 按下时的 scrollLeft
    startScrollTop: 0,    // 按下时的 scrollTop
    didMove: false,       // 是否实际发生了移动（用于区分点击与拖拽）
  })

  /** 鼠标按下：若点击的是空白区域则启动平移 */
  function onPanStart(e: MouseEvent) {
    const target = e.target as HTMLElement
    // 点击任务条或时间轴表头时不平移
    if (target.closest('.task-bar') || target.closest('.gantt-timeline-header')) return
    if (e.button === 0 || e.button === 1) {
      pan.active = true
      pan.didMove = false
      pan.startX = e.clientX
      pan.startY = e.clientY
      pan.startScrollLeft = ganttWrapRef.value!.scrollLeft
      pan.startScrollTop = ganttWrapRef.value!.scrollTop
      window.addEventListener('mousemove', onPanMove)
      window.addEventListener('mouseup', onPanEnd)
    }
  }

  /** 鼠标移动：根据位移同步更新容器的 scrollLeft / scrollTop */
  function onPanMove(e: MouseEvent) {
    if (!pan.active) return
    const dx = e.clientX - pan.startX
    const dy = e.clientY - pan.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) pan.didMove = true
    if (!ganttWrapRef.value) return
    ganttWrapRef.value.scrollLeft = pan.startScrollLeft - dx
    ganttWrapRef.value.scrollTop = pan.startScrollTop - dy
  }

  /** 鼠标释放：结束平移 */
  function onPanEnd() {
    pan.active = false
    window.removeEventListener('mousemove', onPanMove)
    window.removeEventListener('mouseup', onPanEnd)
  }

  /** 清理：移除 window 事件监听 */
  function cleanup() {
    window.removeEventListener('mousemove', onPanMove)
    window.removeEventListener('mouseup', onPanEnd)
  }

  onBeforeUnmount(cleanup)

  return {
    pan,
    onPanStart,
    _cleanup: cleanup,
  }
}
