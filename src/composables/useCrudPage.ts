import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type ButtonProps } from 'element-plus'

/**
 * 通用 CRUD 页面逻辑组合式函数
 * 搜索表单 + 分页列表 + 增删改 + 清空表单
 */

/** CRUD API 方法 */
export interface CrudApi<T> {
  getList: (params: Record<string, any>) => Promise<Api.Common.PaginatingParams<T>>
  add: (data: T) => Promise<any>
  update: (data: T) => Promise<any>
  del: (id: number) => Promise<any>
}

export interface UseCrudPageOptions<T extends Record<string, any>> {
  /** 列表 / 新增 / 编辑 / 删除 四个 API 方法 */
  api: CrudApi<T>
  /** 主键字段名，用于删除与编辑回填 */
  idKey: keyof T & string
  /** 编辑时回填到表单的字段；默认复制整行（建议显式声明，避免带入 createTime 等冗余字段） */
  editFields?: (row: T) => Partial<T>
  /** 提交前把表单数据转换成请求体；默认原样展开 */
  buildPayload?: (formData: T, mode: 'add' | 'update') => any
  /** 表单初始值 */
  initialFormData?: Partial<T>
  /** 搜索条件初始值 */
  initialQuery?: Partial<T>
  /** 每页条数，默认 10 */
  pageSize?: number
  /** 提交前是否校验表单（需在模板把 ref="formRef" 绑到 DynamicForm），默认 true */
  validateOnSubmit?: boolean
  /** 文案与提示配置（可覆盖默认值） */
  messages?: Partial<{
    delConfirm: string
    delConfirmButton: string
    delCancelButton: string
    invalidId: string
    addSuccess: string
    updateSuccess: string
    delSuccess: string
    cancelled: string
  }>
}

export function useCrudPage<T extends Record<string, any>>(options: UseCrudPageOptions<T>) {
  const {
    api,
    idKey,
    editFields,
    buildPayload,
    initialFormData = {},
    initialQuery = {},
    pageSize = 10,
    validateOnSubmit = true,
    messages: msg = {},
  } = options

  // 状态（与页面模板双向绑定）
  const query = reactive({ ...initialQuery }) as T
  const formData = reactive({ ...initialFormData }) as T
  const page = reactive({ total: 0, pageNum: 1, pageSize })
  const tableData = ref<T[]>([])
  const loading = ref(false)
  // 新增 / 编辑两个弹窗各自持有独立的 DynamicForm 实例
  // 页面里「新增」按钮（header 插槽）与「编辑」按钮（每行 option 插槽）各包了一个
  // DynamicForm，且都绑定同一份 formData。必须用「当前激活弹窗」区分，否则校验 / 重置会作用到错误的表单实例上
  const formRefs = { add: ref<any>(null), edit: ref<any>(null) }
  const activeMode = ref<'add' | 'edit'>('add')
  function setFormRef(mode: 'add' | 'edit', el: any) {
    formRefs[mode].value = el
  }
  function currentForm(): any {
    return formRefs[activeMode.value].value
  }

  // 编辑 / 删除按钮的统一样式
  const editButtonProps: ButtonProps = { type: 'primary', plain: true }
  const delButtonProps: ButtonProps = { type: 'danger', plain: true }

  // 列表（带分页 + loading）
  async function getList() {
    loading.value = true
    try {
      const data = await api.getList({
        ...query,
        pageNum: page.pageNum,
        pageSize: page.pageSize,
      })
      tableData.value = data.list
      page.total = data.total
    } finally {
      loading.value = false
    }
  }

  // 编辑前回填表单
  function populateForm(row: T) {
    // 先清空，再回填指定字段，避免上一次编辑的残留字段被误提交
    Object.keys(formData).forEach((key) => delete (formData as any)[key])
    const fields = editFields ? editFields(row) : { ...row }
    Object.assign(formData, fields)
  }

  // 清空表单（恢复初始值 + 重置校验）
  function clearForm() {
    Object.keys(formData).forEach((key) => delete (formData as any)[key])
    Object.assign(formData, initialFormData)
    currentForm()?.resetForm?.()
  }

  //  表单校验
  async function validate(): Promise<boolean> {
    const form = currentForm()
    if (!validateOnSubmit || !form?.validate) return true
    try {
      await form.validate()
      return true
    } catch {
      return false
    }
  }

  // 打开弹窗（切换激活态 + 准备表单数据）
  // 始终以干净的表单打开，避免沿用上一次编辑的残留数据
  function openAdd() {
    activeMode.value = 'add'
    clearForm()
  }
  // 编辑：回填行数据到表单
  function openEdit(row: T) {
    activeMode.value = 'edit'
    populateForm(row)
  }

  // 新增
  async function handleAdd() {
    if (!(await validate())) return
    const payload = buildPayload ? buildPayload(formData, 'add') : { ...formData }
    await api.add(payload)
    ElMessage.success(msg.addSuccess ?? '提交成功')
    clearForm()
    await getList()
  }

  // 编辑
  async function handleUpdate() {
    if (!(await validate())) return
    const payload = buildPayload ? buildPayload(formData, 'update') : { ...formData }
    await api.update(payload)
    ElMessage.success(msg.updateSuccess ?? '编辑成功')
    clearForm()
    await getList()
  }

  // 删除（带确认弹窗）
  async function handleDel(row: T) {
    const id = (row as any)[idKey]
    if (id === undefined || id === null || id === '') {
      ElMessage.warning(msg.invalidId ?? '无效的ID')
      return
    }
    try {
      await ElMessageBox.confirm(
        msg.delConfirm ?? '确定要删除该条数据吗？删除后无法恢复！',
        '警告',
        {
          confirmButtonText: msg.delConfirmButton ?? '确定删除',
          cancelButtonText: msg.delCancelButton ?? '取消',
          type: 'warning',
          appendTo: document.body,
        }
      )
      await api.del(id as number)
      ElMessage.success(msg.delSuccess ?? '删除成功')
      await getList()
    } catch {
      ElMessage.info(msg.cancelled ?? '已取消')
    }
  }

  // 搜索 / 重置
  function handleSearch() {
    getList()
  }
  function handleReset() {
    getList()
  }

  return {
    query,
    formData,
    page,
    tableData,
    loading,
    editButtonProps,
    delButtonProps,
    getList,
    populateForm,
    clearForm,
    handleAdd,
    handleUpdate,
    handleDel,
    handleSearch,
    handleReset,
    setFormRef,
    openAdd,
    openEdit,
  }
}
