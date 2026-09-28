import { ref, nextTick, type Ref, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'

export interface UseTimelineExpandOptions {
  ganttWrapRef: Ref<HTMLDivElement | undefined>
  timelineStart: Ref<dayjs.Dayjs>
  timelineEnd: Ref<dayjs.Dayjs>
  scaleCfg: Ref<{ unit: dayjs.ManipulateType; step: number; columnWidth: number }>
  initialized: Ref<boolean>
}

/**
 * 时间轴自动扩展 composable
 * 监听甘特图滚动事件，当滚动接近右边界时自动向后扩展时间轴
 */
export function useTimelineExpand(options: UseTimelineExpandOptions) {
  const { ganttWrapRef, timelineStart, timelineEnd, scaleCfg, initialized } = options

  // 当前 scrollLeft（响应式，供外部读取）
  const scrollLeft = ref(0)
  // 是否正在扩展中（防止重复触发）
  let isExpanding = false
  // rAF 节流句柄
  let scrollRafId: number | null = null

  /**
   * 扩展时间轴
   * @param direction 1=向后扩展 / -1=向前扩展
   * 向前扩展时会同步修正 scrollLeft，保持可视内容位置不变
   */
  function expandTimeline(direction: 1 | -1) {
    const expandAmount = 14
    if (direction === 1) {
      timelineEnd.value = timelineEnd.value.add(expandAmount, 'day')
    } else {
      timelineStart.value = timelineStart.value.subtract(expandAmount, 'day')
      nextTick(() => {
        if (ganttWrapRef.value) {
          const cfg = scaleCfg.value
          const pxPerDay = cfg.columnWidth / cfg.step
          ganttWrapRef.value.scrollLeft += expandAmount * pxPerDay
        }
        isExpanding = false
      })
      return
    }
    setTimeout(() => { isExpanding = false }, 100)
  }

  /**
   * 滚动事件处理：rAF 节流
   * 当滚动到距右边界 100px 以内时触发向后扩展
   */
  function onScroll(e: Event) {
    const el = e.target as HTMLElement
    scrollLeft.value = el.scrollLeft

    // 初始化完成前不触发扩展
    if (!initialized.value) return

    if (scrollRafId !== null) return
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null
      const wrap = ganttWrapRef.value
      if (!wrap) return
      if (!isExpanding && wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 100) {
        isExpanding = true
        expandTimeline(1)
      }
    })
  }

  /** 清理：取消 rAF */
  function cleanup() {
    if (scrollRafId !== null) {
      cancelAnimationFrame(scrollRafId)
      scrollRafId = null
    }
  }

  onBeforeUnmount(cleanup)

  return {
    scrollLeft,
    onScroll,
    expandTimeline,
    _cleanup: cleanup,
  }
}
