<template>
    <div class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" :loading="loading" slot-header="header"
            @current-page="getList" @page-size="getList">
            <template #header>
                <DialogButton :permission="RolePerm.ADD" @click="openAdd"
                    @submit="handleAdd" @closed="clearForm">
                    新增角色
                    <template #content>
                        <DynamicForm :ref="(el) => setFormRef('add', el)" v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <ElDropdown placement="bottom">
                    <ElButton style="padding: 10px; border: none;" plain type="info">
                        <SvgIcon icon="mdi:more-vert" />
                    </ElButton>
                    <template #dropdown>
                        <div style="display: flex; flex-direction: column;">
                            <DialogButton :permission="RolePerm.EDIT"
                                :button-props="permissionButtonProps"
                                @open="handleOpenPermission(row)"
                                @closed="clearPermissionIds" @submit="handleSubmit">
                                权限分配
                                <template #content>
                                    <ElScrollbar height="300px">
                                        <ElTree :data="treeData" node-key="permissionId"
                                            :props="treeProps" show-checkbox
                                            :check-strictly="true"
                                            ref="permissionTreeRef"
                                            @check="handleTreeCheck">
                                            <template #default="{ node, data }">
                                                <div class="custom-tree-node">
                                                    <span class="node-name">{{
                                                        data.permissionName
                                                        }}</span>
                                                    <span class="node-code">{{
                                                        data.permissionCode
                                                        }}</span>
                                                </div>
                                            </template>
                                        </ElTree>
                                    </ElScrollbar>
                                </template>
                            </DialogButton>
                            <DialogButton :permission="RolePerm.EDIT"
                                :button-props="editButtonProps"
                                :dialog-props="{ destroyOnClose: true }"
                                @click="openEdit(row)" @submit="handleUpdate"
                                @closed="clearForm">
                                编辑
                                <template #content>
                                    <DynamicForm :ref="(el) => setFormRef('edit', el)"
                                        v-model="formData" :form-items="formItems" />
                                </template>
                            </DialogButton>
                            <DialogButton type="button" :permission="RolePerm.DELETE"
                                :button-props="delButtonProps" @click="handleDel(row)">
                                删除
                            </DialogButton>
                        </div>
                    </template>
                </ElDropdown>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { onMounted, reactive, ref, computed, nextTick } from 'vue'
import { ElMessage, type ButtonProps } from 'element-plus'
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { RolePerm } from '@/constants/index.ts'
import { RoleService } from '@/api/roleApi'
import { PermissionService } from '@/api/permissionApi'
import { useCrudPage } from '@/composables/useCrudPage'
defineOptions({ name: 'Role' })
type Role = Api.Role.RoleInfo
type Permission = Api.Permission.PermissionInfo

const {
  query, formData, page, tableData, loading,
  getList, populateForm, clearForm, handleAdd, handleUpdate, handleDel,
  handleSearch, handleReset, setFormRef, openAdd, openEdit,
} = useCrudPage<Role>({
  api: {
    getList: RoleService.getRoleListData,
    add: RoleService.addpermission,
    update: RoleService.updatePermission,
    del: RoleService.delRole,
  },
  idKey: 'roleId',
  editFields: (row) => ({
    roleId: row.roleId,
    roleName: row.roleName,
    description: row.description,
  }),
  initialFormData: { roleId: 0, roleName: '', description: '', createTime: '' },
  messages: {
    delConfirm: '确定要删除该角色吗？删除后无法恢复！',
    invalidId: '无效的角色ID',
  },
})

