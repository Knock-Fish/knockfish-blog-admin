<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" @current-page="getRoleListData"
            @page-size="getRoleListData">
            <template #header>
                <DialogButton :permission="RolePerm.ADD" @submit="handleAdd"
                    @closed="clearData">
                    新增角色
                    <template #content>
                        <DynamicForm v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <ElDropdown placement="bottom">
                    <ElButton style="padding: 10px; border: none;" plain
                        type="info">
                        <SvgIcon icon="mdi:more-vert" />
                    </ElButton>
                    <template #dropdown>
                        <div style="display: flex; flex-direction: column;">
                            <DialogButton :permission="RolePerm.EDIT"
                                :button-props="permissionButtonProps"
                                @open="handleOpenPermission(row)"
                                @closed="clearPermissionIds"
                                @submit="handleSubmit">
                                权限分配
                                <template #content>
                                    <ElScrollbar height="300px">
                                        <ElTree :data="treeData"
                                            node-key="permissionId"
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
                                @click="getData(row)" @submit="handleUpdate"
                                @closed="clearData">
                                编辑
                                <template #content>
                                    <DynamicForm v-model="formData"
                                        :form-items="formItems" />
                                </template>
                            </DialogButton>
                            <DialogButton type="button"
                                :permission="RolePerm.DELETE"
                                :button-props="delButtonProps"
                                @click="handleDel(row)">
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
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { RolePerm } from '@/constants/index.ts'
import { RoleService } from '@/api/roleApi'
import { PermissionService } from '@/api/permissionApi'
import { type ButtonProps, type DialogProps, ElMessage, ElMessageBox } from "element-plus"
defineOptions({ name: 'Role' })
type Role = Api.Role.RoleInfo
type Permission = Api.Permission.PermissionInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
const query = ref({})
const divRef = ref<HTMLElement | null>(null)
const tableData = ref<Role[]>([])
const permissionTreeRef = ref()
const currentCheckedIds = ref<number[]>([])
const formData = reactive<Role>({
    roleId: 0,
    roleName: '',
    description: '',
    createTime: '',
})
const formItems = ref([
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
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'description',
        label: '角色描述',
        props: {
            type: "textarea",
            placeholder: '请输入角色描述',
            rows: 4
        },
        rules: {
            required: true,
            message: '角色描述不能为空',
            trigger: 'blur'
        }
    },
])
// 打开权限弹窗时，获取当前角色的权限
const handleOpenPermission = async (row: Role) => {
    // 保存当前角色信息，用于提交
    getData(row)
    await getPermissionListData()

    // 获取当前角色的权限ID列表
    const data = await PermissionService.getRolePermissionIds(row.roleId)
    selectPermissionIds.value = data.list
    console.log(selectPermissionIds.value)

    // 重要：同时更新 currentCheckedIds
    // 因为勾选的ID就是当前角色拥有的权限ID
    currentCheckedIds.value = [...data.list]

    // 强制更新树组件
    await nextTick() // 等待树组件渲染完成
    permissionTreeRef.value?.setCheckedKeys(selectPermissionIds.value)
}
/** 编辑前获取数据 */
const getData = (row: Role) => {
    const { roleId, roleName, description } = row
    Object.assign(formData, { roleId, roleName, description })
}
const clearData = () => {
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Role] as any) = ""
    })
}
const clearPermissionIds = () => {
    selectPermissionIds.value = []
    currentCheckedIds.value = []
    clearData()
}
// 树形配置
const treeProps = {
    children: 'children',
    label: 'permissionName'
}
// 树形数据
const treeData = computed(() => buildTree(permissionData.value))
const selectPermissionIds = ref<number[]>([])
const permissionData = ref<Permission[]>([])
// 权限数据是否已经加载过（用于缓存）
const permissionLoaded = ref<boolean>(false)
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const handleTreeCheck = (data: any, { checkedKeys, halfCheckedKeys }: any) => {
    // data: 当前变化的节点数据
    // checkedKeys: 当前所有勾选的节点ID数组
    // halfCheckedKeys: 当前所有半勾选的节点ID数组
    // console.log('所有关联的ID:', currentCheckedIds)
    currentCheckedIds.value = [...checkedKeys, ...halfCheckedKeys]

}
const permissionButtonProps = ref<ButtonProps>({
    type: "warning",
    link: true
})
const editButtonProps = ref<ButtonProps>({
    // size: "small",
    type: "primary",
    link: true
})
const delButtonProps = ref<ButtonProps>({
    // size: "small",
    type: "danger",
    link: true
})
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'roleName', label: '角色名称', minWidth: '150' },
    { prop: 'description', label: '描述', minWidth: '150', showOverflowTooltip: true },
    // { prop: 'permission', label: '分配/拥有权限', minWidth: '100', slot: "permission", permission: ['role:edit'] },
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['role:edit', 'role:delete'] }
])
useTableColumnPermission(columns)
const searchList = [
    {
        prop: 'roleName',
        current: 'input',
        label: "角色名称",
        props: {
            placeholder: "请输入角色名称"
        }
    }
]
const handleDel = async (row: Role) => {
    if (!row.roleId) {
        ElMessage.warning('无效的站点ID')
        return
    }

    try {
        await ElMessageBox.confirm('确定要删除该角色吗？删除后无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            appendTo: document.body,
        })

        // 确认后才执行
        await RoleService.delRole(row.roleId)
        ElMessage.success('删除成功')
        getRoleListData()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
const handleSubmit = async () => {
    if (!formData.roleId) {
        ElMessage.warning('请选择要分配权限的角色')
        return
    }
    console.log('提交的权限ID:', currentCheckedIds.value)
    console.log('角色ID:', formData.roleId)
    // 提交数据
    // const params = {
    //     roleId: formData.roleId,
    //     permissionIds: currentCheckedIds.value
    // }
    try {
        await RoleService.updateRolePermissions({
            roleId: formData.roleId,
            permissionIds: currentCheckedIds.value
        })
        ElMessage.success('权限分配成功')
        // 可以关闭弹窗，这里需要根据你的 DialogButton 组件实现来关闭
    } catch (error) {
        ElMessage.error('权限分配失败')
    }
}
const getRoleListData = async () => {
    const data: PaginatingParams<Role> = await RoleService.getRoleListData({
        ...query.value,
        pageNum: page.pageNum,
        pageSize: page.pageSize,
    })
    tableData.value = data.list
    page.total = data.total
}
const getPermissionListData = async () => {
    // 已经加载过数据，直接返回，不发请求
    if (permissionLoaded.value) return
    const data = await PermissionService.getPermissionListData()
    permissionData.value = data.list
    permissionLoaded.value = true
}
const handleAdd = async () => {
    await RoleService.addpermission(formData)
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    page.pageNum = 1
    getRoleListData()
}
const handleUpdate = async () => {
    await RoleService.updatePermission(formData)
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    getRoleListData()
}
/** 搜索 */
const handleSearch = () => {
    page.pageNum = 1
    getRoleListData()
}
/** 搜索重置 */
const handleReset = () => {
    page.pageNum = 1
    getRoleListData()
}
// 构建树形结构
const buildTree = (list: Permission[], parentId: number = 0): any[] => {
    return list
        .filter(item => item.parentId === parentId)
        .map(item => ({
            ...item,
            children: buildTree(list, item.permissionId)
        }))
        .sort((a, b) => a.permissionId - b.permissionId)
}
onMounted(async () => {
    await getRoleListData()
})
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
