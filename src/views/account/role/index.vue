<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" @current-page="getRoleListData"
            @page-size="getRoleListData">
            <template #header>
                <div class="table-header">
                    <DialogButton permission="role:add" @submit="handleAdd">
                        新增角色
                        <template #content>
                            <DynamicForm v-model="formData"
                                :form-items="formItems" />
                        </template>
                    </DialogButton>
                    <div class="icon-list">
                        <DataRefresh @click="getRoleListData" />
                        <FullScreenPage :target-ref="divRef" />
                        <ExcelExport :table-data="tableData" />
                    </div>
                </div>
            </template>
            <template #permission="{ row }">
                <DialogButton permission="role:edit" :button-props="permissionButtonProps"
                    @open="handleOpenPermission(row)"
                    @closed="clearPermissionIds" @submit="handleSubmit">
                    <span class="permissionText">
                        <SvgIcon icon="mdi:account-box-edit-outline">
                            分配权限
                        </SvgIcon>
                    </span>
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
                                            data.permissionName }}</span>
                                        <span class="node-code">{{
                                            data.permissionCode }}</span>
                                    </div>
                                </template>
                            </ElTree>
                        </ElScrollbar>
                    </template>
                </DialogButton>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton permission="role:edit" :button-props="editButtonProps" @click="getData(row)">
                    编辑
                    <template #content>
                        <DynamicForm v-model="formData"
                            :form-items="formItems" />
                    </template>
                </DialogButton>
                <DialogButton type="button" permission="role:delete" :button-props="delButtonProps">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { RoleService } from '@/api/roleApi'
import { PermissionService } from '@/api/permissionApi'
import { type ButtonProps, type DialogProps, ElMessage } from "element-plus"
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
const clearPermissionIds = () => {
    selectPermissionIds.value = []
    currentCheckedIds.value = []  // 添加这行
    // 清空formData数据
    Object.keys(formData).forEach((key) => {
        (formData[key as keyof Role] as any) = ""
    })
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
    size: "small",
    link: true
})
const editButtonProps = ref<ButtonProps>({
    size: "small",
})
const delButtonProps =  ref<ButtonProps>({
    size: "small",
    type: "danger"
})
const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'roleName', label: '角色名称', minWidth: '130' },
    { prop: 'description', label: '描述', minWidth: '180', showOverflowTooltip: true },
    { label: '分配/拥有权限', minWidth: '100', slot: "permission" },
    { prop: 'createTime', label: '创建时间', minWidth: '130' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])
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
        ...query,
        pageNum: page.pageNum,  // 当前页码
        pageSize: page.pageSize,    // 每页条数
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
    permissionLoaded.value = false
    getPermissionListData()
}
/** 搜索 */
const handleSearch = () => {
    // getRoleListData()
}
/** 搜索重置 */
const handleReset = () => {
    // getRoleListData()
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
onMounted(() => {
    getRoleListData()
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

        .table-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .icon-list {
                display: flex;
            }
        }
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