// --------------- 权限分配（角色特有，不走通用 CRUD） ---------------
const permissionTreeRef = ref()
const currentCheckedIds = ref<number[]>([])
const selectPermissionIds = ref<number[]>([])
const permissionData = ref<Permission[]>([])
// 权限数据是否已经加载过（用于缓存）
const permissionLoaded = ref<boolean>(false)
// 树形配置
const treeProps = {
  children: 'children',
  label: 'permissionName',
}
// 树形数据
const treeData = computed(() => buildTree(permissionData.value))
const permissionButtonProps: ButtonProps = {
  type: 'warning',
  link: true,
}
// 编辑 / 删除按钮样式（保留原 link 文字链接样式，区别于通用 plain）
const editButtonProps: ButtonProps = {
  type: 'primary',
  link: true,
}
const delButtonProps: ButtonProps = {
  type: 'danger',
  link: true,
}
// 打开权限弹窗时，获取当前角色的权限并回填角色信息（供提交使用）
const handleOpenPermission = async (row: Role) => {
  populateForm(row)
  await getPermissionListData()

  // 获取当前角色的权限ID列表
  const data = await PermissionService.getRolePermissionIds(row.roleId)
  selectPermissionIds.value = data.list

  // 同时更新 currentCheckedIds：勾选的ID就是当前角色拥有的权限ID
  currentCheckedIds.value = [...data.list]

  // 强制更新树组件
  await nextTick() // 等待树组件渲染完成
  permissionTreeRef.value?.setCheckedKeys(selectPermissionIds.value)
}
const clearPermissionIds = () => {
  selectPermissionIds.value = []
  currentCheckedIds.value = []
  clearForm()
}
const handleTreeCheck = (_data: any, { checkedKeys, halfCheckedKeys }: any) => {
  currentCheckedIds.value = [...checkedKeys, ...halfCheckedKeys]
}
const getPermissionListData = async () => {
  // 已经加载过数据，直接返回，不发请求
  if (permissionLoaded.value) return
  const data = await PermissionService.getPermissionListData()
  permissionData.value = data.list
  permissionLoaded.value = true
}
const handleSubmit = async () => {
  if (!formData.roleId) {
    ElMessage.warning('请选择要分配权限的角色')
    return
  }
  // 提交数据
  try {
    await RoleService.updateRolePermissions({
      roleId: formData.roleId,
      permissionIds: currentCheckedIds.value,
    })
    ElMessage.success('权限分配成功')
    // 可以关闭弹窗，这里需要根据你的 DialogButton 组件实现来关闭
  } catch (error) {
    ElMessage.error('权限分配失败')
  }
}
// 构建树形结构
const buildTree = (list: Permission[], parentId: number = 0): any[] => {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(list, item.permissionId),
    }))
    .sort((a, b) => a.permissionId - b.permissionId)
}

// --------------- 表单项 / 列 / 搜索配置 ---------------
const formItems = [
  {
    type: 'Input',
    prop: 'roleName',
    label: '角色名称',
    props: {
      placeholder: '请输入角色名称',
    },
    rules: {
      required: true,
      message: '角色名称不能为空',
      trigger: 'blur',
    },
  },
  {
    type: 'Input',
    prop: 'description',
    label: '角色描述',
    props: {
      type: 'textarea',
      placeholder: '请输入角色描述',
      rows: 4,
    },
    rules: {
      required: true,
      message: '角色描述不能为空',
      trigger: 'blur',
    },
  },
]
const columns = reactive([
  { type: 'index', label: '序号' },
  { prop: 'roleName', label: '角色名称', minWidth: '150' },
  { prop: 'description', label: '描述', minWidth: '150', showOverflowTooltip: true },
  { prop: 'createTime', label: '创建时间', minWidth: '150' },
  { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['role:edit', 'role:delete'] },
])
useTableColumnPermission(columns)
const searchList = [
  {
    prop: 'roleName',
    current: 'input',
    label: '角色名称',
    props: {
      placeholder: '请输入角色名称',
    },
  },
]

onMounted(getList)
</script>

<style lang="scss" scoped>
.page {
  @include page;

  .search {
    flex: 0 0 auto;
  }

  .table {
    margin-top: 10px;
    flex: 1 1 auto;
  }

  .permissionText {
    color: rgb(255, 158, 97);
  }
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  font-size: 14px;
  padding-right: 16px;

  .node-name {
    font-weight: 500;
    min-width: 120px;
  }

  .node-code {
    color: #909399;
    font-size: 12px;
    font-family: monospace;
    min-width: 180px;
  }
}
</style>
