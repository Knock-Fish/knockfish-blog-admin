import dayjs from 'dayjs'
import type { GalleryPhoto } from '../types'

/**
 * 图库模拟数据。
 * 图片为 public/gallery 下的本地占位图，保证离线可预览；
 * 后续接入后端时只需替换 useGalleryPhotos 中的取数逻辑，本文件可整体删除。
 */
const RAW = [
  { id: 'g01', title: '晨雾山谷', w: 1600, h: 1067, kb: 1840 },
  { id: 'g02', title: '海岸线的风', w: 1200, h: 1600, kb: 1620 },
  { id: 'g03', title: '午后窗台', w: 1400, h: 1400, kb: 1380 },
  { id: 'g04', title: '橙色黄昏', w: 1800, h: 1013, kb: 2140 },
  { id: 'g05', title: '林间小径', w: 1200, h: 1800, kb: 1980 },
  { id: 'g06', title: '紫色旷野', w: 1500, h: 1000, kb: 1720 },
  { id: 'g07', title: '潮汐退去', w: 1600, h: 1200, kb: 1905 },
  { id: 'g08', title: '薄雪清晨', w: 1000, h: 1500, kb: 1240 },
  { id: 'g09', title: '旧城巷口', w: 1400, h: 1050, kb: 1530 },
  { id: 'g10', title: '湖心倒影', w: 1800, h: 1200, kb: 2260 },
  { id: 'g11', title: '油菜花田', w: 1200, h: 1600, kb: 1750 },
  { id: 'g12', title: '云层之上', w: 1600, h: 900, kb: 1660 },
  { id: 'g13', title: '玻璃与光', w: 1200, h: 1200, kb: 1180 },
  { id: 'g14', title: '沙丘曲线', w: 1700, h: 1133, kb: 2010 },
  { id: 'g15', title: '春樱落雨', w: 1100, h: 1650, kb: 1420 },
  { id: 'g16', title: '夜市灯河', w: 1600, h: 1067, kb: 2310 },
  { id: 'g17', title: '静默森林', w: 1200, h: 1800, kb: 2050 },
  { id: 'g18', title: '海雾灯塔', w: 1500, h: 1000, kb: 1480 },
  { id: 'g19', title: '野餐午后', w: 1300, h: 1300, kb: 1355 },
  { id: 'g20', title: '山脊剪影', w: 1800, h: 1013, kb: 2090 },
  { id: 'g21', title: '青苔石阶', w: 1050, h: 1575, kb: 1310 },
  { id: 'g22', title: '雨后街道', w: 1600, h: 1200, kb: 1875 },
  { id: 'g23', title: '麦田尽头', w: 1600, h: 900, kb: 1590 },
  { id: 'g24', title: '夜航星轨', w: 1200, h: 1600, kb: 2180 },
]

/** 按 id 生成稳定的“上传时间”：越靠后越早，跨度约 40 天 */
const mtimeOf = (index: number) =>
  dayjs()
    .subtract(Math.floor(index * 1.7), 'day')
    .subtract(index * 37, 'minute')
    .valueOf()

export const mockPhotos: GalleryPhoto[] = RAW.map((item, index) => ({
  id: item.id,
  name: `${item.id}.svg`,
  title: item.title,
  src: `/gallery/${item.id}.svg`,
  width: item.w,
  height: item.h,
  size: item.kb * 1024,
  mtime: mtimeOf(index),
}))
