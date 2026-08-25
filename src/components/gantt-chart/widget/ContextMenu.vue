<template>
  <Teleport to="body">
    <div v-show="visible" class="context-mask" @click="emit('update:visible', false)" @contextmenu.prevent="emit('update:visible', false)"></div>
    <div
      v-show="visible"
      class="context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
    >
      <div class="context-item" @click="onSelect('add-child')">
        <Icon icon="ri:add-line" /> 新增子任务
      </div>
      <div class="context-item" @click="onSelect('add-after')">
        <Icon icon="ri:insert-row-bottom" /> 在下方插入
      </div>
      <div class="context-item" @click="onSelect('edit')">
        <Icon icon="ri:edit-line" /> 编辑任务
      </div>
      <div class="context-item" @click="onSelect('indent')">
        <Icon icon="ri:indent-increase" /> 降级
      </div>
      <div class="context-item" @click="onSelect('outdent')">
        <Icon icon="ri:indent-decrease" /> 升级
      </div>
      <div class="context-divider"></div>
      <div class="context-item danger" @click="onSelect('delete')">
        <Icon icon="ri:delete-bin-line" /> 删除任务
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  visible: Boolean,
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
})

const emit = defineEmits(['update:visible', 'select'] as const)

type ContextCommand = 'add-child' | 'add-after' | 'edit' | 'indent' | 'outdent' | 'delete'

function onSelect(command: ContextCommand) {
  emit('select', command)
  emit('update:visible', false)
}
</script>

<style lang="scss">
/* 右键菜单（全局样式，确保 Teleport 到 body 后仍可命中） */
.context-mask {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: var(--el-bg-color, var(--card-color));
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  font-size: 13px;

  .context-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    cursor: pointer;
    color: var(--el-text-color-regular);

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    &.danger:hover {
      color: var(--el-color-danger);
    }
  }

  .context-divider {
    height: 1px;
    background: var(--el-border-color-lighter);
    margin: 4px 0;
  }
}
</style>
