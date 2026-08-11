<template>
    <div class="loading-spinner">
        <ElIcon class="spinner-icon" :size="32">
            <Loading />
        </ElIcon>
        <span class="spinner-text">加载中...</span>
    </div>
</template>

<script setup lang='ts'>
import { ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

defineOptions({ name: 'LoadingSpinner' })
</script>

<style lang="scss" scoped>
.loading-spinner {
    width: 100%;
    height: 100%;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    @include card();

    .spinner-icon {
        color: var(--primary-color, #3390ff);
        animation: rotating 1.5s linear infinite;
    }

    .spinner-text {
        font-size: 13px;
        color: var(--text-color-secondary, #909399);
    }
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
