<template>
  <div class="list-view">
    <ElTable :data="tasks" style="width: 100%; height: 100%" row-key="id"
      :default-expand-all="true" :row-style="{ height: rowHeight + 'px' }"
      :cell-style="{ padding: '0 8px' }" @expand-change="onExpandChange">
      <ElTableColumn prop="text" label="任务名称" min-width="150"
        show-overflow-tooltip />
      <ElTableColumn label="类型" min-width="90" align="center">
        <template #default="{ row }">
          <ElTag :type="getTypeTagType(row.type)" size="small" effect="plain">
            {{ getTypeLabel(row.type) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="开始日期" min-width="120" align="center">
        <template #default="{ row }">
          <span>{{ formatDate(row.start) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="结束日期" min-width="120" align="center">
        <template #default="{ row }">
          <span>{{ formatDate(row.end || row.start) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="进度" min-width="130" align="center">
        <template #default="{ row }">
          <ElProgress :percentage="Math.round((row.progress || 0) * 100)"
            :status="getProgressStatus(row)" :stroke-width="10" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" min-width="90" align="center">
        <template #default="{ row }">
          <ElTag :type="getStatusTagType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" min-width="125" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton type="success" link title="新增子任务"
            @click="emit('add-child', row)">
            <Icon icon="ri:add-line" />
          </ElButton>
          <ElButton type="primary" link title="编辑任务" @click="emit('edit', row)">
            <Icon icon="ri:edit-line" />
          </ElButton>
          <ElButton type="danger" link title="删除任务"
            @click="emit('delete', row)">
            <Icon icon="ri:delete-bin-line" />
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs'
import type { GanttTask, TaskStatus, TaskType } from '../types'

defineProps<{
  tasks: GanttTask[]
  rowHeight: number
}>()

const emit = defineEmits<{
  (e: 'expand-change', row: GanttTask, expanded: GanttTask[]): void
  (e: 'add-child', row: GanttTask): void
  (e: 'edit', row: GanttTask): void
  (e: 'delete', row: GanttTask): void
}>()

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '未开始',
  doing: '进行中',
  done: '已完成',
  delay: '已延期',
  cancel: '已取消',
}

const TYPE_LABEL: Record<TaskType, string> = {
  task: '任务',
  milestone: '里程碑',
  project: '汇总',
}

function getTypeLabel(type: TaskType | undefined) {
  return type ? TYPE_LABEL[type] : '-'
}

function getTypeTagType(type: TaskType | undefined) {
  switch (type) {
    case 'milestone': return 'warning'
    case 'project': return 'success'
    default: return 'info'
  }
}

function onExpandChange(row: GanttTask, expanded: GanttTask[]) {
  emit('expand-change', row, expanded)
}

function formatDate(date: string | undefined) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

function getStatusLabel(status: TaskStatus | undefined) {
  return status ? STATUS_LABEL[status] : '-'
}

function getStatusTagType(status: TaskStatus | undefined) {
  switch (status) {
    case 'done': return 'success'
    case 'doing': return 'primary'
    case 'delay': return 'danger'
    case 'cancel': return 'info'
    default: return 'warning'
  }
}

function getProgressStatus(row: GanttTask) {
  if (row.status === 'delay') return 'exception'
  if (row.status === 'done' || row.progress === 1) return 'success'
  if (row.progress === 0) return '' as any
  return undefined
}
</script>

<style lang="scss" scoped>
/* .action-group {
  display: flex;
  align-items: center;
  justify-content: center;
} */
</style>
