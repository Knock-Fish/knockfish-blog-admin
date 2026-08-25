<template>
  <div class="gantt-toolbar">
    <ElButton size="small" @click="emit('add', null)">
      <Icon icon="ri:add-line" />
      新增任务
    </ElButton>
    <ElDivider direction="vertical" />
    <ElButtonGroup size="small">
      <ElButton :type="currentScale === 'hour' ? 'primary' : ''" @click="emit('scale-change', 'hour')">时</ElButton>
      <ElButton :type="currentScale === 'day' ? 'primary' : ''" @click="emit('scale-change', 'day')">日</ElButton>
      <ElButton :type="currentScale === 'week' ? 'primary' : ''" @click="emit('scale-change', 'week')">周</ElButton>
      <ElButton :type="currentScale === 'month' ? 'primary' : ''" @click="emit('scale-change', 'month')">月</ElButton>
    </ElButtonGroup>
    <ElDivider direction="vertical" />
    <ElButton size="small" @click="emit('fit-view')">
      <Icon icon="ri:fullscreen-line" /> 适配
    </ElButton>
    <ElButton size="small" @click="emit('locate-today')" title="定位到今天">
      <Icon icon="ri:calendar-2-line" /> 今天
    </ElButton>
    <ElDatePicker
      v-model="pickedDate"
      type="datetime"
      placeholder="定位到指定时间"
      format="YYYY-MM-DD HH:mm:ss"
      date-format="MMM DD, YYYY"
      time-format="HH:mm"
      size="small"
      clearable
      style="width: 200px"
      @change="onDateChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { ScaleType } from '../types'

defineProps<{
  currentScale: ScaleType
}>()

const emit = defineEmits<{
  (e: 'add', refTaskId: string | null): void
  (e: 'scale-change', scale: ScaleType): void
  (e: 'fit-view'): void
  (e: 'locate-today'): void
  (e: 'locate-date', date: string): void
}>()

// 选中的定位时间
const pickedDate = ref<string>('')

/** 日期变化时触发定位（清空时不触发） */
function onDateChange(val: string | null) {
  if (val) emit('locate-date', val)
}
</script>
