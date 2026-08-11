<template>
    <ElCard class="card-tag" shadow="never">
        <template #header v-if="slotHeader">
            <div class="table-header">
                <slot :name="slotHeader"></slot>
                <div class="icon-list">
                    <DataRefresh @click="refresh" />
                    <FullScreenPage :target-ref="fullTargetRef" />
                    <ExcelExport :table-data="tableData" />
                    <TableColumnSetting :columns="columns" @update:columns="handleColumnsUpdate" />
                    <TableSetting
                        :stripe="tableStripe"
                        :border="tableBorder"
                        @update:stripe="tableStripe = $event"
                        @update:border="tableBorder = $event"
                    />
                </div>
            </div>

        </template>

        <!-- 骨架屏 -->
        <TableSkeleton v-if="loading" />

        <!-- 表格内容 -->
        <ElTable v-else v-loading="loading" :data="tableData" height="100%"
            v-on="componentsEmit" :stripe="tableStripe" :border="tableBorder">
            <template v-for="item in columns" :key="item._uid || item.prop">
                <!-- 选择列 -->
                <ElTableColumn v-if="item.type === 'selection'"
                    type="selection" />

                <!-- 序号列 -->
                <ElTableColumn
                    v-else-if="item.type === 'index' && item.show !== false"
                    type="index" :width="item.width || '80'"
                    :label="item.label || '序号'" />

                <!-- 普通列 -->
                <ElTableColumn v-else-if="item.show !== false" :prop="item.prop"
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
import { ref, watch } from 'vue'
import TableSkeleton from './widget/TableSkeleton.vue'
import DataRefresh from './widget/DataRefresh.vue'
import ExcelExport from './widget/ExcelExport.vue'
import FullScreenPage from './widget/FullScreenPage.vue'
import TableColumnSetting from './widget/TableColumnSetting.vue'
import TableSetting from './widget/TableSetting.vue'
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
    show?: boolean
    _uid?: string | number
}
interface TableData {
    [key: string]: any
}
const porps = withDefaults(defineProps<{
    columns: TableColumn[]
    tableData: TableData[]
    pagination?: boolean    // 是否开启分页
    fullTargetRef?: HTMLElement | null
    slotHeader?: string
    page?: {
        total?: number
        pageNum: number
        pageSize: number
    }
    loading?: boolean    // 是否加载中
    stripe?: boolean    // 是否为斑马纹
    border?: boolean    // 是否带有纵向边框
}>(), {
    page: () => ({ total: 0, pageNum: 1, pageSize: 10 }),
    pagination: true,
    fullTargetRef: null,
    loading: false,
    show: true,
    stripe: false,
    border: false
})

const tableStripe = ref(porps.stripe)
const tableBorder = ref(porps.border)

watch(() => porps.stripe, (val) => {
    tableStripe.value = val
})

watch(() => porps.border, (val) => {
    tableBorder.value = val
})

const emit = defineEmits<{
    (e: 'currentPage', page: number): void
    (e: 'pageSize', size: number): void
    (e: 'row-click', row: any, column: any, event: MouseEvent): void
    (e: 'refresh'): void
    (e: 'columns', columns: TableColumn[]): void
}>()
const refresh = () => {
    emit('refresh')
}
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
/** 处理列配置更新（拖拽排序 + 显隐切换） */
const handleColumnsUpdate = (newColumns: TableColumn[]): void => {
    const colMap = new Map<string, TableColumn>()
    porps.columns.forEach(col => {
        colMap.set(`${col.prop}_${col.type || ''}`, col)
    })

    // 构建新顺序数组
    const reordered: TableColumn[] = []
    const lastIndex = newColumns.length - 1
    newColumns.forEach((newCol, index) => {
        const original = colMap.get(`${newCol.prop}_${newCol.type || ''}`)
        if (original) {
            original.show = newCol.show
            // 智能处理 fixed：如果 fixed 列被移到不一致位置，清除 fixed
            if (original.fixed === 'right' && index !== lastIndex) {
                original.fixed = false
            }
            if (original.fixed === 'left' && index !== 0) {
                original.fixed = false
            }
            reordered.push(original)
        }
    })
    // 兜底：未出现在新数组中的列保持追加
    porps.columns.forEach(col => {
        if (!newColumns.find(nc => nc.prop === col.prop && nc.type === col.type)) {
            reordered.push(col)
        }
    })

    porps.columns.splice(0, porps.columns.length, ...reordered)
    emit('columns', newColumns)
}
</script>

<style lang="scss" scoped>
.card-tag {
    /* padding: 0 10px; */
    border-radius: 10px;
    transition: none;

    .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        // margin-bottom: 20px;
        .icon-list {
            display: flex;
        }
    }

    .table-tag {
        width: 100%;
    }
}
</style>