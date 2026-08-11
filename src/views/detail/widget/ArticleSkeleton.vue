<template>
    <div class="article-skeleton">
        <div style="padding: 20px;">
            <ElSkeletonItem variant="text" style="width: 60%; margin-bottom: 20px;" />
            <ElSkeletonItem variant="text" style="width: 40%; margin-bottom: 30px;" />
            <ElSkeletonItem variant="rect" style="width: 100%; height: 200px; margin-bottom: 30px;" />
            <ElSkeletonItem variant="text" style="width: 100%; margin-bottom: 10px;" />
            <ElSkeletonItem variant="text" style="width: 90%; margin-bottom: 10px;" />
            <ElSkeletonItem variant="text" style="width: 85%; margin-bottom: 10px;" />
            <ElSkeletonItem variant="text" style="width: 95%; margin-bottom: 10px;" />
            <ElSkeletonItem variant="text" style="width: 80%;" />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ElSkeletonItem } from 'element-plus'

defineOptions({ name: 'ArticleSkeleton' })
</script>

<style lang="scss" scoped>
.article-skeleton {
    padding: 0;
}
</style>
