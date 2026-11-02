<template>
  <span ref="host" class="lazy" :class="{ loaded, failed }">
    <img
      v-if="currentSrc"
      :src="currentSrc"
      :alt="alt"
      loading="lazy"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />
    <span v-if="failed" class="failed-tip">图片加载失败</span>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    /** 提前多少像素开始加载 */
    rootMargin?: string
  }>(),
  { rootMargin: '300px 0px' },
)

const emit = defineEmits<{ naturalSize: [width: number, height: number] }>()

const host = ref<HTMLElement | null>(null)
const currentSrc = ref('')
const loaded = ref(false)
const failed = ref(false)

let observer: IntersectionObserver | null = null

function reveal() {
  if (currentSrc.value) return
  currentSrc.value = props.src
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    reveal()
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) reveal()
    },
    { rootMargin: props.rootMargin },
  )

  if (host.value) observer.observe(host.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

function onLoad(event: Event) {
  const image = event.target as HTMLImageElement
  loaded.value = true
  emit('naturalSize', image.naturalWidth, image.naturalHeight)
}

function onError() {
  failed.value = true
}
</script>

<style scoped>
.lazy {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  background: linear-gradient(120deg, var(--g-primary-soft-2) 25%, var(--g-primary-soft) 50%, var(--g-primary-soft-2) 75%);
  background-size: 200% 100%;
  animation: g-shimmer 1.6s linear infinite;
}

.lazy.loaded {
  animation: none;
  background: var(--g-primary-soft-2);
}

.lazy img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.45s var(--g-ease), transform 0.6s var(--g-ease);
  will-change: opacity, transform;
}

.lazy.loaded img {
  opacity: 1;
}

.lazy.failed {
  animation: none;
  background: repeating-linear-gradient(
    135deg,
    var(--g-primary-soft-2),
    var(--g-primary-soft-2) 10px,
    var(--g-primary-soft) 10px,
    var(--g-primary-soft) 20px
  );
}

.failed-tip {
  position: absolute;
  inset: auto 0 0;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--g-text-sub);
}

@keyframes g-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
