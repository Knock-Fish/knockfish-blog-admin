<template>
  <article class="slot" :style="slotStyle">
    <div
      class="card"
      :style="cardStyle"
      role="button"
      tabindex="0"
      :aria-label="photo.title"
      @click="emit('select')"
      @keydown.enter.prevent="emit('select')"
      @keydown.space.prevent="emit('select')"
    >
      <LazyImage
        :src="photo.src"
        :alt="photo.title"
        @natural-size="(width: number, height: number) => emit('naturalSize', photo.id, width, height)"
      />

      <span v-if="photo.local" class="badge">待入库</span>

      <div class="overlay">
        <span class="title">{{ photo.title }}</span>
        <span class="meta">{{ photo.width }}×{{ photo.height }} · {{ formatBytes(photo.size) }}</span>
      </div>

      <div class="actions">
        <button type="button" class="act" title="查看大图" @click.stop="emit('select')">⤢</button>
        <button type="button" class="act" title="复制图片地址" @click.stop="emit('copy')">⧉</button>
        <button type="button" class="act danger" title="移除（模拟）" @click.stop="emit('remove')">✕</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import LazyImage from './LazyImage.vue'
import type { MasonryBox } from '../composables/useMasonry'
import type { GalleryPhoto } from '../types'
import { formatBytes } from '../utils/photo'

const props = defineProps<{
  photo: GalleryPhoto
  box?: MasonryBox
  index: number
}>()

const emit = defineEmits<{
  select: []
  copy: []
  remove: []
  naturalSize: [id: string, width: number, height: number]
}>()

const slotStyle = computed<CSSProperties>(() =>
  props.box
    ? {
        transform: `translate3d(${props.box.x}px, ${props.box.y}px, 0)`,
        width: `${props.box.width}px`,
        height: `${props.box.height}px`,
      }
    : { visibility: 'hidden' },
)

/** 入场动画错峰，最多延迟 480ms，避免最后一批图片等待过久 */
const cardStyle = computed<CSSProperties>(
  () => ({ '--delay': `${Math.min(props.index * 40, 480)}ms` }) as CSSProperties,
)
</script>

<style scoped>
.slot {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.55s var(--g-ease), width 0.55s var(--g-ease), height 0.55s var(--g-ease);
  will-change: transform;
}

.card {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--g-radius);
  overflow: hidden;
  background: var(--g-surface);
  box-shadow: var(--g-shadow-sm);
  cursor: zoom-in;
  outline: none;
  animation: g-card-in 0.55s var(--g-ease) both;
  animation-delay: var(--delay, 0ms);
  transition: box-shadow 0.3s ease, transform 0.4s var(--g-ease);
}

.card:hover,
.card:focus-visible {
  box-shadow: var(--g-shadow-md);
}

.card:hover {
  transform: translateY(-2px);
}

.card:hover :deep(.lazy img) {
  transform: scale(1.04);
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--g-primary-strong);
  background: var(--g-surface-glass);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  box-shadow: var(--g-shadow-sm);
}

.overlay {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 34px 12px 11px;
  text-align: left;
  background: linear-gradient(to top, var(--g-overlay-from), transparent);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.card:hover .overlay,
.card:focus-visible .overlay {
  opacity: 1;
  transform: translateY(0);
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--g-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 11px;
  color: var(--g-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateY(-6px);
  transition: all 0.28s ease;
}

.card:hover .actions,
.card:focus-visible .actions {
  opacity: 1;
  transform: translateY(0);
}

.act {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  appearance: none;
  font-size: 12px;
  color: var(--g-text);
  background: var(--g-surface);
  box-shadow: 0 2px 8px rgba(140, 110, 170, 0.18);
  transition: all 0.2s ease;
}

.act:hover {
  color: var(--g-primary-strong);
  background: var(--g-primary-soft);
}

.act.danger:hover {
  color: var(--g-danger);
  background: var(--g-danger-soft);
}

@keyframes g-card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .slot,
  .card {
    animation: none;
    transition: none;
  }
}
</style>
