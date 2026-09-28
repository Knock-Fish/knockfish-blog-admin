import { ref, reactive, computed, nextTick, type Ref } from 'vue'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { ScaleType, GanttTask, TopHeaderGroup, SubHeaderCell } from '../types'

try { dayjs.extend(isoWeek) } catch {}

/**
 * 各刻度的基础配置：时间单位、步长、默认列宽
 * - hour: 每 2 小时一格，默认 48px
 * - day: 每天一格，默认 40px
 * - week: 每 7 天一格，默认 60px
 * - month: 每月一格，默认 80px
 */
const SCALE_BASE: Record<ScaleType, { unit: dayjs.ManipulateType; step: number; defaultWidth: number }> = {
  hour: { unit: 'hour', step: 2, defaultWidth: 48 },
  day: { unit: 'day', step: 1, defaultWidth: 40 },
  week: { unit: 'day', step: 7, defaultWidth: 60 },
  month: { unit: 'month', step: 1, defaultWidth: 80 },
}

export interface UseTimelineOptions {
  flatTasks: Ref<GanttTask[]>
  rowHeight: Ref<number>
  ganttTasks: Ref<GanttTask[]>
  onFitViewPost?: () => void
}

/**
 * 时间轴 composable
 * 管理时间范围、刻度配置、列宽、表头分组、今日线位置等
 */
