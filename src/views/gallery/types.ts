/** 图片朝向 */
export type PhotoOrientation = 'landscape' | 'portrait' | 'square'

/** 图库筛选项：全部 / 横图 / 竖图 / 方图 */
export type OrientationFilter = 'all' | PhotoOrientation

/** 图库中的一张图片 */
export interface GalleryPhoto {
  /** 唯一标识（后续由后端文件 key 提供） */
  id: string
  /** 文件名（含扩展名） */
  name: string
  /** 展示标题 */
  title: string
  /** 图片地址 */
  src: string
  width: number
  height: number
  /** 字节数 */
  size: number
  /** 上传（修改）时间戳 */
  mtime: number
  /** 是否由本地临时选择上传（模拟上传，未落库） */
  local?: boolean
}
