<template>
  <ElPopover trigger="click" placement="bottom-end" width="220">
    <template #reference>
      <ElButton class="full-screen-button" type="info" plain>
        <SvgIcon icon="mdi:settings-outline" color="#78809D" />
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
  // 深拷贝一份，避免修改原始 props 对象
  const newCols = source.map(col => ({
    ...col,
    // 确保每个列都有唯一 _uid
    _uid: col._uid || col.prop || col.label || `col_${Math.random().toString(36).slice(2)}`
  }))
  // 处理默认 show 值
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