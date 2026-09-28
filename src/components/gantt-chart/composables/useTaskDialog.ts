import { ref, reactive } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import type { GanttTask, TaskDialogForm } from '../types'

export interface UseTaskDialogOptions {
  getTaskById: (id: string) => GanttTask | undefined
  updateTaskInTree: (id: string, patch: Partial<GanttTask>) => void
  addTask: (task: GanttTask, parentId: string | null, insertAfterId?: string | null) => void
}

/**
 * 任务弹窗 composable
 * 管理新增/编辑任务弹窗的显示状态、表单数据、校验规则与提交逻辑
 */
export function useTaskDialog(options: UseTaskDialogOptions) {
  const { getTaskById, updateTaskInTree, addTask } = options

  // 弹窗显示状态
  const taskDialogVisible = ref(false)
  // 弹窗模式：add 新增 / edit 编辑
  const taskDialogMode = ref<'add' | 'edit' | null>(null)
  // 保存中状态
  const saving = ref(false)

  // 弹窗表单数据
  const dialogFormData = reactive<TaskDialogForm>({
    id: null,
    text: '',
    start: '',
    end: '',
    progress: 0,
    type: 'task',
    status: 'todo',
    owner: '',
    description: '',
    parentId: null,
    insertAfterId: null,
  })

  // 表单校验规则
  const dialogRules: FormRules = {
    text: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择任务状态', trigger: 'change' }],
    start: [
      {
        required: true,
        message: '请选择开始日期',
        trigger: 'change',
        validator: (rule, value, callback) => {
          // 汇总任务的时间由系统自动派生，不要求用户填写
          if (dialogFormData.type === 'project') return callback()
          if (!value) return callback(new Error('请选择开始日期'))
          callback()
        },
      },
    ],
    end: [
      {
        required: true,
        trigger: 'change',
        validator: (rule, value, callback) => {
          // 里程碑：结束时间=开始时间；汇总任务：自动派生；普通任务：必填且 >= start
          if (dialogFormData.type === 'milestone' || dialogFormData.type === 'project') return callback()
          if (!value) return callback(new Error('请选择结束日期'))
          if (dialogFormData.start && dayjs(value).isBefore(dayjs(dialogFormData.start))) {
            return callback(new Error('结束日期不能早于开始日期'))
          }
          callback()
        },
      },
    ],
    progress: [
      {
        required: true,
        message: '请设置完成进度',
        trigger: 'change',
        validator: (rule, value, callback) => {
          // 汇总任务自动计算 / 里程碑由状态决定，都不强制校验
          if (dialogFormData.type !== 'task') return callback()
          if (typeof value !== 'number' || isNaN(value)) {
            return callback(new Error('请设置完成进度'))
          }
          callback()
        },
      },
    ],
  }

  /**
   * 打开新增任务弹窗
   * @param refTaskId 参考任务 id（可选）
   * @param mode child=作为子任务新增 / after=在同级之后新增
   */
  function openAddDialog(refTaskId: string | null = null, mode: 'child' | 'after' = 'child') {
    taskDialogMode.value = 'add'
    dialogFormData.id = null
    dialogFormData.text = ''
    dialogFormData.start = ''
    dialogFormData.end = ''
    dialogFormData.progress = 0
    dialogFormData.type = 'task'
    dialogFormData.status = 'todo'
    dialogFormData.owner = ''
    dialogFormData.description = ''
    dialogFormData.parentId = null
    dialogFormData.insertAfterId = null

    if (refTaskId) {
      if (mode === 'child') {
        // 作为参考任务的子任务
        dialogFormData.parentId = refTaskId
      } else if (mode === 'after') {
        // 作为参考任务的同级兄弟，插入到其后
        const refTask = getTaskById(refTaskId)
        if (refTask) {
          dialogFormData.parentId = refTask.parentId ?? null
          dialogFormData.insertAfterId = refTaskId
        }
      }
    }
    taskDialogVisible.value = true
  }

  /** 打开编辑任务弹窗，回填当前任务数据 */
  function openEditDialog(row: GanttTask) {
    taskDialogMode.value = 'edit'
    dialogFormData.id = row.id
    dialogFormData.text = row.text
    dialogFormData.start = row.start
    dialogFormData.end = row.end
    dialogFormData.progress = row.progress || 0
    dialogFormData.type = row.type
    dialogFormData.status = row.status
    dialogFormData.owner = row.owner || ''
    dialogFormData.description = row.description || ''
    dialogFormData.parentId = row.parentId ?? null
    dialogFormData.insertAfterId = null
    taskDialogVisible.value = true
  }

  /**
   * 表单提交：编辑模式更新任务，新增模式创建任务
   * 特殊规则：
   *  - milestone：结束时间=开始时间，progress 由 status 映射（done→1，其他→0）
   *  - project：start/end/progress/status 是由子项派生的，不允许手动覆盖
   */
  function onTaskSubmit(form: TaskDialogForm) {
    const isEdit = taskDialogMode.value === 'edit'
    const type = form.type

    // 里程碑：end=start，progress 二态
    const milestoneProgress: number = form.status === 'done' ? 1 : 0

    if (isEdit && form.id) {
      const patch: Partial<GanttTask> = {
        text: form.text,
        owner: form.owner,
        description: form.description,
      }
      if (type === 'task') {
        patch.start = form.start
        patch.end = form.end
        patch.progress = form.progress
        patch.status = form.status
      } else if (type === 'milestone') {
        patch.start = form.start
        patch.end = form.start // 里程碑结束时间=开始时间
        patch.status = form.status
        patch.progress = milestoneProgress
      }
      // project：只提交 text/owner/description 等可写字段，派生字段不随本地更新
      // （后端 recalculateDerivedFields 会在持久化时重算，并在下次 loadData 时覆盖本地）
      if (type === 'project') {
        patch.status = form.status // 允许 cancel（用户主动取消）；其他状态后端会用派生值覆盖
      }
      updateTaskInTree(form.id, patch)
      ElMessage.success('任务已更新')
    } else {
      let start = form.start
      let end = form.type === 'milestone' ? form.start : form.end
      let progress = form.progress
      let status = form.status
      if (type === 'milestone') {
        progress = milestoneProgress
      }
      // project 新增时若无具体 start/end，后端派生后会在下次拉取替换；
      // 这里先用表单值占位以便 UI 正常渲染
      const newTask: GanttTask = {
        id: 't_' + Date.now(),
        text: form.text,
        start,
        end,
        progress,
        type,
        status,
        owner: form.owner,
        description: form.description,
        parentId: form.parentId,
      }
      addTask(newTask, form.parentId, form.insertAfterId)
      ElMessage.success('任务已添加')
    }
    taskDialogVisible.value = false
  }

  return {
    taskDialogVisible,
    taskDialogMode,
    saving,
    dialogFormData,
    dialogRules,
    openAddDialog,
    openEditDialog,
    onTaskSubmit,
  }
}
