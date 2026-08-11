<template>
    <div class="table-skeleton">
        <div class="skeleton-row" v-for="i in count" :key="i">
            <div class="skeleton-checkbox"></div>
            <div class="skeleton-cell skeleton-cell-index"></div>
            <div class="skeleton-cell skeleton-cell-main"></div>
            <div class="skeleton-cell skeleton-cell-medium"></div>
            <div class="skeleton-cell skeleton-cell-medium"></div>
            <div class="skeleton-cell skeleton-cell-action"></div>
        </div>
    </div>
</template>

<script setup lang='ts'>
defineOptions({ name: 'TableSkeleton' })

withDefaults(defineProps<{
    count?: number
}>(), {
    count: 8
})
</script>

<style lang="scss" scoped>
.table-skeleton {
    padding: 0 16px;
    animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
    0%, 100% {
        opacity: 0.4;
    }
    50% {
        opacity: 0.8;
    }
}

.skeleton-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    &:last-child {
        border-bottom: none;
    }
}

.skeleton-checkbox {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton-cell {
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;

    &-index {
        width: 60px;
        height: 20px;
    }

    &-main {
        flex: 1;
        height: 24px;
        max-width: 300px;
    }

    &-medium {
        width: 150px;
        height: 20px;
    }

    &-action {
        width: 100px;
        height: 32px;
    }
}

@keyframes skeleton-shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}
</style>
