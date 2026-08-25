import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { GanttTask, GanttLink, TaskStatus, TaskType } from '../components/gantt-chart/types'

/** 任务状态对应的主题色（todo 灰 / doing 蓝 / done 绿 / delay 红 / cancel 浅灰） */
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: '#909399',
  doing: '#409eff',
  done: '#67c23a',
  delay: '#f56c6c',
  cancel: '#c0c4cc',
}

export interface UseGanttDataOptions {
  /** 初始任务树（父子层级结构），缺省为空数组 */
  initialTasks?: GanttTask[]
  /** 初始依赖连线，缺省为空数组 */
  initialLinks?: GanttLink[]
}

/**
 * 甘特图任务数据管理 composable
 * 负责任务树、依赖连线的增删改查，以及展开状态的扁平化
 * 数据来源由调用方（父组件）通过 options 传入，不内置演示数据
 */
export function useGanttData(options: UseGanttDataOptions = {}) {
  const { initialTasks = [], initialLinks = [] } = options

  // 任务树（响应式，深拷贝避免直接修改外部传入对象）
  const ganttTasks = ref<GanttTask[]>(JSON.parse(JSON.stringify(initialTasks)))
  // 依赖连线列表（响应式，深拷贝避免直接修改外部传入对象）
  const ganttLinks = ref<GanttLink[]>(JSON.parse(JSON.stringify(initialLinks)))
  // 当前选中的任务 id
  const selectedId = ref<string | null>(null)

  /** 整体替换任务树（深拷贝写入，用于父组件 props 变化同步） */
  function setTasks(tasks: GanttTask[]) {
    ganttTasks.value = JSON.parse(JSON.stringify(tasks))
  }

  /** 整体替换依赖连线列表（深拷贝写入，用于父组件 props 变化同步） */
  function setLinks(links: GanttLink[]) {
    ganttLinks.value = JSON.parse(JSON.stringify(links))
  }

  /**
   * 扁平化任务列表：根据 open 状态递归展开子任务
   * 折叠的父任务只保留自身，不展开 children
   */
  const flatTasks = computed<GanttTask[]>(() => {
    const result: GanttTask[] = []
    function walk(list: GanttTask[]) {
      list.forEach(t => {
        result.push(t)
        if (t.open !== false && t.children?.length) walk(t.children)
      })
    }
    walk(ganttTasks.value)
    return result
  })

  /** 任务 id 到扁平化下标的映射，用于快速定位行位置 */
  const flatTaskIndexMap = computed(() => {
    const map = new Map<string, number>()
    flatTasks.value.forEach((t, i) => map.set(t.id, i))
    return map
  })

  /** 按 id 深度优先查找任务节点 */
  function getTaskById(id: string): GanttTask | undefined {
    function find(list: GanttTask[]): GanttTask | undefined {
      for (const t of list) {
        if (t.id === id) return t
        if (t.children) {
          const r = find(t.children)
          if (r) return r
        }
      }
      return undefined
    }
    return find(ganttTasks.value)
  }

  /** 获取从 root 到 target 的祖先链（不包含 target 本身） */
  function collectAncestors(targetId: string): GanttTask[] {
    const path: GanttTask[] = []
    function walk(list: GanttTask[], chain: GanttTask[]): boolean {
      for (const t of list) {
        if (t.id === targetId) {
          path.push(...chain)
          return true
        }
        if (t.children?.length) {
          const nextChain = [...chain, t]
          if (walk(t.children, nextChain)) return true
        }
      }
      return false
    }
    walk(ganttTasks.value, [])
    return path
  }

  /** 汇总单个 PROJECT 节点的派生字段（算法与后端一致） */
  function aggregateProject(project: GanttTask, children: GanttTask[]) {
    if (!children.length) {
      project.progress = 0
      if (project.status !== 'cancel') project.status = 'todo'
      return
    }
    let minStart: string | null = null
    let maxEnd: string | null = null
    let weightedSum = 0
    let totalDuration = 0
    let anyDelay = false
    let anyDoing = false
    let anyPartial = false
    let allDone = true

    for (const c of children) {
      if (c.start && (minStart == null || dayjs(c.start).isBefore(dayjs(minStart)))) minStart = c.start
      if (c.end && (maxEnd == null || dayjs(c.end).isAfter(dayjs(maxEnd)))) maxEnd = c.end
      const dur = durationMinutes(c.start, c.end)
      if (dur > 0) {
        weightedSum += (c.progress ?? 0) * dur
        totalDuration += dur
      }
      if (c.status === 'delay') anyDelay = true
      if (c.status === 'doing') anyDoing = true
      if (c.status !== 'done') allDone = false
      const p = c.progress ?? 0
      if (p > 1e-9 && p < 1 - 1e-9) anyPartial = true
    }

    const newProgress = totalDuration > 0 ? weightedSum / totalDuration : 0
    let newStatus: TaskStatus
    if (allDone) newStatus = 'done'
    else if (anyDelay) newStatus = 'delay'
    else if (anyDoing || anyPartial) newStatus = 'doing'
    else newStatus = 'todo'

    if (minStart) project.start = minStart
    if (maxEnd) project.end = maxEnd
    project.progress = newProgress
    if (project.status !== 'cancel') project.status = newStatus
  }

  function durationMinutes(s?: string, e?: string): number {
    if (!s || !e) return 0
    const ms = dayjs(e).diff(dayjs(s), 'minute')
    return Math.max(0, ms)
  }

  /**
   * 自底向上重算指定任务所有 PROJECT 祖先的派生字段。
   * 需先完成子级的 start/end/progress/status 更新，再调用此函数。
   */
  function recalculateProjectAncestors(targetId: string | null) {
    // 如果没有具体 id，则对整棵树所有 PROJECT 自底向上重算（删除节点等场景）
    if (!targetId) {
      recalculateAllProjects()
      return
    }
    const ancestors = collectAncestors(targetId)
    // 从最近一层祖先（父）→ 最远的根向上逐层聚合
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const node = ancestors[i]
      if (!node) continue
      if (node.type === 'project' && node.children?.length) {
        aggregateProject(node, node.children)
      }
    }
  }

  /** 对全树所有 PROJECT 节点自底向上重算派生字段 */
  function recalculateAllProjects() {
    const allProjects: GanttTask[] = []
    function walk(list: GanttTask[]) {
      for (const t of list) {
        if (t.type === 'project') allProjects.push(t)
        if (t.children?.length) walk(t.children)
      }
    }
    walk(ganttTasks.value)
    // 按在树中的深度从大到小排序（叶子 PROJECT 先算）
    const depthCache = new Map<string, number>()
    function depthOf(t: GanttTask): number {
      if (depthCache.has(t.id)) return depthCache.get(t.id)!
      let d = 0
      let cur = t
      while (true) {
        const parent = findParent(cur.id)
        if (!parent || parent.type !== 'project') break
        cur = parent
        d++
      }
      depthCache.set(t.id, d)
      return d
    }
    allProjects.sort((a, b) => depthOf(b) - depthOf(a))
    for (const p of allProjects) {
      if (p.children?.length) aggregateProject(p, p.children)
    }
  }

  /** 查找任务的父节点（顶层返回 null） */
  function findParent(id: string): GanttTask | null {
    let found: GanttTask | null = null
    function walk(list: GanttTask[], parent: GanttTask | null): boolean {
      for (const t of list) {
        if (t.id === id) { found = parent; return true }
        if (t.children?.length && walk(t.children, t)) return true
      }
      return false
    }
    walk(ganttTasks.value, null)
    return found
  }

  /** 按 id 定位任务并合并 patch 字段（就地修改，保持树结构引用），随后重算 PROJECT 祖先 */
  function updateTaskInTree(id: string, patch: Partial<GanttTask>) {
    function apply(list: GanttTask[]): boolean {
      for (const t of list) {
        if (t.id === id) {
          Object.assign(t, patch)
          return true
        }
        if (t.children && apply(t.children)) return true
      }
      return false
    }
    const ok = apply(ganttTasks.value)
    if (!ok) return
    // 仅当 patch 中存在影响派生值的字段时才触发重算（展开/折叠 open 不必）
    const triggers = ['start', 'end', 'progress', 'status', 'type', 'parentId']
    if (triggers.some(k => Object.prototype.hasOwnProperty.call(patch, k))) {
      recalculateProjectAncestors(id)
    }
  }

  /** 表格展开/折叠行变更回调，同步更新任务树上的 open 字段 */
  function handleExpandChange(row: GanttTask, _expanded: GanttTask[]) {
    updateTaskInTree(row.id, { open: _expanded.includes(row) })
  }

  /**
   * 新增任务到任务树
   * @param task 新任务对象
   * @param parentId 父任务 id，为 null 则插入到顶层
   * @param insertAfterId 插入到该兄弟任务之后，为 null 则追加到末尾
   */
  function addTask(task: GanttTask, parentId: string | null, insertAfterId: string | null = null) {
    if (parentId) {
      const parent = getTaskById(parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        if (insertAfterId) {
          const idx = parent.children.findIndex(c => c.id === insertAfterId)
          if (idx !== -1) {
            parent.children.splice(idx + 1, 0, task)
          } else {
            parent.children.push(task)
          }
        } else {
          parent.children.push(task)
        }
        parent.open = true
      }
    } else {
      ganttTasks.value.push(task)
    }
    // 新增任务会影响父 PROJECT 的派生值：父链全部重算
    recalculateProjectAncestors(task.id)
  }

  /**
   * 新增依赖连线（去重，相同 source→target 已存在则提示）
   * @param sourceId 起点任务 id
   * @param targetId 终点任务 id
   * @param _sourceSide 连线起点侧（start/end），当前未使用
   */
  function addLink(sourceId: string, targetId: string, _sourceSide: 'start' | 'end') {
    const exists = ganttLinks.value.some(
      l => l.source === sourceId && l.target === targetId,
    )
    if (exists) {
      ElMessage.warning('该依赖关系已存在')
      return
    }
    ganttLinks.value.push({
      id: 'L' + Date.now(),
      source: sourceId,
      target: targetId,
      type: 0,
    })
    ElMessage.success('依赖关系已建立')
  }

  /** 按 id 删除依赖连线 */
  function removeLink(id: string) {
    const idx = ganttLinks.value.findIndex(l => l.id === id)
    if (idx >= 0) {
      ganttLinks.value.splice(idx, 1)
    }
  }

  /**
   * 删除任务：同时清理关联的依赖连线，并递归移除子任务
   * 返回新树（不可变更新，触发响应式刷新）
   */
  function deleteTaskById(id: string) {
    ganttLinks.value = ganttLinks.value.filter(l => l.source !== id && l.target !== id)
    // 先定位被删节点的父，以便删除后针对该父（及其祖先）定向重算
    const parent = findParent(id)
    function removeFromTree(list: GanttTask[]): GanttTask[] {
      return list
        .filter(t => t.id !== id)
        .map(t => ({
          ...t,
          children: t.children ? removeFromTree(t.children) : undefined,
        }))
    }
    ganttTasks.value = removeFromTree(ganttTasks.value)
    // 重算 PROJECT 派生值：有父则从父开始沿链向上；否则全树重算
    if (parent) recalculateProjectAncestors(parent.id)
    else recalculateAllProjects()
  }

  /** 根据任务状态获取对应的主题色 */
  function getStatusColor(status: TaskStatus): string {
    return STATUS_COLOR[status]
  }

  return {
    // state
    ganttTasks,
    ganttLinks,
    selectedId,
    flatTasks,
    flatTaskIndexMap,
    // sync setters（父组件 watch props 变化时调用）
    setTasks,
    setLinks,
    // functions
    getTaskById,
    updateTaskInTree,
    handleExpandChange,
    addTask,
    addLink,
    removeLink,
    deleteTaskById,
    getStatusColor,
  }
}

export { STATUS_COLOR }
