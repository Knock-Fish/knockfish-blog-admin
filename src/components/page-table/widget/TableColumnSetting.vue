<template>
  <ElPopover trigger="click" placement="bottom-end" width="100">
    <template #reference>
      <ElButton class="full-screen-button" type="info" plain>
        <SvgIcon icon="mdi:align-horizontal-left"/>
      </ElButton>
    </template>
    <ElScrollbar max-height="320px">
      <Draggable
        v-model="internalColumns"
        item-key="_uid"
        handle=".drag-handle"
        :animation="150"
        @end="handleDragEnd"
      >
        <div class="column-item" v-for="col in internalColumns" :key="col._uid">
          <span class="drag-handle" style="cursor: grab; margin-right: 8px;">☰</span>
          <ElCheckbox
            v-if="col.type !== 'selection'"
            v-model="col.show"
            :disabled="col._permissionControlled && !col.show"
            @change="handleColumnChange"
          >
            {{ col.label }}
          </ElCheckbox>
        </div>
      </Draggable>
    </ElScrollbar>
  </ElPopover>
</template>

<script setup lang="ts">
import { VueDraggableNext as Draggable } from 'vue-draggable-next'

interface TableColumn {
  type?: string
  prop?: string
  label?: string
  show?: boolean
  _permissionControlled?: boolean
  _uid?: string | number
}

const props = defineProps<{
  columns: TableColumn[]
}>()

const emit = defineEmits<{
  (e: 'update:columns', value: TableColumn[]): void
}>()

// 内部列数据副本
const internalColumns = ref<TableColumn[]>([])

// 用于标记是否为内部触发更新（防止循环）
let isInternalUpdate = false

// 初始化/同步外部数据
function syncColumns(source: TableColumn[]) {
  const newCols = source.map(col => ({
    ...col,
    // 确定性 _uid：优先用 prop（业务列），再用 label（无 prop 的特殊列），保证拖拽后不失效
    _uid: col.prop || col.label || col._uid || `col_${Math.random().toString(36).slice(2)}`
  }))
  newCols.forEach(col => {
    if (col.type !== 'selection' && col.show === undefined) {
      col.show = true
    }
  })
  internalColumns.value = newCols
}

// 监听外部 props 变化（但跳过由内部触发的更新）
watch(
  () => props.columns,
  (newCols) => {
    if (isInternalUpdate) {
      isInternalUpdate = false
      return
    }
    syncColumns(newCols)
  },
  { deep: true, immediate: true }
)

// 复选框变化：同步列状态给父组件
function handleColumnChange() {
  isInternalUpdate = true
  const updatedCols = internalColumns.value.map(col => ({ ...col }))
  emit('update:columns', updatedCols)
}

// 拖拽结束：将当前内部顺序同步给父组件
function handleDragEnd() {
  isInternalUpdate = true
  // 发送新数组（深拷贝，避免后续被意外修改）
  const newOrder = internalColumns.value.map(col => ({ ...col }))
  emit('update:columns', newOrder)
}
</script>

<style lang="scss" scoped>
.full-screen-button {
  margin-left: 15px;
  @include icon-button;
}
.column-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
}
.drag-handle {
  cursor: grab;
  user-select: none;
  color: #999;
  &:active {
    cursor: grabbing;
  }
}
</style>