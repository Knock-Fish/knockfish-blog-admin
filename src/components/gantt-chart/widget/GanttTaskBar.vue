<template>
  <ElPopover
    trigger="hover"
    placement="top"
    :width="280"
    :show-after="250"
    :hide-after="80"
    :offset="6"
    popper-class="task-bar-popover"
  >
    <template #reference>
      <div
        class="task-bar"
        :class="[
          'type-' + task.type,
          'status-' + task.status,
          { 'is-selected': isSelected, 'is-dragging': isDragging }
        ]"
        :style="barStyle"
        @mousedown.left.stop="onMouseDown($event, 'move')"
        @dblclick.stop="emit('dblclick', task)"
        @contextmenu.prevent="emit('contextmenu', $event, task)"
      >
        <!-- 普通任务 -->
        <template v-if="task.type === 'task'">
          <div class="bar-progress" :style="{ width: (task.progress || 0) * 100 + '%' }"></div>
          <div class="bar-text">
            <span class="bar-name">{{ task.text }}</span>
            <span class="bar-percent">{{ Math.round((task.progress || 0) * 100) }}%</span>
          </div>
          <!-- 左右拉伸手柄 -->
          <div class="handle handle-left" @mousedown.left.stop="onMouseDown($event, 'resize-left')"></div>
          <div class="handle handle-right" @mousedown.left.stop="onMouseDown($event, 'resize-right')"></div>
          <!-- 进度手柄 -->
          <div
            class="handle handle-progress"
            :style="{ left: (task.progress || 0) * 100 + '%' }"
            @mousedown.left.stop="onMouseDown($event, 'progress')"
            v-if="task.progress !== undefined"
          ></div>
        </template>

        <!-- 里程碑（菱形 + 文本，仅支持移动） -->
        <template v-else-if="task.type === 'milestone'">
          <div class="milestone-diamond"></div>
          <div class="milestone-text">{{ task.text }}</div>
        </template>

        <!-- 汇总任务（括号样式边框 + 文本，仅支持移动） -->
        <template v-else-if="task.type === 'project'">
          <div class="summary-bar"></div>
          <div class="summary-text">{{ task.text }}</div>
        </template>

        <!-- 连线端点 -->
        <div
          class="link-endpoint link-start"
          @mousedown.left.stop="emit('link-start', $event, task, 'start')"
          title="拖拽建立依赖"
        ></div>
        <div
          class="link-endpoint link-end"
          @mousedown.left.stop="emit('link-end', $event, task, 'end')"
          title="拖拽建立依赖"
        ></div>
      </div>
    </template>

    <!-- 悬停详情 -->
    <div class="task-bar-popover-content">
      <div class="popover-title">{{ task.text }}</div>
      <div class="popover-row">
        <span class="popover-label">类型</span>
        <span class="popover-value">{{ typeLabel }}</span>
      </div>
      <div class="popover-row">
        <span class="popover-label">状态</span>
        <span class="popover-value" :class="'status-text-' + task.status">
          <i class="status-dot" :class="'status-dot-' + task.status"></i>
          {{ statusLabel }}
        </span>
      </div>
      <div class="popover-row">
        <span class="popover-label">开始时间</span>
        <span class="popover-value">{{ formatTime(task.start) }}</span>
      </div>
      <div class="popover-row">
        <span class="popover-label">结束时间</span>
        <span class="popover-value">{{ task.end ? formatTime(task.end) : '-' }}</span>
      </div>
      <div class="popover-row" v-if="task.type === 'task'">
        <span class="popover-label">进度</span>
        <span class="popover-value">
          <span class="progress-bar">
            <span class="progress-bar-inner" :style="{ width: (task.progress || 0) * 100 + '%' }"></span>
          </span>
          <span class="progress-text">{{ Math.round((task.progress || 0) * 100) }}%</span>
        </span>
      </div>
      <div class="popover-row" v-if="task.owner">
        <span class="popover-label">负责人</span>
        <span class="popover-value">{{ task.owner }}</span>
      </div>
      <div class="popover-desc" v-if="task.description">{{ task.description }}</div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType, CSSProperties } from 'vue'
import dayjs from 'dayjs'
import type { GanttTask, DragMode, TaskType, TaskStatus } from '../types'

const TYPE_LABEL: Record<TaskType, string> = {
  task: '普通任务',
  milestone: '里程碑',
  project: '汇总任务',
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
  delay: '延期',
  cancel: '已取消',
}

const props = defineProps({
  task: { type: Object as PropType<GanttTask>, required: true },
  barStyle: { type: Object as PropType<CSSProperties>, required: true },
  isSelected: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false },
})

const emit = defineEmits({
  mousedown: (e: MouseEvent, task: GanttTask, mode: DragMode) => true,
  dblclick: (task: GanttTask) => true,
  contextmenu: (e: MouseEvent, task: GanttTask) => true,
  'link-start': (e: MouseEvent, task: GanttTask, side: 'start' | 'end') => true,
  'link-end': (e: MouseEvent, task: GanttTask, side: 'start' | 'end') => true,
})

