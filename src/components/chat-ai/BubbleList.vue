<template>
    <div class="bubble-list" ref="containerRef">
        <slot></slot>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, watch } from 'vue'

const containerRef = ref<HTMLElement | null>(null)

const props = withDefaults(defineProps<{
    autoScroll?: boolean
}>(), {
    autoScroll: true
})

const scrollToBottom = () => {
    if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
}

defineExpose({
    scrollToBottom
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
