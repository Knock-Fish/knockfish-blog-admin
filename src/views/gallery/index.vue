<template>
  <div ref="pageRef" class="gallery-page">
    <div class="topbar">
      <FilterTabs v-model="filter" :counts="counts" />

      <div class="topbar-actions">
        <span class="stat">
          {{ filter === 'all' ? `共 ${counts.all} 张` : `已筛选 ${filtered.length} / ${counts.all} 张` }}
          · {{ formatBytes(totalSize) }}
        </span>
        <button type="button" class="ghost" :disabled="loading" @click="refresh">
          {{ loading ? '加载中…' : '刷新' }}
        </button>
        <!-- 权限码上线后端后自动生效：无权限时不渲染 -->
        <UploadButton v-if="can(GalleryPerm.UPLOAD)" :busy="uploading" @files="handleUpload" />
      </div>
    </div>

    <div ref="scrollRef" class="scroll">
      <p v-if="loading" class="hint">图片加载中…</p>

      <MasonryGallery
        v-else-if="filtered.length"
        :photos="filtered"
        @select="lightboxIndex = $event"
        @copy="handleCopy"
        @remove="handleRemove"
        @natural-size="applyNaturalSize"
      />

      <div v-else class="hint">
        <p>{{ counts.all ? '当前分类下还没有图片' : '图库里还没有图片' }}</p>
        <p>点击右上角「上传图片」，或把图片放进 R2 存储桶</p>
      </div>

      <p v-if="!loading && filtered.length" class="footer">
        共 {{ filtered.length }} 张 · 点击图片查看大图
      </p>
    </div>

    <PhotoLightbox v-model="lightboxIndex" :photos="filtered" @copy="handleCopy" />
    <FloatingActions v-show="lightboxIndex === null" @to-top="scrollToTop" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import FilterTabs from './widget/FilterTabs.vue'
import MasonryGallery from './widget/MasonryGallery.vue'
import PhotoLightbox from './widget/PhotoLightbox.vue'
import FloatingActions from './widget/FloatingActions.vue'
import UploadButton from './widget/UploadButton.vue'
import { useGalleryPhotos } from './composables/useGalleryPhotos'
import { formatBytes } from './utils/photo'
import { GalleryPerm } from '@/constants'
import { useUserStore } from '@/store/modules/user'
import type { GalleryPhoto } from './types'

defineOptions({ name: 'Gallery' })

const { counts, filtered, totalSize, loading, uploading, filter, refresh, uploadFiles, remove, applyNaturalSize } =
  useGalleryPhotos()

const userStore = useUserStore()
const pageRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)

const lightboxIndex = ref<number | null>(null)

/**
 * 权限码尚未写入后端（下一步补 SQL），此时用户权限列表里查不到图库码。
 * 为避免本地审查时按钮全被隐藏，这里做「无权限码即放行」的过渡处理；
 * 后端返回图库权限码后，校验自动生效。
 */
const can = (code: string) =>
  userStore.permissions.length === 0 || userStore.permissions.includes(code)

/** 大图打开时锁住列表滚动，关闭后恢复 */
watch(lightboxIndex, (index) => {
  if (!scrollRef.value) return
  scrollRef.value.style.overflow = index === null ? '' : 'hidden'
})

/** 切换筛选后列表整体变化，关掉大图避免索引错位 */
watch(filter, () => {
  lightboxIndex.value = null
})

onMounted(refresh)

async function handleUpload(files: File[]) {
  const { success, failed } = await uploadFiles(files)
  if (success) ElMessage.success(`已添加 ${success} 张图片（模拟上传，未落库）`)
  if (failed.length) ElMessage.error(`${failed.length} 个文件不是图片：${failed.slice(0, 2).join('、')}`)
}

async function handleCopy(photo: GalleryPhoto) {
  const url = new URL(photo.src, window.location.origin).href
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('图片地址已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制：' + url)
  }
}

async function handleRemove(photo: GalleryPhoto) {
  try {
    await ElMessageBox.confirm(
      photo.local ? '确定要移除这张本地预览图吗？' : '确定要从图库移除该图片吗？删除后无法恢复！',
      '移除图片',
      { type: 'warning', confirmButtonText: '确定移除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  remove(photo.id)
  // 删除后列表变短，当前索引可能越界
  if (lightboxIndex.value !== null && lightboxIndex.value >= filtered.value.length) lightboxIndex.value = null
  ElMessage.success('已移除（模拟操作）')
}

function scrollToTop() {
  scrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style lang="scss" src="./style/gallery.scss"></style>

<style lang="scss" scoped>
.gallery-page {
  @include page;
  gap: 12px;

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: none;
    flex-wrap: wrap;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .stat {
    font-size: 12px;
    color: var(--g-text-sub);
    white-space: nowrap;
  }

  .ghost {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--g-border);
    background: var(--g-surface);
    color: var(--g-primary-strong);
    font-size: 12px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--g-primary-soft);
    }

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  .scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0 -4px;
    padding: 4px;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: var(--g-primary-soft);
    }
  }

  .hint {
    padding: 60px 20px;
    text-align: center;
    font-size: 13px;
    line-height: 1.9;
    color: var(--g-text-sub);

    p {
      margin: 0;
    }
  }

  .footer {
    margin: 26px 0 6px;
    text-align: center;
    font-size: 12px;
    color: var(--g-text-sub);
  }
}
</style>
