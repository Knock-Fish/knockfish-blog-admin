import dayjs from 'dayjs'
import type { GalleryPhoto, PhotoOrientation } from '../types'

/** 宽高比，异常值兜底 4:3 */
export const ratioOf = (photo: Pick<GalleryPhoto, 'width' | 'height'>) =>
  photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 4 / 3

/** 朝向判定：宽高差 2px 内视为方图 */
export const orientationOf = (photo: Pick<GalleryPhoto, 'width' | 'height'>): PhotoOrientation => {
  if (Math.abs(photo.width - photo.height) <= 2) return 'square'
  return photo.width > photo.height ? 'landscape' : 'portrait'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export const formatDate = (mtime: number) => (mtime ? dayjs(mtime).format('YYYY-MM-DD HH:mm') : '-')

/** 文件名 → 展示标题：去掉扩展名、编号前缀与分隔符 */
export function titleOf(fileName: string): string {
  return (
    fileName
      .replace(/\.[^.]+$/, '')
      .replace(/^\d+[\s._-]+/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || fileName
  )
}
