<template>
  <div class="gantt-timeline-header" :style="{ width: timelineWidth + 'px' }">
    <!-- 上层：跨月份/年份的长格 -->
    <div class="gantt-header-row header-top-row" :style="{ width: timelineWidth + 'px' }">
      <div
        v-for="g in topHeaderGroups"
        :key="g.key"
        class="header-top-cell"
        :style="{ left: g.left + 'px', width: g.width + 'px' }"
      >{{ g.label }}</div>
    </div>
    <!-- 下层：日/时/周/月 细格 -->
    <div class="gantt-header-row header-sub-row" :style="{ width: timelineWidth + 'px' }">
      <div
        v-for="cell in subHeaderCells"
        :key="cell.key"
        class="gantt-sub-cell"
        :class="{ 'is-weekend': cell.isWeekend }"
        :style="{ width: cell.width + 'px' }"
      >{{ cell.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { TopHeaderGroup, SubHeaderCell } from '../types'

defineProps({
  timelineWidth: { type: Number, required: true },
  topHeaderGroups: { type: Array as PropType<TopHeaderGroup[]>, required: true },
  subHeaderCells: { type: Array as PropType<SubHeaderCell[]>, required: true },
})
</script>

<style lang="scss">
/* 时间轴表头（全局样式，确保子组件内部元素可命中） */
.gantt-timeline-header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 48px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .gantt-header-row {
    position: relative;
    height: 24px;
    line-height: 24px;
  }

  /* 上层：月份/年份 长格（absolute 定位，横向拼接成整月） */
  .header-top-row {
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);

    .header-top-cell {
      position: absolute;
      top: 0;
      height: 100%;
      border-right: 1px solid var(--el-border-color-lighter);
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 4px;
      box-sizing: border-box;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  /* 下层：日/时/周/月 细格（flex 布局，等宽排列） */
  .header-sub-row {
    display: flex;

    .gantt-sub-cell {
      flex-shrink: 0;
      border-right: 1px solid var(--el-border-color-lighter);
      text-align: center;
      font-size: 12px;
      color: var(--el-text-color-regular);
      box-sizing: border-box;

      &.is-weekend {
        color: var(--el-color-danger);
      }
    }
  }
}

/* 拖拽任务条/平移/拖拽分割条时禁用过渡，保证跟手 */
.gantt-chart.is-dragging-task .header-top-cell,
.gantt-chart.is-panning-chart .header-top-cell,
.gantt-chart.is-resizing .header-top-cell {
  transition: none;
}

/* 暗黑模式 */
html.dark .gantt-timeline-header {
  background: var(--el-bg-color-page, #1a1a1a);
  color: var(--el-text-color-regular);

  .header-top-row {
    border-bottom-color: var(--el-border-color-darker);
    background: var(--el-bg-color-page, #1a1a1a);
  }

  .header-top-cell {
    border-right-color: var(--el-border-color-darker);
  }

  .header-sub-row .gantt-sub-cell {
    border-right-color: var(--el-border-color-darker);
  }
}
</style>
