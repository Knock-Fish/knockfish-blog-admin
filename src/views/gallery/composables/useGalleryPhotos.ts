import { computed, ref, watch } from 'vue'
import { GalleryService, type GalleryPhotoVO } from '@/api/galleryApi'
import type { GalleryPhoto, OrientationFilter, PhotoOrientation } from '../types'

/** 单个上传失败项：文件名 + 原因（原因来自后端或前端判定） */
export interface UploadFailureItem {
  name: string
  reason?: string
}

export interface UploadResult {
  success: number
  failed: UploadFailureItem[]
}

/** 视图模式 → 后端 status：0 正常 / 1 隐藏 / 2 回收站 */
const MODE_STATUS: Record<'normal' | 'hidden' | 'trash', number> = {
  normal: 0,
  hidden: 1,
  trash: 2,
}

/** 每页数量，与后端默认值一致 */
const PAGE_SIZE = 24
/** 每批上传张数：后端上限 10，压到 5 是为了一次失败不影响太多张 */
const UPLOAD_BATCH_SIZE = 5
/** 每批总体积上限（multipart 全局上限 50MB，留余量） */
const UPLOAD_BATCH_BYTES = 35 * 1024 * 1024

/** 后端 LocalDateTime 可能带 T 也可能带空格，统一成可解析格式 */
function parseTime(value?: string): number {
  if (!value) return 0
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const time = Date.parse(normalized)
  return Number.isNaN(time) ? 0 : time
}

/** 后端 VO → 页面模型 */
function toPhoto(vo: GalleryPhotoVO): GalleryPhoto {
  return {
    id: String(vo.photoId),
    name: vo.fileName,
    title: vo.title || vo.fileName,
    src: vo.thumbUrl,
    preview: vo.previewUrl || vo.thumbUrl,
    original: vo.originalUrl,
    width: vo.width ?? 0,
    height: vo.height ?? 0,
    size: Number(vo.fileSize ?? 0),
    nsfw: vo.nsfw === 1,
    mtime: parseTime(vo.createTime),
  }
}

/**
 * 图库数据源（对接 /api/admin/gallery）。
 *
 * 分页策略：首屏拉第 1 页，滚动到底部继续加载（loadMore），
 * 筛选（全部/横/竖/方）交给后端 orientation 参数，切换时重新拉第 1 页。
 * 顶部数字与总占用来自 /stats，不依赖已加载的那几页。
 */
