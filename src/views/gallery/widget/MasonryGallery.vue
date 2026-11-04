<template>
  <div ref="container" class="gallery" :style="{ height: `${layout.height}px` }">
    <PhotoCard
      v-for="(photo, index) in photos"
      :key="photo.id"
      :photo="photo"
      :box="layout.boxes[photo.id]"
      :index="index"
      :mode="mode"
      @select="emit('select', index)"
      @copy="emit('copy', photo)"
      @remove="emit('remove', photo)"
      @toggle-nsfw="emit('toggleNsfw', photo)"
      @toggle-hidden="emit('toggleHidden', photo)"
      @restore="emit('restore', photo)"
      @purge="emit('purge', photo)"
      @natural-size="(id: string, width: number, height: number) => emit('naturalSize', id, width, height)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PhotoCard from './PhotoCard.vue'
import { useMasonry } from '../composables/useMasonry'
import type { GalleryPhoto } from '../types'
import { ratioOf } from '../utils/photo'

const props = defineProps<{ photos: GalleryPhoto[]; mode?: 'normal' | 'hidden' | 'trash' }>()

const emit = defineEmits<{
  select: [index: number]
  copy: [photo: GalleryPhoto]
  remove: [photo: GalleryPhoto]
  toggleNsfw: [photo: GalleryPhoto]
  toggleHidden: [photo: GalleryPhoto]
  restore: [photo: GalleryPhoto]
  purge: [photo: GalleryPhoto]
  naturalSize: [id: string, width: number, height: number]
}>()

const container = ref<HTMLElement | null>(null)

const layout = useMasonry(
  container,
  () => props.photos.map((photo) => ({ id: photo.id, ratio: ratioOf(photo) })),
  { minColumnWidth: 220, gap: 16, maxColumns: 6 },
)
</script>

<style scoped>
.gallery {
  position: relative;
  width: 100%;
  min-height: 120px;
  transition: height 0.45s var(--g-ease);
}
</style>
