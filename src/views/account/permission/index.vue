<template>
    <div class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <!-- 权限树表格 -->
        <ElCard class="table" shadow="never">
            <template #header>
                <DialogButton permission="permission:add" @click="handleClick" @submit="handleAdd"
                    @open="clearData">
                    新增权限
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems">
                            <template #switchList>
                                <div
                                    style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 50px;">
                                    <ElSwitch v-model="formData.hidden"
                                        :active-value="1" :inactive-value="0"
                                        inactive-text="是否隐藏" />
                                    <ElSwitch v-model="formData.keepAlive"
                                        :active-value="1" :inactive-value="0"
                                        inactive-text="是否缓存" />
                                </div>
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
            </template>
            
            <!-- 骨架屏 -->
            <TreeSkeleton v-if="loading" />
            
            <!-- 树形结构 -->
            <ElTree v-else ref="treeRef" :data="treeData" :props="treeProps"
                node-key="permissionId"
                :default-expanded-keys="defaultExpandedKeys"
                :filter-node-method="filterNode" highlight-current
                @node-click="handleNodeClick">
                <template #default="{ node, data }">
                    <div class="custom-tree-node">
                        <SvgIcon
                            :icon="data.icon || 'mdi:file-document-outline'">
                        </SvgIcon>
                        <!-- 名称 -->
                        <span class="node-name">{{ data.permissionName }}</span>
                        <!-- 类型标签 -->
                        <ElTag type='primary' size="small" effect="plain">
                            {{ permissionType[data.type as keyof typeof
                                permissionType] }}
                        </ElTag>
                        <!-- 权限编码 -->
                        <span class="node-code">{{ data.permissionCode }}</span>
                        <!-- ID -->
                        <span class="node-id">ID: {{ data.permissionId }}</span>
                        <!-- 操作按钮 -->
                        <div class="node-actions">
                            <DialogButton permission="permission:edit" :button-props="editButtonProps"
                                @click="getData(data)" @closed="clearData">
                                <SvgIcon icon="mdi:file-edit-outline">
                                    编辑
                                </SvgIcon>
                                <template #content>
                                    <DynamicForm ref="formRef"
                                        v-model="formData"
                                        :form-items="formItems">
                                        <template #switchList>
                                            <div
                                                style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 50px;">
                                                <ElSwitch
                                                    v-model="formData.hidden"
                                                    :active-value="1"
                                                    :inactive-value="0"
                                                    inactive-text="是否隐藏" />
                                                <ElSwitch
                                                    v-model="formData.keepAlive"
                                                    :active-value="1"
                                                    :inactive-value="0"
                                                    inactive-text="是否缓存" />
                                            </div>
                                        </template>
                                    </DynamicForm>
                                </template>
                            </DialogButton>
                            <DialogButton type="button" permission="permission:delete" :button-props="delButtonProps"
                                @click="handleDelete(data)">
                                <SvgIcon icon="mdi:delete-outline">
                                    删除
                                </SvgIcon>
                            </DialogButton>
                        </div>
                    </div>
                </template>
            </ElTree>
        </ElCard>
    </div>
</template>

<script setup lang='ts'>
import { ElMessage, ElMessageBox, type ButtonProps } from 'element-plus'

type Permission = Api.Permission.PermissionInfo
defineOptions({ name: 'Permission' })
import { PermissionService } from "@/api/permissionApi"

const formRef = ref()
const treeRef = ref()
const tableData = ref<Permission[]>([])
const defaultExpandedKeys = ref<number[]>([])
const isPermissionCode = ref<boolean>(false)
const query = ref({})
const loading = ref(true)
const currentEditId = ref<number>(0)

const permissionType = {
    DIRECTORY: '目录',
    MENU: '菜单',
    BUTTON: '按钮',
    API: '外链'
} as const

const formData = reactive<Permission>({
    permissionId: 0,
    permissionName: '',
    permissionCode: '',
    parentId: 0,
    type: 'API',
    sortOrder: 0,
    hidden: 0,
    keepAlive: 0,
    status: 'ENABLE'
})

