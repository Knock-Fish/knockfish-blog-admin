<template>
  <button type="button" class="upload" :disabled="busy" @click="pick">
    <span class="glyph">{{ busy ? '◌' : '⬆' }}</span>
    {{ busy ? (text || '上传中…') : '上传图片' }}
  </button>
  <input ref="input" class="file" type="file" accept="image/*" multiple @change="onChange" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ busy?: boolean; text?: string }>()

const emit = defineEmits<{ files: [files: File[]] }>()

const input = ref<HTMLInputElement | null>(null)

function pick() {
  input.value?.click()
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  if (files.length) emit('files', files)
  target.value = ''
}
</script>

<style scoped>
.upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid var(--g-border);
  background: var(--g-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 6px 16px rgba(169, 138, 232, 0.35);
  transition: all 0.22s ease;
}

.upload:hover:not(:disabled) {
  background: var(--g-primary-strong);
  transform: translateY(-1px);
}

.upload:disabled {
  opacity: 0.7;
  cursor: progress;
  box-shadow: none;
}

.glyph {
  font-size: 12px;
}

.file {
  display: none;
}
</style>
