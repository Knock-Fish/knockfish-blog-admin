import { reactive, nextTick, onBeforeUnmount } from 'vue'

/** 左侧面板最小宽度（px） */
const SPLITTER_MIN = 160
/** 左侧面板最大宽度（px） */
const SPLITTER_MAX = 900

export interface UseSplitterOptions {
  /** 拖拽结束/折叠切换后的回调（通常用于触发 fitView） */
  onResized?: () => void
}

/**
 * 左右分割条 composable
 * 管理左侧任务列表面板的宽度拖拽与折叠/展开
 * 使用原生 mousemove/mouseup 实现，无第三方拖拽库
 * 拖拽时采用 requestAnimationFrame 节流，保证跟手与丝滑
 */
export function useSplitter(options: UseSplitterOptions = {}) {
  const { onResized } = options

  // 分割条状态
  const splitter = reactive({
    leftWidth: 0,       // 当前左侧面板宽度
    dragging: false,    // 是否正在拖拽
    startX: 0,          // 拖拽起始 clientX
    startWidth: 0,      // 拖拽起始宽度
    collapsed: false,   // 是否已折叠
    lastWidth: 0,       // 折叠前的宽度（用于恢复）
  })

  // rAF 节流相关
  let moveRafId: number | null = null   // 本帧是否已排程更新
  let pendingDx = 0                     // 待应用的累计位移

  /** 切换左侧面板的折叠/展开状态 */
  function togglePanelCollapse() {
    if (splitter.collapsed) {
      splitter.leftWidth = splitter.lastWidth || 320
      splitter.collapsed = false
    } else {
      splitter.lastWidth = splitter.leftWidth
      splitter.collapsed = true
    }
    nextTick(() => {
      if (onResized) onResized()
    })
  }

  /** 分割条鼠标按下：启动拖拽，锁定全局光标与文本选择 */
  function onSplitterMouseDown(e: MouseEvent) {
    if (splitter.collapsed) return
    e.preventDefault()
    splitter.dragging = true
    splitter.startX = e.clientX
    splitter.startWidth = splitter.leftWidth
    pendingDx = 0
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    // 禁用全页过渡/选中，防止拖拽时产生抖动
    document.body.style.willChange = 'width, left'
    window.addEventListener('mousemove', onSplitterMove, { passive: true })
    window.addEventListener('mouseup', onSplitterUp)
  }

  /**
   * 鼠标移动：rAF 节流，每帧只更新一次 leftWidth
   * 避免频繁的响应式更新 + DOM reflow，保证丝滑
   */
  function onSplitterMove(e: MouseEvent) {
    if (!splitter.dragging) return
    // 累计位移，覆盖上一次的值（取最新鼠标位置）
    pendingDx = e.clientX - splitter.startX
    if (moveRafId !== null) return
    moveRafId = requestAnimationFrame(() => {
      moveRafId = null
      const newWidth = splitter.startWidth + pendingDx
      splitter.leftWidth = Math.max(SPLITTER_MIN, Math.min(SPLITTER_MAX, newWidth))
    })
  }

  /** 鼠标释放：结束拖拽，清理 rAF / 全局状态，触发回调 */
  function onSplitterUp() {
    // 把本帧 pending 的位移立刻应用，避免丢最后一段
    if (moveRafId !== null) {
      cancelAnimationFrame(moveRafId)
      moveRafId = null
      const finalWidth = splitter.startWidth + pendingDx
      splitter.leftWidth = Math.max(SPLITTER_MIN, Math.min(SPLITTER_MAX, finalWidth))
      pendingDx = 0
    }
    splitter.dragging = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.style.willChange = ''
    window.removeEventListener('mousemove', onSplitterMove)
    window.removeEventListener('mouseup', onSplitterUp)
    nextTick(() => {
      if (onResized) onResized()
    })
  }

  /** 清理：取消 rAF 并移除 window 事件监听，重置全局样式 */
  function cleanup() {
    if (moveRafId !== null) {
      cancelAnimationFrame(moveRafId)
      moveRafId = null
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.style.willChange = ''
    window.removeEventListener('mousemove', onSplitterMove)
    window.removeEventListener('mouseup', onSplitterUp)
  }

  onBeforeUnmount(cleanup)

  return {
    splitter,
    SPLITTER_MIN,
    SPLITTER_MAX,
    togglePanelCollapse,
    onSplitterMouseDown,
    _cleanup: cleanup,
  }
}
