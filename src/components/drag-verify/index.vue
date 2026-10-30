<template>
  <div class="slide-verify" :style="wrapStyle" :class="{ 'is-shake': shaking }">
    <div class="slide-bg">
      <div class="slide-fill" :style="{ width: fillWidth + 'px' }"></div>
      <span v-if="!isSuccess" class="slide-tips">{{ tipsText }}</span>
      <span v-else class="slide-success-tips">{{ successText }}</span>
    </div>

    <div
      class="slide-block"
      :class="{ 'is-dragging': isDragging }"
      :style="{ left: blockLeft + 'px', background: props.blockBg }"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <slot name="block">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  width?: number
  height?: number
  successOffset?: number
  bgColor?: string
  fillColor?: string
  blockBg?: string
  tipsText?: string
  successText?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
  fail: []
  reset: []
}>()

const defaultWidth = props.width ?? 300
const defaultHeight = props.height ?? 40
const tolerance = props.successOffset ?? 5

const blockLeft = ref(0)
const isDragging = ref(false)
const isSuccess = ref(false)
/** 校验失败时的抖动反馈，替代原来的弹框提示 */
const shaking = ref(false)
const maxMove = computed(() => defaultWidth - defaultHeight)
const fillWidth = computed(() => blockLeft.value)

// 拖拽起点（每次按下时记录，位移 = 当前坐标 - 起点坐标，避免累加误差）
let startX = 0
let startLeft = 0
/** 是否产生过有效位移：轻点滑块不算一次校验，避免误判失败 */
let hasMoved = false
let shakeTimer: ReturnType<typeof setTimeout> | null = null

const MOVE_THRESHOLD = 2

const clampLeft = (val: number) => Math.max(0, Math.min(val, maxMove.value))

const wrapStyle = computed(() => ({
  width: `${defaultWidth}px`,
  height: `${defaultHeight}px`,
  background: props.bgColor ?? '#e8e8e8',
}))

// ---------------- 鼠标拖拽 ----------------
const handleMouseDown = (e: MouseEvent) => {
  if (isSuccess.value || props.disabled) return
  if (e.button !== 0) return
  e.preventDefault()
  beginDrag(e.clientX, blockLeft.value)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  e.preventDefault()
  moveTo(startLeft + (e.clientX - startX))
}
const handleMouseUp = () => {
  clearDragEvent()
  finishDrag()
}

// ---------------- 触摸拖拽 ----------------
const handleTouchStart = (e: TouchEvent) => {
  if (isSuccess.value || props.disabled) return
  const touch = e.touches[0]
  if (!touch) return
  // 阻止浏览器把横向拖动识别为页面滚动 / 侧滑返回（元素级监听默认非 passive，可生效）
  e.preventDefault()
  beginDrag(touch.clientX, blockLeft.value)
  // touchmove 必须在 document 上以 passive: false 注册，否则 preventDefault 无效
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
  document.addEventListener('touchcancel', handleTouchEnd)
}
const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  const touch = e.touches[0]
  if (!touch) return
  // 关键：阻住浏览器的手势接管（滚动 / 侧滑返回）
  if (e.cancelable) e.preventDefault()
  moveTo(startLeft + (touch.clientX - startX))
}
const handleTouchEnd = () => {
  clearDragEvent()
  finishDrag()
}

const beginDrag = (clientX: number, left: number) => {
  isDragging.value = true
  hasMoved = false
  startX = clientX
  startLeft = left
}

const moveTo = (nextLeft: number) => {
  const left = clampLeft(nextLeft)
  if (Math.abs(left - startLeft) > MOVE_THRESHOLD) hasMoved = true
  blockLeft.value = left
}

/** 松手：没有有效位移就只是归位，不判失败、不触发提示 */
const finishDrag = () => {
  if (!hasMoved) {
    if (!isSuccess.value) blockLeft.value = 0
    return
  }
  hasMoved = false
  checkVerify()
}

// 清除全局事件
const clearDragEvent = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('touchcancel', handleTouchEnd)
}

// 校验逻辑
const checkVerify = () => {
  const target = maxMove.value
  if (Math.abs(blockLeft.value - target) <= tolerance) {
    isSuccess.value = true
    blockLeft.value = target
    emit('success')
  } else {
    blockLeft.value = 0
    triggerShake()
    emit('fail')
  }
}

const triggerShake = () => {
  shaking.value = false
  if (shakeTimer) clearTimeout(shakeTimer)
  // 下一帧再开启，保证连续失败也能重新播放动画
  requestAnimationFrame(() => {
    shaking.value = true
    shakeTimer = setTimeout(() => {
      shaking.value = false
      shakeTimer = null
    }, 320)
  })
}

// 重置对外暴露
const reset = () => {
  blockLeft.value = 0
  isSuccess.value = false
  hasMoved = false
  clearDragEvent()
  emit('reset')
}

onBeforeUnmount(() => {
  clearDragEvent()
  if (shakeTimer) clearTimeout(shakeTimer)
})

defineExpose({ reset })
</script>

<style lang="scss" scoped>
$text-gray: #b88894;
$primary: #f8c8d8;
$white: #b88894;
$shadow: 0 0 3px rgba(0, 0, 0, 0.2);

.slide-verify {
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  // 手势全部交给组件自己处理，避免被浏览器当成滚动 / 侧滑返回
  touch-action: none;

  &.is-shake {
    animation: slide-shake 0.32s ease-in-out;
  }

  .slide-bg {
    width: 100%;
    height: 100%;
    position: relative;

    .slide-fill {
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background: $primary;
      transition: none;
    }

    .slide-tips,
    .slide-success-tips {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      pointer-events: none;
    }

    .slide-tips {
      color: $text-gray;
    }

    .slide-success-tips {
      color: $white;
      font-weight: 500;
    }
  }

  .slide-block {
    position: absolute;
    top: 0;
    width: 100%;
    max-width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    box-shadow: $shadow;
    transition: left 0.1s ease-out;
    touch-action: none;
    -webkit-user-drag: none;

    // 拖动过程中去掉过渡，保证跟手
    &.is-dragging {
      transition: none;
      cursor: grabbing;
    }

    &:active {
      cursor: grabbing;
    }
  }
}

@keyframes slide-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-4px);
  }

  75% {
    transform: translateX(4px);
  }
}
</style>