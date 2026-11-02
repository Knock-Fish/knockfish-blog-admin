import { computed, onBeforeUnmount, ref } from 'vue'
import { mockPhotos } from '../mock/photos'
import type { GalleryPhoto, OrientationFilter, PhotoOrientation } from '../types'
import { orientationOf, titleOf } from '../utils/photo'

export interface UploadResult {
  success: number
  failed: string[]
}

const FALLBACK_WIDTH = 1200
const FALLBACK_HEIGHT = 900

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

/** 读取本地图片尺寸，失败时回退 4:3 */
function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve({ width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT })
    image.src = src
  })
}

/**
 * 图库数据源（当前为模拟数据）。
 * 接入后端时只需要替换 refresh / uploadFiles / remove 的实现，
 * 页面与子组件依赖的返回值保持不变。
 */
export function useGalleryPhotos() {
  const items = ref<GalleryPhoto[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  const filter = ref<OrientationFilter>('all')

  /** 本地预览图地址，卸载时统一释放 */
  const objectUrls = new Set<string>()
  let localSeed = 0

  async function refresh() {
    loading.value = true
    try {
      // 模拟网络延迟，便于观察加载态
      await delay(220)
      items.value = [...mockPhotos].sort((a, b) => b.mtime - a.mtime)
    } finally {
      loading.value = false
    }
  }

  const filtered = computed(() =>
    filter.value === 'all' ? items.value : items.value.filter((photo) => orientationOf(photo) === filter.value),
  )

  const counts = computed<Record<OrientationFilter, number>>(() => {
    const result: Record<OrientationFilter, number> = { all: items.value.length, landscape: 0, portrait: 0, square: 0 }
    for (const photo of items.value) {
      const orientation: PhotoOrientation = orientationOf(photo)
      result[orientation] += 1
    }
    return result
  })

  const totalSize = computed(() => items.value.reduce((sum, photo) => sum + photo.size, 0))

  /** 模拟上传：仅生成本地预览，不落库 */
  async function uploadFiles(files: File[]): Promise<UploadResult> {
    if (!files.length) return { success: 0, failed: [] }

    uploading.value = true
    try {
      const failed: string[] = []
      const created: GalleryPhoto[] = []

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          failed.push(file.name)
          continue
        }
        const src = URL.createObjectURL(file)
        objectUrls.add(src)
        const { width, height } = await readImageSize(src)
        localSeed += 1
        created.push({
          id: `local-${Date.now()}-${localSeed}`,
          name: file.name,
          title: titleOf(file.name),
          src,
          width,
          height,
          size: file.size,
          mtime: Date.now(),
          local: true,
        })
      }

      if (created.length) items.value = [...created, ...items.value]
      await delay(400)
      return { success: created.length, failed }
    } finally {
      uploading.value = false
    }
  }

  function remove(id: string) {
    const target = items.value.find((photo) => photo.id === id)
    if (!target) return
    if (target.local && objectUrls.has(target.src)) {
      URL.revokeObjectURL(target.src)
      objectUrls.delete(target.src)
    }
    items.value = items.value.filter((photo) => photo.id !== id)
  }

  /** 真实尺寸与清单不一致时（如占位图被替换）用它校准布局 */
  function applyNaturalSize(id: string, width: number, height: number) {
    const photo = items.value.find((item) => item.id === id)
    if (!photo || !width || !height) return
    if (photo.width === width && photo.height === height) return
    photo.width = width
    photo.height = height
  }

  onBeforeUnmount(() => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.clear()
  })

  return {
    items,
    loading,
    uploading,
    filter,
    filtered,
    counts,
    totalSize,
    refresh,
    uploadFiles,
    remove,
    applyNaturalSize,
  }
}
