<template>
  <div class="slide-verify" :style="wrapStyle">
    <div class="slide-bg">
      <div class="slide-fill" :style="{ width: fillWidth + 'px' }"></div>
      <span v-if="!isSuccess" class="slide-tips">{{ tipsText }}</span>
      <span v-else class="slide-success-tips">{{ successText }}</span>
    </div>

    <div
      class="slide-block"
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
const maxMove = computed(() => defaultWidth - defaultHeight)
const fillWidth = computed(() => blockLeft.value)

const wrapStyle = computed(() => ({
  width: `${defaultWidth}px`,
  height: `${defaultHeight}px`,
  background: props.bgColor ?? '#e8e8e8',
}))

// 鼠标拖拽
const handleMouseDown = () => {
  if (isSuccess.value || props.disabled) return
  isDragging.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  blockLeft.value += e.movementX
  blockLeft.value = Math.max(0, Math.min(blockLeft.value, maxMove.value))
}
const handleMouseUp = () => {
  clearDragEvent()
  checkVerify()
}

// 触摸拖拽（修复TS类型报错）
const handleTouchStart = () => {
  if (isSuccess.value || props.disabled) return
  isDragging.value = true
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}
const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  // 修复1：判断touch存在
  const touch = e.touches[0]
  if (!touch) return

  // 修复2：类型断言 EventTarget -> HTMLElement
  const targetEl = touch.target as HTMLElement
  const rect = targetEl.getBoundingClientRect()
  const diff = touch.clientX - rect.left - blockLeft.value
  blockLeft.value += diff
  blockLeft.value = Math.max(0, Math.min(blockLeft.value, maxMove.value))
}
const handleTouchEnd = () => {
  clearDragEvent()
  checkVerify()
}

// 清除全局事件
const clearDragEvent = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
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
    emit('fail')
  }
}

// 重置对外暴露
const reset = () => {
  blockLeft.value = 0
  isSuccess.value = false
  emit('reset')
}

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

    &:active {
      cursor: grabbing;
    }
  }
}
</style>