<template>
    <ElCard class="card-tag" shadow="never">
        <template #header v-if="slotHeader">
            <slot :name="slotHeader"></slot>
        </template>
        
        <!-- 骨架屏 -->
        <div v-if="loading" class="skeleton-container">
            <div class="skeleton-row" v-for="i in 8" :key="i">
                <div class="skeleton-checkbox"></div>
                <div class="skeleton-cell skeleton-cell-index"></div>
                <div class="skeleton-cell skeleton-cell-main"></div>
                <div class="skeleton-cell skeleton-cell-medium"></div>
                <div class="skeleton-cell skeleton-cell-medium"></div>
                <div class="skeleton-cell skeleton-cell-action"></div>
            </div>
        </div>
        
        <!-- 表格内容 -->
        <ElTable v-else :data="tableData" height="100%" v-on="componentsEmit">
            <template v-for="item in columns" :key="item.prop">
                <!-- 选择列 -->
                <ElTableColumn v-if="item.type === 'selection'" type="selection" />

                <!-- 序号列 -->
                <ElTableColumn v-else-if="item.type === 'index'" type="index"
                    :width="item.width || '80'" :label="item.label || '序号'" />

                <!-- 普通列 -->
                <ElTableColumn v-else-if="!item.permission" :prop="item.prop"
                    :label="item.label"
                    :show-overflow-tooltip="item.showOverflowTooltip"
                    :width="item.width" :min-width="item.minWidth"
                    :align="item.align || 'left'" :fixed="item.fixed">
                    <!-- 自定义列内容 -->
                    <template #default="scope" v-if="item.slot">
                        <slot :name="item.slot" :row="scope.row"></slot>
                    </template>
                </ElTableColumn>
            </template>
        </ElTable>
        
        <template #footer v-if="!loading">
            <div v-if="pagination"
                style="display: flex; justify-content: center; align-items: center;">
                <ElPagination background layout="prev, pager, next"
                    :total="page.total" v-model:page-size="page.pageSize"
                    v-model:current-page="page.pageNum"
                    @update:current-page="handleCurrentPageChange"
                    @update:page-size="handlePageSizeChange">
                </ElPagination>
            </div>
        </template>
    </ElCard>
</template>

<script setup lang='ts'>
import { ElTable } from 'element-plus'

// 定义类型接口
interface TableColumn {
    type?: string
    prop?: string
    label?: string
    width?: string | number
    minWidth?: string | number
    slot?: string
    fixed?: string | boolean    // 'left' | 'right'
    align?: string  // 'left' | 'center' | 'right'
    showOverflowTooltip?: boolean
    permission?: boolean
}
interface TableData {
    [key: string]: any
}
const porps = withDefaults(defineProps<{
    columns: TableColumn[]
    tableData: TableData[]
    pagination?: boolean    // 是否开启分页
    slotHeader?: string
    page?: {
        total?: number
        pageNum: number
        pageSize: number
    }
    loading?: boolean    // 是否加载中
}>(), {
    page: () => ({ total: 0, pageNum: 1, pageSize: 10 }),
    pagination: true,
    loading: false
})
const emit = defineEmits<{
    (e: 'currentPage', page: number): void
    (e: 'pageSize', size: number): void
    (e: 'row-click', row: any, column: any, event: MouseEvent): void
}>()
const componentsEmit = computed(() => {
  return {
    rowClick: (row: any, column: any, event: MouseEvent) => emit('row-click', row, column, event)
  }
})
/** 更新当前页面 */
const handleCurrentPageChange = (newPage: number): void => {
    porps.page.pageNum = newPage
    emit("currentPage", newPage)
}
/** 更新当前页条数 */
const handlePageSizeChange = (newSize: number): void => {
    porps.page.pageSize = newSize
    porps.page.pageNum = 1
    emit("pageSize", newSize)
}
</script>

<style lang="scss" scoped>
.card-tag {
    /* padding: 0 10px; */
    border-radius: 10px;
    transition: none;

    .table-header {
        margin-bottom: 20px;
    }

    .table-tag {
        width: 100%;
    }
}

.skeleton-container {
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
