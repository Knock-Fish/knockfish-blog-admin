<template>
  <div ref="pageRef" class="gallery-page">
    <div class="topbar">
      <!-- 画幅筛选的数字只统计正常图，隐藏/回收站视图里隐藏掉，避免数字与列表对不上 -->
      <FilterTabs v-if="mode === 'normal'" v-model="filter" :counts="counts" />

      <div class="topbar-actions">
        <span class="stat">
          <template v-if="mode === 'trash'">回收站 {{ total }} 张</template>
          <template v-else-if="mode === 'hidden'">已隐藏 {{ total }} 张</template>
          <template v-else>
            {{ filter === 'all' ? `共 ${counts.all} 张` : `已筛选 ${total} / ${counts.all} 张` }}
            · {{ formatBytes(totalSize) }}
          </template>
        </span>
        <button type="button" class="ghost" :disabled="loading" @click="refresh">
          {{ loading ? '加载中…' : '刷新' }}
        </button>
        <button type="button" class="ghost" :class="{ active: mode === 'normal' }" @click="switchMode('normal')">
          图库
        </button>
        <button type="button" class="ghost" :class="{ active: mode === 'hidden' }" @click="switchMode('hidden')">
          隐藏{{ hiddenCount ? ` ${hiddenCount}` : '' }}
        </button>
        <button type="button" class="ghost" :class="{ active: mode === 'trash' }" @click="switchMode('trash')">
          回收站{{ trashCount ? ` ${trashCount}` : '' }}
        </button>
        <!-- 权限码上线后端后自动生效：无权限时不渲染；回收站内不提供上传 -->
        <UploadButton
          v-if="can(GalleryPerm.UPLOAD) && mode === 'normal'"
          :busy="uploading"
          :text="uploadProgress ? `上传中 ${uploadProgress}` : ''"
          @files="handleUpload"
        />
      </div>
    </div>

    <div ref="scrollRef" class="scroll" @scroll.passive="handleScroll">
      <p v-if="loading" class="hint">图片加载中…</p>

      <MasonryGallery
        v-else-if="filtered.length"
        :photos="filtered"
        :mode="mode"
        @select="lightboxIndex = $event"
        @copy="handleCopy"
        @remove="handleRemove"
        @toggle-nsfw="handleToggleNsfw"
        @toggle-hidden="handleToggleHidden"
        @restore="handleRestore"
        @purge="handlePurge"
        @natural-size="applyNaturalSize"
      />

      <div v-else class="hint">
        <template v-if="mode === 'trash'">
          <p>回收站是空的</p>
          <p>在图库里点 ✕ 会把图片移到这里，可再恢复或彻底删除</p>
        </template>
        <template v-else-if="mode === 'hidden'">
          <p>没有隐藏的图片</p>
          <p>在图库里点 ⊖ 会把图片隐藏起来，前台看不到，但仍保留在这里</p>
        </template>
        <template v-else>
          <p>{{ counts.all ? '当前分类下还没有图片' : '图库里还没有图片' }}</p>
          <p>点击右上角「上传图片」，或把图片放进 R2 存储桶</p>
        </template>
      </div>

      <p v-if="!loading && filtered.length" class="footer">
        {{ hasMore
          ? (loading ? '加载中…' : '向下滚动加载更多')
          : (mode === 'trash'
            ? `共 ${total} 张 · 恢复后前台立即可见`
            : mode === 'hidden'
              ? `共 ${total} 张 · 隐藏的图片前台不会展示`
              : `共 ${total} 张 · 点击图片查看大图`) }}
      </p>
    </div>

    <!-- 上传失败明细：toast 一闪就没了，改成必须手动关闭的弹窗 -->
    <ElDialog
      v-model="failedDialog"
      title="以下图片上传失败"
      width="min(560px, 92vw)"
      append-to-body
      class="failed-dialog"
    >
      <p class="failed-hint">
        共 {{ failedUploads.length }} 个文件未上传成功，可调整后重新选择上传：
      </p>
      <ul class="failed-list">
        <li v-for="(item, index) in failedUploads" :key="index">
          <span class="name">{{ item.name }}</span>
          <span v-if="item.reason" class="reason">{{ item.reason }}</span>
        </li>
      </ul>
      <template #footer>
        <ElButton type="primary" @click="failedDialog = false">我知道了</ElButton>
      </template>
    </ElDialog>

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
import { useGalleryPhotos, type UploadFailureItem } from './composables/useGalleryPhotos'
import { formatBytes } from './utils/photo'
import { GalleryPerm } from '@/constants'
import { useUserStore } from '@/store/modules/user'
import type { GalleryPhoto } from './types'