export function useTimeline(options: UseTimelineOptions) {
  const { flatTasks, rowHeight, ganttTasks, onFitViewPost } = options

  // 当前刻度类型
  const currentScale = ref<ScaleType>('day')
  // 时间轴起始时间（默认当前往前 3 天）
  const timelineStart = ref(dayjs().subtract(3, 'day'))
  // 时间轴结束时间（默认当前往后 35 天）
  const timelineEnd = ref(dayjs().add(35, 'day'))
  // 甘特图滚动容器 DOM 引用
  const ganttWrapRef = ref<HTMLDivElement>()
  // 任务区最小高度（用于无数据时也能显示行背景/周末背景柱，初始化为容器可视高度）
  const bodyMinHeight = ref(600)

  // 各刻度下的列宽（可被缩放调整）
  const columnWidths = reactive<Record<ScaleType, number>>({
    hour: SCALE_BASE.hour.defaultWidth,
    day: SCALE_BASE.day.defaultWidth,
    week: SCALE_BASE.week.defaultWidth,
    month: SCALE_BASE.month.defaultWidth,
  })

  // 当前刻度的聚合配置（unit + step + columnWidth）
  const scaleCfg = computed(() => ({
    unit: SCALE_BASE[currentScale.value].unit,
    step: SCALE_BASE[currentScale.value].step,
    columnWidth: columnWidths[currentScale.value],
  }))

  /** 计算时间轴总列数（从 start 到 end 按当前步长累加） */
  function diffColumns() {
    const cfg = scaleCfg.value
    let count = 0
    let cursor = timelineStart.value.clone()
    while (cursor.isBefore(timelineEnd.value) || cursor.isSame(timelineEnd.value)) {
      count++
      cursor = cursor.add(cfg.step, cfg.unit)
    }
    return Math.max(count, 1)
  }

  // 时间轴总列数
  const columnCount = computed(() => diffColumns())
  // 时间轴总宽度 = 列数 × 列宽
  const timelineWidth = computed(() => columnCount.value * scaleCfg.value.columnWidth)
  // 任务区总高度 = max(行数 × 行高, 最小高度)，确保无数据时也有可视高度
  const bodyHeight = computed(() =>
    Math.max(flatTasks.value.length * rowHeight.value, bodyMinHeight.value),
  )

  /**
   * 生成时间轴单元格数据
   * 包含：底部细分单元格（cells）、周末背景柱（weekends）、顶部分组表头（groups）
   */
  const timelineCells = computed(() => {
    const cfg = scaleCfg.value
    const cells: SubHeaderCell[] = []
    const weekends: { key: string; left: number; width: number }[] = []
    const groupMap = new Map<string, { key: string; label: string; leftPx: number; rightPx: number }>()
    let cursor = timelineStart.value.clone()
    let left = 0
    let i = 0

    /** 根据刻度类型生成分组键与标签（小时按天、日/周按月、月按年） */
    function groupKey(d: dayjs.Dayjs): { key: string; label: string } {
      if (currentScale.value === 'hour') {
        return { key: d.format('YYYY-MM-DD'), label: d.format('YYYY-MM-DD ddd') }
      } else if (currentScale.value === 'day' || currentScale.value === 'week') {
        return { key: d.format('YYYY-MM'), label: d.format('YYYY年MM月') }
      } else {
        return { key: d.format('YYYY'), label: d.format('YYYY年') }
      }
    }

    while (cursor.isBefore(timelineEnd.value) || cursor.isSame(timelineEnd.value)) {
      let label = ''
      let isWeekend = false
      if (currentScale.value === 'hour') {
        label = cursor.format('HH:mm')
      } else if (currentScale.value === 'day') {
        label = cursor.format('DD')
        isWeekend = cursor.day() === 0 || cursor.day() === 6
      } else if (currentScale.value === 'week') {
        label = `W${dayjs(cursor.toDate()).isoWeek()}`
      } else {
        label = cursor.format('MM月')
      }
      cells.push({
        key: cursor.format('YYYY-MM-DD HH:mm') + '_' + i,
        label,
        width: cfg.columnWidth,
        isWeekend,
      })
      if (isWeekend) {
        weekends.push({ key: 'wk_' + i, left, width: cfg.columnWidth })
      }

      const { key, label: gLabel } = groupKey(cursor)
      const existing = groupMap.get(key)
      if (!existing) {
        groupMap.set(key, { key, label: gLabel, leftPx: left, rightPx: left + cfg.columnWidth })
      } else {
        existing.rightPx = left + cfg.columnWidth
      }

      left += cfg.columnWidth
      cursor = cursor.add(cfg.step, cfg.unit)
      i++
    }

    const groups: TopHeaderGroup[] = []
    groupMap.forEach(g => {
      groups.push({
        key: g.key,
        label: g.label,
        left: g.leftPx,
        width: Math.max(g.rightPx - g.leftPx, cfg.columnWidth),
      })
    })

    return { cells, weekends, groups }
  })

  // 顶部表头分组（月/年长单元格）
  const topHeaderGroups = computed<TopHeaderGroup[]>(() => timelineCells.value.groups)
  // 底部表头细分单元格（天/周/小时）
  const subHeaderCells = computed<SubHeaderCell[]>(() => timelineCells.value.cells)
  // 周末背景柱列表
  const weekendColumns = computed(() => timelineCells.value.weekends)

  /** 今日竖线的 left 像素位置（基于当前时间与起始时间的差值） */
  const todayLineLeft = computed(() => {
    const cfg = scaleCfg.value
    const diff = dayjs().diff(timelineStart.value, cfg.unit, true)
    return Math.max(0, diff * cfg.columnWidth / cfg.step)
  })

  /** 将日期转换为时间轴上的 x 像素坐标 */
  function getX(date: string | dayjs.Dayjs) {
    const cfg = scaleCfg.value
    const d = dayjs(date)
    const diff = d.diff(timelineStart.value, cfg.unit, true)
    return Math.max(0, diff * cfg.columnWidth / cfg.step)
  }

  /** 切换刻度类型 */
  function setScale(scale: ScaleType) {
    currentScale.value = scale
  }

  /** 根据容器高度自适应行高（20px ~ 36px 之间），并同步更新 bodyMinHeight */
  function fitRowHeight() {
    const wrap = ganttWrapRef.value
    if (!wrap) return
    const availH = Math.max(200, wrap.clientHeight - 48)
    // 同步最小高度：保证无数据时也能填满可视区
    bodyMinHeight.value = availH
    if (!flatTasks.value.length) return
    const rowCount = Math.max(1, flatTasks.value.length)
    const optimalRowH = Math.max(20, Math.min(36, Math.floor(availH / rowCount)))
    rowHeight.value = optimalRowH
  }

  /**
   * 自适应视图：根据所有任务的时间范围调整时间轴起止
   * 并在 nextTick 中计算合适的列宽与行高
   * 无任务数据时仍会以当前时间为中心调整时间轴，确保周末背景柱等可见
   */
  function fitView() {
    const times: dayjs.Dayjs[] = []
    function scan(list: GanttTask[]) {
      list.forEach(t => {
        times.push(dayjs(t.start))
        times.push(dayjs(t.end || t.start))
      })
    }
    scan(ganttTasks.value)

    const BUFFER_DAYS = 30

    if (times.length) {
      const min = times.reduce((a, b) => (a.isBefore(b) ? a : b))
      const max = times.reduce((a, b) => (a.isAfter(b) ? a : b))
      timelineStart.value = min.subtract(BUFFER_DAYS, 'day')
      timelineEnd.value = max.add(BUFFER_DAYS, 'day')
    } else {
      timelineStart.value = dayjs().subtract(BUFFER_DAYS, 'day')
      timelineEnd.value = dayjs().add(BUFFER_DAYS, 'day')
    }

    nextTick(() => {
      const wrap = ganttWrapRef.value
      if (!wrap) return
      const containerWidth = wrap.clientWidth
      const count = diffColumns()
      const totalWidthNeeded = count * SCALE_BASE[currentScale.value].defaultWidth
      let optimalWidth
      if (totalWidthNeeded < containerWidth) {
        optimalWidth = Math.max(30, Math.floor((containerWidth - 1) / count))
      } else {
        optimalWidth = Math.max(20, Math.min(200, Math.floor((containerWidth - 1) / count)))
      }
      columnWidths[currentScale.value] = optimalWidth
      fitRowHeight()
      if (onFitViewPost) onFitViewPost()
    })
  }

  return {
    // refs
    currentScale,
    timelineStart,
    timelineEnd,
    ganttWrapRef,
    columnWidths,
    // reactive
    scaleCfg,
    // computed
    columnCount,
    timelineWidth,
    bodyHeight,
    topHeaderGroups,
    subHeaderCells,
    weekendColumns,
    todayLineLeft,
    // functions
    diffColumns,
    getX,
    setScale,
    fitView,
    fitRowHeight,
    // constants
    SCALE_BASE,
  }
}
