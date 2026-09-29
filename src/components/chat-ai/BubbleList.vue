<template>
    <div class="bubble-list" ref="containerRef">
        <slot></slot>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, onUnmounted, watch } from 'vue'

/** 距底部多少 px 以内视为贴底，超过即认为用户在上翻查看历史 */
const BOTTOM_THRESHOLD = 48

const containerRef = ref<HTMLElement | null>(null)

const props = withDefaults(defineProps<{
    autoScroll?: boolean
}>(), {
    autoScroll: true
})

// 是否跟随到底部：初始 true；用户主动上翻后自动关闭，滚回底部自动恢复
const stickToBottom = ref(true)

/** 当前是否处于底部附近 */
const isNearBottom = () => {
    const el = containerRef.value
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
}

const scrollToBottom = () => {
    if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight
        stickToBottom.value = true // 主动滚到底 = 恢复跟随
    }
}

/**
 * 流式输出期间的粘性跟随
 * 只有用户本来就贴在底部附近时才自动滚动，避免每次收到一段文本就被强行拽回底部
 * 重新滚回底部后自动恢复跟随
 */
const followBottom = () => {
    if (!stickToBottom.value) return
    scrollToBottom()
}

/** 记录用户滚动后的跟随状态；用 passive 监听避免影响滚动性能 */
const onScroll = () => {
    stickToBottom.value = isNearBottom()
}

onMounted(() => {
    containerRef.value?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', onScroll)
})

defineExpose({
    scrollToBottom,
    followBottom,
})

watch(() => props.autoScroll, (val) => {
    if (val) {
        scrollToBottom()
    }
})
</script>

<style lang="scss" scoped>
.bubble-list {
    width: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
}
</style>
