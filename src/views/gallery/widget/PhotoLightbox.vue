<template>
  <Transition name="g-fade">
    <div v-if="current" class="lightbox" @click.self="close">
      <button type="button" class="lb-btn close" title="关闭 (Esc)" @click="close">✕</button>
      <button type="button" class="lb-btn prev" title="上一张 (←)" :disabled="photos.length < 2" @click="step(-1)">
        ‹
      </button>

      <figure class="figure">
        <img
          :key="current.id"
          class="photo"
          :class="{ loaded }"
          :src="current.src"
          :alt="current.title"
          @load="loaded = true"
        />
        <figcaption class="caption">
          <strong>{{ current.title }}</strong>
          <span>
            {{ (index ?? 0) + 1 }} / {{ photos.length }} · {{ current.width }}×{{ current.height }} ·
            {{ formatBytes(current.size) }}
          </span>
          <button type="button" class="copy" @click="emit('copy', current)">复制地址</button>
        </figcaption>
      </figure>

      <button type="button" class="lb-btn next" title="下一张 (→)" :disabled="photos.length < 2" @click="step(1)">
        ›
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHotkeys } from '../composables/useHotkeys'
import type { GalleryPhoto } from '../types'
import { formatBytes } from '../utils/photo'

const props = defineProps<{ photos: GalleryPhoto[] }>()

const emit = defineEmits<{ copy: [photo: GalleryPhoto] }>()

/** null 表示关闭 */
const index = defineModel<number | null>({ default: null })

const loaded = ref(false)

const current = computed(() => (index.value === null ? null : (props.photos[index.value] ?? null)))

/** 预加载左右相邻图片，翻页时不再白屏 */
function preloadNeighbors() {
  if (index.value === null) return
  const total = props.photos.length
  if (!total) return
  for (const offset of [-1, 1]) {
    const photo = props.photos[(index.value + offset + total) % total]
    if (photo) new Image().src = photo.src
  }
}

watch(current, (photo) => {
  loaded.value = false
  if (photo) preloadNeighbors()
})

function step(delta: number) {
  const total = props.photos.length
  if (!total || index.value === null) return
  index.value = (index.value + delta + total) % total
}

function close() {
  index.value = null
}

useHotkeys({ Escape: close, ArrowLeft: () => step(-1), ArrowRight: () => step(1) }, () => index.value !== null)
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5vh 6vw;
  background: var(--g-mask);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

.figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin: 0;
  max-width: 100%;
  max-height: 100%;
}

.photo {
  max-width: 100%;
  max-height: 78vh;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo.loaded {
  opacity: 1;
}

.caption {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 12px;
  color: var(--g-text-sub);
}

.caption strong {
  font-size: 15px;
  color: var(--g-text);
}

.copy {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--g-border);
  color: var(--g-primary-strong);
  background: var(--g-surface);
  font-size: 12px;
  transition: all 0.2s ease;
}

.copy:hover {
  background: var(--g-primary-soft);
}

.lb-btn {
  position: absolute;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  appearance: none;
  background: var(--g-surface);
  color: var(--g-text);
  font-size: 22px;
  box-shadow: 0 4px 16px rgba(140, 110, 170, 0.18);
  transition: all 0.2s ease;
}

.lb-btn:hover:not(:disabled) {
  background: var(--g-primary-soft);
  transform: scale(1.08);
}

.lb-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.close {
  top: 22px;
  right: 22px;
  font-size: 17px;
}

.prev {
  left: 22px;
  top: 50%;
  translate: 0 -50%;
}

.next {
  right: 22px;
  top: 50%;
  translate: 0 -50%;
}

.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.26s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .lb-btn {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }

  .prev {
    left: 8px;
  }

  .next {
    right: 8px;
  }
}
</style>