defineOptions({ name: 'Gallery' })

const {
  counts, filtered, total, hasMore, totalSize, trashCount, hiddenCount, loading, uploading, uploadProgress, filter, mode,
  refresh, loadMore, uploadFiles, remove, toggleNsfw, toggleHidden, restore, purge, applyNaturalSize,
} = useGalleryPhotos()

const userStore = useUserStore()
const pageRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)

const lightboxIndex = ref<number | null>(null)

/** 上传失败明细弹窗 */
const failedDialog = ref(false)
const failedUploads = ref<UploadFailureItem[]>([])

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
  if (success) ElMessage.success(`已上传 ${success} 张图片`)
  if (failed.length) {
    // 失败明细用弹窗，避免 toast 一闪而过看不清
    failedUploads.value = failed
    failedDialog.value = true
  }
}

async function handleCopy(photo: GalleryPhoto) {
  const url = photo.original || photo.src
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
      '移入回收站后前台不再展示，图片文件仍保留在存储中。',
      '移除图片',
      { type: 'warning', confirmButtonText: '移入回收站', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await remove(photo.id)
  } catch (e) {
    ElMessage.error(errorText(e, '移入回收站失败'))
    return
  }
  // 删除后列表变短，当前索引可能越界
  if (lightboxIndex.value !== null && lightboxIndex.value >= filtered.value.length) lightboxIndex.value = null
  ElMessage.success('已移入回收站')
}

/** 把后端返回的 msg 带出来，别只弹"请稍后重试" */
function errorText(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { msg?: string } }; message?: string }
  const msg = err?.response?.data?.msg || err?.message
  return msg ? `${fallback}：${msg}` : fallback
}

/** 在 图库 / 已隐藏 / 回收站 三个视图间切换 */
function switchMode(target: 'normal' | 'hidden' | 'trash') {
  mode.value = target
  // 切视图时把画幅筛选复位，否则会把上一次的筛选带到新视图里
  filter.value = 'all'
  lightboxIndex.value = null
  scrollRef.value?.scrollTo({ top: 0 })
}

/** 切换敏感标记：标记后前台列表缩略图模糊，点开大图正常 */
async function handleToggleNsfw(photo: GalleryPhoto) {
  try {
    await toggleNsfw(photo.id)
    ElMessage.success(photo.nsfw ? '已标记为敏感（前台列表会模糊）' : '已取消敏感标记')
  } catch (e) {
    ElMessage.error(errorText(e, '操作失败'))
  }
}

/** 隐藏 / 取消隐藏：隐藏后前台列表与详情都取不到，后台在「隐藏」视图里管理 */
async function handleToggleHidden(photo: GalleryPhoto) {
  const willHide = mode.value !== 'hidden'
  try {
    await toggleHidden(photo.id)
    ElMessage.success(willHide ? '已隐藏，前台不再展示' : '已取消隐藏，前台恢复展示')
    if (lightboxIndex.value !== null && lightboxIndex.value >= filtered.value.length) lightboxIndex.value = null
  } catch (e) {
    ElMessage.error(errorText(e, willHide ? '隐藏失败' : '取消隐藏失败'))
  }
}

/** 从回收站恢复 */
async function handleRestore(photo: GalleryPhoto) {
  try {
    await restore(photo.id)
    ElMessage.success('已恢复到图库')
    if (lightboxIndex.value !== null && lightboxIndex.value >= filtered.value.length) lightboxIndex.value = null
  } catch (e) {
    ElMessage.error(errorText(e, '恢复失败'))
  }
}

/** 彻底删除（含 R2 对象，不可恢复） */
async function handlePurge(photo: GalleryPhoto) {
  try {
    await ElMessageBox.confirm(
      '将同时删除原图、缩略图、预览图三个文件，删除后无法恢复。',
      '彻底删除',
      { type: 'warning', confirmButtonText: '彻底删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' },
    )
  } catch {
    return
  }
  try {
    await purge(photo.id)
    ElMessage.success('已彻底删除')
    if (lightboxIndex.value !== null && lightboxIndex.value >= filtered.value.length) lightboxIndex.value = null
  } catch (e) {
    ElMessage.error(errorText(e, '删除失败'))
  }
}

/** 距离底部不足 240px 时加载下一页 */
function handleScroll() {
  const el = scrollRef.value
  if (!el || loading.value || !hasMore.value) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) void loadMore()
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

    &.active {
      border-color: var(--g-primary, var(--el-color-primary));
      background: var(--g-primary-soft, rgba(64, 158, 255, 0.12));
      color: var(--g-primary-strong, var(--el-color-primary));
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
