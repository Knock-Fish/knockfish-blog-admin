import { reactive, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { GanttTask } from '../components/gantt-chart/types'

/** 右键菜单命令类型 */
export type ContextMenuCommand = 'add-child' | 'add-after' | 'edit' | 'indent' | 'outdent' | 'delete'

export interface UseContextMenuOptions {
  getTaskById: (id: string) => GanttTask | undefined
  onAdd: (refTaskId: string | null, mode: 'child' | 'after') => void
  onEdit: (task: GanttTask) => void
  onDeleteById: (taskId: string) => void
}

/**
 * 右键菜单 composable
 * 管理菜单的显示位置、关联任务，以及菜单项命令的分发
 */
export function useContextMenu(options: UseContextMenuOptions) {
  const { getTaskById, onAdd, onEdit, onDeleteById } = options

  // 右键菜单状态
  const contextMenu = reactive({
    visible: false,                   // 是否显示
    x: 0,                             // 菜单 left（基于 clientX）
    y: 0,                             // 菜单 top（基于 clientY）
    taskId: null as string | null,    // 关联的任务 id
  })

  /** 打开右键菜单，记录鼠标位置与关联任务 */
  function openContextMenu(e: MouseEvent, row: GanttTask) {
    contextMenu.visible = true
    contextMenu.x = e.clientX
    contextMenu.y = e.clientY
    contextMenu.taskId = row.id
  }

  /**
   * 调整任务层级（升级/降级）
   * 当前为占位实现，需配合完整树操作
   */
  function changeLevel(taskId: string, _delta: 1 | -1) {
    ElMessage.info('升降级功能需配合完整树操作实现')
  }

  /**
   * 菜单项点击命令分发
   * @param command 菜单命令
   */
  function onContextClick(command: ContextMenuCommand) {
    const taskId = contextMenu.taskId
    const task = taskId ? getTaskById(taskId) : null
    switch (command) {
      case 'add-child':
        onAdd(taskId, 'child')
        break
      case 'add-after':
        onAdd(taskId, 'after')
        break
      case 'edit':
        if (task) onEdit(task)
        break
      case 'indent':
        if (taskId) changeLevel(taskId, 1)
        break
      case 'outdent':
        if (taskId) changeLevel(taskId, -1)
        break
      case 'delete':
        if (taskId) onDeleteById(taskId)
        break
    }
  }

  return {
    contextMenu,
    openContextMenu,
    onContextClick,
  }
}
