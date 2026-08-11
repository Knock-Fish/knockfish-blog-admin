<template>
    <ElSkeleton animated :count="count" style="padding: 0 20px;" />
</template>

<script setup lang='ts'>
import { ElSkeleton } from 'element-plus'

defineOptions({ name: 'TreeSkeleton' })

withDefaults(defineProps<{
    count?: number
}>(), {
    count: 8
})
</script>
