export type TaskType = 'task' | 'milestone' | 'project'
export type TaskStatus = 'todo' | 'doing' | 'done' | 'delay' | 'cancel'
export type ScaleType = 'hour' | 'day' | 'week' | 'month'

export interface GanttTask {
  id: string
  text: string
  start: string
  end: string
  progress: number
  type: TaskType
  status: TaskStatus
  owner?: string
  description?: string
  parentId?: string | null
  open?: boolean
  children?: GanttTask[]
}

export interface GanttLink {
  id: string
  source: string
  target: string
  type: number
}

export interface TopHeaderGroup {
  key: string
  label: string
  left: number
  width: number
}

export interface SubHeaderCell {
  key: string
  label: string
  width: number
  isWeekend: boolean
}

export type DragMode = 'move' | 'resize-left' | 'resize-right' | 'progress'

export interface TaskDialogForm {
  id: string | null
  text: string
  start: string
  end: string
  progress: number
  type: TaskType
  status: TaskStatus
  owner: string
  description: string
  parentId: string | null
  insertAfterId: string | null
}

export interface RenderedLink {
  id: string
  path: string
}
