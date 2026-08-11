<template>
    <div class="file-skeleton">
        <div class="skeleton-section">
            <div style="padding: 20px;">
                <ElSkeletonItem variant="text" style="width: 120px; margin-bottom: 20px;" />
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                    <div>
                        <ElSkeletonItem variant="text" style="width: 40px; margin-bottom: 8px;" />
                        <ElSkeletonItem variant="text" style="width: 100%;" />
                    </div>
                    <div>
                        <ElSkeletonItem variant="text" style="width: 40px; margin-bottom: 8px;" />
                        <ElSkeletonItem variant="text" style="width: 80%;" />
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <ElSkeletonItem variant="text" style="width: 40px; margin-bottom: 8px;" />
                    <ElSkeletonItem variant="text" style="width: 60%;" />
                </div>
                <div>
                    <ElSkeletonItem variant="text" style="width: 40px; margin-bottom: 8px;" />
                    <ElSkeletonItem variant="text" style="width: 100%;" />
                </div>
            </div>
        </div>
        <div class="skeleton-section">
            <div style="padding: 20px;">
                <ElSkeletonItem variant="text" style="width: 120px; margin-bottom: 20px;" />
                <ElSkeletonItem variant="rect" style="width: 100%; height: 300px;" />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ElSkeletonItem } from 'element-plus'

defineOptions({ name: 'FileSkeleton' })
</script>

<style lang="scss" scoped>
.file-skeleton {
    .skeleton-section {
        background: var(--card-color);
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
    }
}
</style>
