<template>
  <svg class="link-layer" :width="width" :height="height">
    <defs>
      <marker id="gantt-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <path d="M0,0 L10,3 L0,6 Z" :fill="isDark ? '#67c23a' : '#409eff'" />
      </marker>
    </defs>
    <g v-for="link in links" :key="link.id">
      <path
        :d="link.path"
        stroke="var(--gantt-link-color, #409eff)"
        stroke-width="1.5"
        fill="none"
        marker-end="url(#gantt-arrow)"
        @click.stop="onClick(link)"
        class="link-path"
      />
    </g>
    <path
      v-if="preview"
      :d="preview"
      stroke="var(--el-color-danger)"
      stroke-width="1.5"
      stroke-dasharray="4,4"
      fill="none"
    />
  </svg>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

export interface RenderedLink {
  id: string
  path: string
}

defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  links: { type: Array as PropType<RenderedLink[]>, required: true },
  preview: { type: String, default: '' },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits({
  click: (link: RenderedLink) => true,
})

function onClick(link: RenderedLink) {
  emit('click', link)
}
</script>

<style lang="scss">
.link-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 3;

  .link-path {
    pointer-events: stroke;
    cursor: pointer;
    transition: stroke-width 0.2s;

    &:hover {
      stroke-width: 2.5;
      stroke: var(--el-color-danger) !important;
    }
  }
}
</style>