const editButtonProps = ref<ButtonProps>({
    size: 'small',
    link: true,
    type: 'primary'
})

const delButtonProps = ref<ButtonProps>({
    size: 'small',
    link: true,
    type: 'danger'
})

// 树形配置
const treeProps = {
    children: 'children',
    label: 'permissionName'
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

// 树形数据
const treeData = computed(() => {
    return buildTree(tableData.value)
})

// 过滤节点
const filterNode = (value: string, data: any) => {
    if (!value) return true
    return data.permissionName.includes(value) ||
        data.permissionCode.includes(value) ||
        data.permissionId.toString().includes(value)
}

// 递归获取所有子节点ID
const getAllChildIds = (data: any[], targetId: number): number[] => {
    const result: number[] = []
    const findNode = (nodes: any[]) => {
        for (const node of nodes) {
            if (node.permissionId === targetId) {
                // 找到目标节点，收集所有子节点ID
                const collectChildren = (children: any[]) => {
                    for (const child of children) {
                        result.push(child.permissionId)
                        if (child.children && child.children.length > 0) {
                            collectChildren(child.children)
                        }
                    }
                }
                if (node.children && node.children.length > 0) {
                    collectChildren(node.children)
                }
                return true
            }
            if (node.children && node.children.length > 0) {
                if (findNode(node.children)) {
                    return true
                }
            }
        }
        return false
    }
    findNode(data)
    return result
}

// 过滤树数据，排除当前节点及其子节点
const filterTreeData = (data: any[], excludeIds: number[]): any[] => {
    return data
        .filter(item => !excludeIds.includes(item.permissionId))
        .map(item => ({
            ...item,
            children: item.children ? filterTreeData(item.children, excludeIds) : []
        }))
        .filter(item => item.children.length > 0 || !excludeIds.includes(item.permissionId))
}

// 获取可用于父级选择的树数据
const getParentTreeData = computed(() => {
    if (currentEditId.value === 0) {
        return treeData.value
    }
    const excludeIds = getAllChildIds(treeData.value, currentEditId.value)
    excludeIds.push(currentEditId.value) // 排除自身
    return filterTreeData(treeData.value, excludeIds)
})

// 根据类型动态计算表单项 - 改为 computed
const formItems = computed(() => [
    {
        type: 'Select',
        prop: 'type',
        label: '权限类型',
        props: { placeholder: '请选择权限类型', multiple: false, clearable: true },
        options: [
            { value: "MENU", label: "菜单" },
            { value: "BUTTON", label: "按钮" },
            { value: "API", label: "接口" },
        ],
        rules: { required: true, message: '类型不能为空', trigger: 'blur' }
    },
    {
        type: 'Input',
        prop: 'permissionName',
        label: '权限名称',
        props: { placeholder: '请输入权限名称' },
        rules: { required: true, message: '名称不能为空', trigger: 'blur' }
    },
    {
        type: 'Input',
        prop: 'permissionCode',
        label: '权限编码',
        props: {
            placeholder: '请输入权限编码，如：blog:xxx:xxx',
            disabled: isPermissionCode.value
        },
        rules: { required: true, message: '编码不能为空', trigger: 'blur' }
    },
    {
        type: 'Input',
        prop: 'sortOrder',
        label: '排序号',
        props: { placeholder: '请输入排序号' }
    },
    {
        type: 'TreeSelect',
        prop: 'parentId',
        label: '父级权限',
        props: {
            placeholder: '请选择父级权限（不选则为顶级）',
            data: getParentTreeData.value, // 使用过滤后的数据
            nodeKey: 'permissionId',
            props: {
                label: 'permissionName',
                value: 'permissionId',
                children: 'children',
                clearable: true,
            },
            modelValue: formData.parentId, // 绑定到 formData.parentId
            checkStrictly: true,
            renderAfterExpand: false,
        },
    },
    {
        type: 'Input',
        prop: 'routeName',
        label: '路由名称',
        props: {
            placeholder: '请输入路由名称',
        }
    },
    {
        type: 'Input',
        prop: 'path',
        label: '访问路径',
        props: {
            placeholder: '请输入访问路径',
        }
    },
    {
        type: 'Input',
        prop: 'icon',
        label: '图标',
        props: {
            placeholder: '请输入图标名（Material Design Icons）',
        }
    },
    {
        type: 'Input',
        prop: 'component',
        label: '组件路径',
        props: {
            placeholder: '请输入组件路径',
        }
    },
    {
        slot: 'switchList'
    }
])

/** 搜索栏配置 */
const searchList = [
    {
        prop: 'permissionName',
        current: 'input',
        label: "权限名称",
        props: {
            placeholder: "请输入名称"
        }
    },
    {
        prop: 'permissionCode',
        current: 'input',
        label: "权限编码",
        props: {
            placeholder: "请输入编码"
        }
    },
    {
        prop: 'permissionId',
        current: 'input',
        label: "权限ID",
        props: {
            placeholder: "请输入ID"
        }
    },
]

/** 编辑前获取数据 */
const getData = (data: Permission) => {
    isPermissionCode.value = true
    currentEditId.value = data.permissionId
    const { children, ...rest } = data
    Object.assign(formData, rest)
}

const clearData = () => {
    // 清除表单数据，重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
    // 重置formData数据到默认值，保持枚举字段的正确类型
    Object.assign(formData, {
        permissionId: 0,
        permissionName: '',
        permissionCode: '',
        parentId: 0,
        type: 'API',           // 枚举字段：保持默认值
        sortOrder: 0,
        hidden: 0,             // 枚举字段：保持默认值
        keepAlive: 0,          // 枚举字段：保持默认值
        status: 'ENABLE'       // 枚举字段：保持默认值
    })
    currentEditId.value = 0
    isPermissionCode.value = false
}

const handleClick = () => {
    isPermissionCode.value = false
    currentEditId.value = 0
}

const handleAdd = async () => {
    // 表单验证
    if (formRef.value) {
        await formRef.value.validate()
    }
    await PermissionService.addPermission(formData)
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    await getPermissionListData()
    clearData()
}

// 删除
const handleDelete = (data: Permission) => {
    ElMessageBox.confirm(
        `确定要删除权限 "${data.permissionName}" 吗？`,
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        await PermissionService.delPermission(data.permissionId)
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
        await getPermissionListData()
    }).catch(() => {})
}