export function useGalleryPhotos() {
  const items = ref<GalleryPhoto[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  /** 上传进度文案，如 "3/12"；不在上传时为空 */
  const uploadProgress = ref('')
  const filter = ref<OrientationFilter>('all')
  /** 视图模式：正常图库 / 已隐藏 / 回收站 */
  const mode = ref<'normal' | 'hidden' | 'trash'>('normal')
  const total = ref(0)
  const stats = ref({
    allCount: 0,
    landscape: 0,
    portrait: 0,
    square: 0,
    totalSize: 0,
    trashCount: 0,
    hiddenCount: 0,
  })

  /** 当前已加载到的页码，0 表示还没加载 */
  let pageNum = 0
  /** 请求序号，用于丢弃过期响应（快速切筛选时避免串数据） */
  let requestSeq = 0

  const filtered = computed(() => items.value)
  const hasMore = computed(() => items.value.length < total.value)
  const counts = computed<Record<OrientationFilter, number>>(() => ({
    all: Number(stats.value.allCount ?? 0),
    landscape: Number(stats.value.landscape ?? 0),
    portrait: Number(stats.value.portrait ?? 0),
    square: Number(stats.value.square ?? 0),
  }))
  const totalSize = computed(() => Number(stats.value.totalSize ?? 0))
  const trashCount = computed(() => Number(stats.value.trashCount ?? 0))
  const hiddenCount = computed(() => Number(stats.value.hiddenCount ?? 0))

  async function loadStats() {
    try {
      stats.value = await GalleryService.getStats()
    } catch {
      // 统计失败不影响列表展示，静默降级为上次的值
    }
  }

  async function fetchPage(reset: boolean) {
    const seq = ++requestSeq
    loading.value = true
    try {
      const nextPage = reset ? 1 : pageNum + 1
      const data = await GalleryService.getPhotoPage({
        pageNum: nextPage,
        pageSize: PAGE_SIZE,
        orientation: filter.value === 'all' ? undefined : filter.value,
        status: MODE_STATUS[mode.value],
      })
      // 已有更新的请求发出，丢弃这次结果
      if (seq !== requestSeq) return

      const list = (data.list ?? []).map(toPhoto)
      items.value = reset ? list : [...items.value, ...list]
      total.value = Number(data.total ?? 0)
      pageNum = nextPage
    } catch {
      if (reset) {
        items.value = []
        total.value = 0
      }
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  /** 重新加载第一页 + 统计 */
  async function refresh() {
    pageNum = 0
    await Promise.all([fetchPage(true), loadStats()])
  }

  /** 滚动到底部时追加下一页 */
  async function loadMore() {
    if (loading.value || !hasMore.value) return
    await fetchPage(false)
  }

  /**
   * 批量上传：按「5 张 / 35MB」分批调用批量接口，后端并发处理。
   * 单张失败只影响它自己，最后统一汇总提示。
   */
  async function uploadFiles(files: File[]): Promise<UploadResult> {
    if (!files.length) return { success: 0, failed: [] }

    const images = files.filter((file) => file.type.startsWith('image/'))
    const failed: UploadFailureItem[] = files
      .filter((file) => !file.type.startsWith('image/'))
      .map((file) => ({ name: file.name, reason: '不是图片文件' }))
    if (!images.length) return { success: 0, failed }

    uploading.value = true
    let success = 0
    let done = 0
    const totalCount = images.length
    const created: GalleryPhoto[] = []
    uploadProgress.value = `0/${totalCount}`

    try {
      for (const chunk of chunkFiles(images)) {
        try {
          const result = await GalleryService.uploadPhotos(chunk)
          created.push(...(result.success ?? []).map(toPhoto))
          success += result.success?.length ?? 0
          failed.push(...(result.failed ?? []).map((item) => ({ name: item.fileName, reason: item.reason })))
        } catch {
          // 整批失败（网络/超时/权限），把这一批都记为失败
          failed.push(...chunk.map((file) => ({ name: file.name, reason: '上传请求失败（网络或服务异常）' })))
        }
        done += chunk.length
        uploadProgress.value = `${done}/${totalCount}`
      }

      // 只把当前筛选下可见的照片插进列表，避免"传了却看不到"
      const visible = mode.value === 'normal'
        ? created.filter((photo) => filter.value === 'all' || filter.value === orientationOf(photo))
        : []
      if (visible.length) items.value = [...visible.reverse(), ...items.value]
      total.value += success
      if (success) await loadStats()
      return { success, failed }
    } finally {
      uploading.value = false
      uploadProgress.value = ''
    }
  }

  /** 移入回收站 */
  async function remove(id: string) {
    await GalleryService.deletePhoto(Number(id))
    items.value = items.value.filter((photo) => photo.id !== id)
    total.value = Math.max(0, total.value - 1)
    await loadStats()
  }

  /** 切换敏感标记（前台列表缩略图是否模糊） */
  async function toggleNsfw(id: string) {
    const photo = items.value.find((item) => item.id === id)
    if (!photo) return
    const next = photo.nsfw ? 0 : 1
    await GalleryService.updatePhoto({ photoId: Number(id), nsfw: next })
    photo.nsfw = next === 1
  }

  /** 隐藏 / 取消隐藏：当前在「已隐藏」视图就是取消，否则是隐藏 */
  async function toggleHidden(id: string) {
    const photo = items.value.find((item) => item.id === id)
    if (!photo) return
    const nextHidden = mode.value !== 'hidden'
    await GalleryService.setHidden(Number(id), nextHidden)
    // 两种情况下它都不再属于当前列表，直接移除
    items.value = items.value.filter((item) => item.id !== id)
    total.value = Math.max(0, total.value - 1)
    await loadStats()
  }

  /** 从回收站恢复 */
  async function restore(id: string) {
    await GalleryService.restorePhoto(Number(id))
    items.value = items.value.filter((photo) => photo.id !== id)
    total.value = Math.max(0, total.value - 1)
    await loadStats()
  }

  /** 彻底删除（同时删对象），仅回收站可用 */
  async function purge(id: string) {
    await GalleryService.purgePhoto(Number(id))
    items.value = items.value.filter((photo) => photo.id !== id)
    total.value = Math.max(0, total.value - 1)
    await loadStats()
  }

  /** 真实尺寸与清单不一致时用它校准布局（后端已存宽高，通常不会触发） */
  function applyNaturalSize(id: string, width: number, height: number) {
    const photo = items.value.find((item) => item.id === id)
    if (!photo || !width || !height) return
    if (photo.width === width && photo.height === height) return
    photo.width = width
    photo.height = height
  }

  /** 筛选或视图变化：回到第一页重新拉（合并成一个 watch，避免同时改两者时发两次请求） */
  watch([filter, mode], () => {
    pageNum = 0
    void fetchPage(true)
  })

  return {
    items,
    loading,
    uploading,
    uploadProgress,
    filter,
    mode,
    filtered,
    total,
    hasMore,
    counts,
    totalSize,
    trashCount,
    hiddenCount,
    refresh,
    loadMore,
    uploadFiles,
    remove,
    toggleNsfw,
    toggleHidden,
    restore,
    purge,
    applyNaturalSize,
  }
}

/** 按张数与总体积切分，保证单批不超过后端限制 */
function chunkFiles(files: File[]): File[][] {
  const chunks: File[][] = []
  let current: File[] = []
  let size = 0
  for (const file of files) {
    if (current.length >= UPLOAD_BATCH_SIZE || (current.length > 0 && size + file.size > UPLOAD_BATCH_BYTES)) {
      chunks.push(current)
      current = []
      size = 0
    }
    current.push(file)
    size += file.size
  }
  if (current.length) chunks.push(current)
  return chunks
}

/** 朝向判定：宽高差 2px 内视为方图（与后端 SQL 判定一致） */
function orientationOf(photo: Pick<GalleryPhoto, 'width' | 'height'>): PhotoOrientation {
  if (Math.abs(photo.width - photo.height) <= 2) return 'square'
  return photo.width > photo.height ? 'landscape' : 'portrait'
}
