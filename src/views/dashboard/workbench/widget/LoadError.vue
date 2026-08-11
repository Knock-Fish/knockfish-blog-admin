<template>
    <div class="load-error">
        <ElIcon class="error-icon" :size="32">
            <CircleClose />
        </ElIcon>
        <span class="error-text">加载失败</span>
        <ElButton type="primary" link @click="handleRetry">重试</ElButton>
    </div>
</template>

<script setup lang='ts'>
import { ElIcon, ElButton } from 'element-plus'
import { CircleClose } from '@element-plus/icons-vue'

defineOptions({ name: 'LoadError' })

const emit = defineEmits<{
    (e: 'retry'): void
}>()

const handleRetry = () => {
    emit('retry')
}
</script>

<style lang="scss" scoped>
.load-error {
    width: 100%;
    height: 100%;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    @include card();

    .error-icon {
        color: var(--el-color-danger, #f56c6c);
    }

    .error-text {
        font-size: 13px;
        color: var(--text-color-secondary, #909399);
    }
}
</style>