// 获取权限列表
const getPermissionListData = async () => {
    loading.value = true
    try {
        const data = await PermissionService.getPermissionListData()
        tableData.value = data.list
        // 默认展开第一层
        if (data.list.length > 0) {
            defaultExpandedKeys.value = data.list
                .filter(item => item.parentId === 0)
                .map(item => item.permissionId)
        }
    } finally {
        loading.value = false
    }
}

// 节点点击
const handleNodeClick = (data: any) => {
    console.log('点击节点:', data)
}

/** 搜索 */
const handleSearch = () => {
    getPermissionListData()
}

/** 搜索重置 */
const handleReset = () => {
    getPermissionListData()
}

onMounted(async () => {
    await getPermissionListData()
})
</script>

<style lang="scss" scoped>
.page {
    @include page;

    .search {
        flex: 0 0 auto;
    }

    .table {
        padding: 0 10px;
        border-radius: 10px;
        transition: none;
        margin-top: 10px;
        flex: 1 1 auto;
        overflow: auto;

        :deep(.el-tree) {
            background: transparent;

            .el-tree-node__content {
                height: 40px;
                padding: 8px 0;

                &:hover {
                    background-color: var(--el-fill-color-light);
                }
            }
        }
    }

    .custom-tree-node {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        font-size: 14px;
        padding-right: 16px;

        .menu-icon {
            color: #409eff;
            font-size: 16px;
        }

        .button-icon {
            color: #67c23a;
            font-size: 14px;
        }

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

        .node-id {
            color: #c0c4cc;
            font-size: 12px;
        }

        .node-actions {
            margin-left: auto;
            display: flex;
            gap: 8px;
            opacity: 0;
            transition: opacity 0.3s;
        }
    }

    .custom-tree-node:hover {
        .node-actions {
            opacity: 1;
        }
    }
}
</style>