const typeLabel = computed(() => TYPE_LABEL[props.task.type])
const statusLabel = computed(() => STATUS_LABEL[props.task.status])

function formatTime(t: string): string {
  const d = dayjs(t)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : t
}

function onMouseDown(e: MouseEvent, mode: DragMode) {
  emit('mousedown', e, props.task, mode)
}
</script>

<style lang="scss">
.task-bar {
  position: absolute;
  z-index: 4;
  cursor: move;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &.is-selected {
    z-index: 5;
    box-shadow: 0 0 0 2px var(--el-color-primary), 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &.is-dragging {
    opacity: 0.85;
  }

  /* 普通任务 */
  &.type-task {
    background: var(--bar-color);
    color: #fff;
    font-size: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

    .bar-progress {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.35);
      border-right: 2px solid rgba(255, 255, 255, 0.7);
      transition: width 0.1s;
    }

    .bar-text {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .bar-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .bar-percent {
        margin-left: 6px;
        font-variant-numeric: tabular-nums;
        opacity: 0.9;
      }
    }
  }

  /* 里程碑（父容器已占满整行高度，top:50% 相对行高，行中心与连线端点 y = idx*rh + rh/2 对齐） */
  &.type-milestone {
    background: transparent;
    box-shadow: none;
    cursor: pointer;

    .milestone-diamond {
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      width: 16px;
      height: 16px;
      background: var(--bar-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .milestone-text {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      white-space: nowrap;
      font-size: 12px;
      font-weight: 600;
      color: var(--bar-color);
      text-shadow: 0 0 2px var(--card-color);
    }
  }

  /* 汇总任务 */
  &.type-project {
    background: transparent;
    box-shadow: none;
    cursor: pointer;

    .summary-bar {
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 10px;
      transform: translateY(-50%);
      border: 2px solid var(--bar-color);
      border-top: none;
      border-radius: 2px;
    }

    .summary-text {
      position: absolute;
      left: 4px;
      top: -2px;
      font-size: 11px;
      color: var(--bar-color);
      font-weight: 600;
      white-space: nowrap;
      background: var(--card-color);
      padding: 0 4px;
    }
  }

  /* 拖拽手柄 */
  .handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    z-index: 2;

    &.handle-left {
      left: 0;
    }

    &.handle-right {
      right: 0;
    }

    &.handle-progress {
      width: 10px;
      height: 100%;
      top: 0;
      transform: translateX(-50%);
      cursor: col-resize;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 2px;

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 10px;
        background: var(--bar-color);
      }
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  /* 连线端点 */
  .link-endpoint {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--bar-color);
    border: 2px solid var(--card-color);
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 3;
    cursor: crosshair;

    &.link-start {
      left: -5px;
    }

    &.link-end {
      right: -5px;
    }
  }

  &:hover .link-endpoint {
    opacity: 1;
  }
}

/* 暗黑模式 */
html.dark .task-bar {
  &.type-task .bar-progress {
    background: rgba(255, 255, 255, 0.25);
  }

  .summary-text,
  .milestone-text {
    background: var(--card-color);
    text-shadow: 0 0 3px var(--card-color);
  }
}

/* ========== 任务条悬停弹层 ========== */
.task-bar-popover {
  --el-popover-padding: 12px 14px;

  .task-bar-popover-content {
    font-size: 13px;
    color: var(--el-text-color-primary);

    .popover-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      color: var(--el-text-color-primary);
      word-break: break-all;
      line-height: 1.4;
    }

    .popover-row {
      display: flex;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
      line-height: 1.5;

      .popover-label {
        width: 64px;
        color: var(--el-text-color-secondary);
        flex-shrink: 0;
      }

      .popover-value {
        flex: 1;
        color: var(--el-text-color-primary);
        word-break: break-all;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.status-dot-todo {
        background: #909399;
      }

      &.status-dot-doing {
        background: #409eff;
      }

      &.status-dot-done {
        background: #67c23a;
      }

      &.status-dot-delay {
        background: #f56c6c;
      }

      &.status-dot-cancel {
        background: #c0c4cc;
      }
    }

    .status-text-delay {
      color: #f56c6c;
    }

    .status-text-doing {
      color: #409eff;
    }

    .status-text-done {
      color: #67c23a;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--el-fill-color-light);
      border-radius: 3px;
      overflow: hidden;
      max-width: 120px;

      .progress-bar-inner {
        display: block;
        height: 100%;
        background: var(--el-color-primary);
        border-radius: 3px;
        transition: width 0.2s;
      }
    }

    .progress-text {
      font-variant-numeric: tabular-nums;
      color: var(--el-text-color-regular);
      flex-shrink: 0;
    }

    .popover-desc {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--el-border-color-lighter);
      font-size: 12px;
      color: var(--el-text-color-regular);
      line-height: 1.6;
      max-height: 96px;
      overflow-y: auto;
      word-break: break-all;
      white-space: pre-wrap;
    }
  }
}
</style>
