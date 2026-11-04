/** 图片朝向 */
export type PhotoOrientation = 'landscape' | 'portrait' | 'square'

/** 图库筛选项：全部 / 横图 / 竖图 / 方图 */
export type OrientationFilter = 'all' | PhotoOrientation

/** 图库中的一张图片（由后端 GalleryPhotoVO 映射而来） */
export interface GalleryPhoto {
  /** 唯一标识：后端 photoId 转字符串 */
  id: string
  /** 文件名（含扩展名） */
  name: string
  /** 展示标题 */
  title: string
  /** 列表用地址：缩略图（宽 640 WebP） */
  src: string
  /** 大图用地址：预览图（长边 1600），小图时等于缩略图 */
  preview?: string
  /** 原图地址，下载/复制用 */
  original?: string
  width: number
  height: number
  /** 原图字节数 */
  size: number
  /** 敏感标记：前台列表缩略图打码，点开正常 */
  nsfw?: boolean
  /** 上传时间戳 */
  mtime: number
  /** 是否本地临时预览（真实接口接入后不再使用） */
  local?: boolean
}
