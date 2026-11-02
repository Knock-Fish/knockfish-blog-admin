<template>
  <div class="tabs-bar">
    <div class="tabs">
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        class="tab"
        :class="{ active: modelValue === tab.value }"
        @click="emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
        <em v-if="counts[tab.value]">{{ counts[tab.value] }}</em>
      </button>
    </div>

    <div v-if="$slots.extra" class="extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrientationFilter } from '../types'

defineProps<{
  modelValue: OrientationFilter
  counts: Record<OrientationFilter, number>
}>()

const emit = defineEmits<{ 'update:modelValue': [value: OrientationFilter] }>()

const TABS: { value: OrientationFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'landscape', label: '横图' },
  { value: 'portrait', label: '竖图' },
  { value: 'square', label: '方图' },
]
</script>

<style scoped>
/* 分段控件：外层是浅浅的“轨道”，只有选中项带胶囊白底 + 细阴影 */
.tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  padding: 4px;
  border-radius: 999px;
  background: var(--g-seg-track);
}

.tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/**
 * 必须显式清掉 border / background / appearance：
 * 本项目没有做 button 全局 reset，UA 默认样式会给出灰底 + 深灰描边。
 */
.tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 16px;
  border: none;
  border-radius: 999px;
  background: transparent;
  appearance: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--g-text-sub);
  transition: color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
}

.tab:hover {
  color: var(--g-text);
}

.tab.active {
  color: var(--g-text);
  background: var(--g-seg-active);
  box-shadow: 0 2px 10px rgba(150, 120, 190, 0.14);
}

.tab em {
  font-size: 11px;
  font-style: normal;
  opacity: 0.6;
}

.extra {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 10px;
  font-size: 12px;
  color: var(--g-text-sub);
  white-space: nowrap;
}
</style>
