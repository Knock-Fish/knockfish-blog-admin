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
            <ElTree ref="treeRef" :data="treeData" :props="treeProps"
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
                            <DialogButton type="button" permission="permission:delete" :button-props="delButtonProps">
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
import { ElMessage, ElMessageBox, type ButtonProps, type FormProps } from 'element-plus'

type Permission = Api.Permission.PermissionInfo
defineOptions({ name: 'Permission' })
import { PermissionService } from "@/api/permissionApi"
const formRef = ref()
const tableData = ref<Permission[]>([])
const defaultExpandedKeys = ref<number[]>([])
const isPermissionCode = ref<boolean>(false)
const query = ref({})
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
const treeData = computed(() => buildTree(tableData.value))

// 过滤节点
const filterNode = (value: string, data: any) => {
    if (!value) return true
    return data.permissionName.includes(value) ||
        data.permissionCode.includes(value) ||
        data.permissionId.toString().includes(value)
}

/** 编辑前获取数据 */
const getData = (data: Permission) => {
    isPermissionCode.value = true
    const { children, ...rest } = data
    Object.assign(formData, rest)
}
const clearData = () => {
    // 清除表单数据，重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
    // 清空formData数据
    Object.keys(formData).forEach(key => {
        (formData[key as keyof Permission] as any) = ''
    })

}
const handleClick = () => {
    isPermissionCode.value = false
}
const handleAdd = async () => {
    await PermissionService.addPermission(formData)
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    getPermissionListData()
}
// 监听搜索
// watch(filterText, (val) => {
//     treeRef.value?.filter(val)
//     if (val) {
//         // 搜索时展开所有匹配的节点
//         expandAll()
//     }
// })

// 获取权限列表
const getPermissionListData = async () => {
    const data = await PermissionService.getPermissionListData()
    tableData.value = data.list
}

// 节点点击
const handleNodeClick = (data: any) => {
    console.log('点击节点:', data)
}
// 基础表单项
// const baseFormItems = computed(() => [
//     {
//         type: 'Select',
//         prop: 'type',
//         label: '权限类型',
//         props: { placeholder: '请选择权限类型', multiple: false, clearable: true },
//         options: [
//             { value: "MENU", label: "菜单" },
//             { value: "BUTTON", label: "按钮" },
//             { value: "API", label: "接口" },
//         ],
//         rules: { required: true, message: '类型不能为空', trigger: 'blur' }
//     },
//     {
//         type: 'Input',
//         prop: 'permissionName',
//         label: '权限名称',
//         props: { placeholder: '请输入权限名称' },
//         rules: { required: true, message: '名称不能为空', trigger: 'blur' }
//     },
//     {
//         type: 'Input',
//         prop: 'permissionCode',
//         label: '权限编码',
//         props: {
//             placeholder: '请输入权限编码，如：blog:xxx:xxx',
//             disabled: isPermissionCode.value
//         },
//         rules: { required: true, message: '编码不能为空', trigger: 'blur' }
//     },
//     {
//         type: 'Input',
//         prop: 'sortOrder',
//         label: '排序号',
//         props: { placeholder: '请输入排序号' }
//     },
// ])
// // 菜单专用的表单项
// const menuFormItems = reactive([
//     {
//         type: 'TreeSelect',
//         prop: 'parentId',
//         label: '父级权限',
//         props: {
//             placeholder: '请选择父级权限（不选则为顶级）',
//             get data() {
//                 return unref(treeData)
//             },
//             nodeKey: 'permissionId',
//             props: {
//                 label: 'permissionName',
//                 value: 'permissionId',
//                 children: 'children',
//                 clearable: true,
//             },
//             // 动态获取当前选中的值
//             get modelValue() {
//                 return formData.parentId
//             },
//             checkStrictly: true,
//             renderAfterExpand: false,
//         },
//     },
//     {
//         type: 'Input',
//         prop: 'routeName',
//         label: '路由名称',
//         props: {
//             placeholder: '请输入路由名称',
//         }
//     },
//     {
//         type: 'Input',
//         prop: 'path',
//         label: '访问路径',
//         props: {
//             placeholder: '请输入访问路径',
//         }
//     },
//     {
//         type: 'Input',
//         prop: 'icon',
//         label: '图标',
//         props: {
//             placeholder: '请输入图标名（Material Design Icons）',
//         }
//     },
//     {
//         type: 'Input',
//         prop: 'component',
//         label: '组件路径',
//         props: {
//             placeholder: '请输入组件路径',
//         }
//     },
//     {
//         slot: 'swithList',
//     },
// ])
// 根据类型动态计算表单项
const formItems = ref([
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
            data: unref(treeData),
            nodeKey: 'permissionId',
            props: {
                label: 'permissionName',
                value: 'permissionId',
                children: 'children',
                clearable: true,
            },
            modelValue: null,
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
// const formItems = computed(() => {
//     const items = [...unref(baseFormItems)]
//     switch (formData.type) {
//         case 'MENU':
//             items.push(...menuFormItems)
//             break
//         default:
//             // 未选择类型时，不显示额外的表单项
//             break
//     }
//     return items
// })
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
/** 搜索 */
const handleSearch = () => {
    getPermissionListData()
}
/** 搜索重置 */
const handleReset = () => {
    getPermissionListData()
}
onMounted(() => {
    getPermissionListData()
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

        // margin-top: 10px;
        // flex: 1 1 auto;
        // overflow: auto;
        // background-color: var(--card-color);
        // border: 1px solid var(--border-color);
        // padding: 0 10px;
        // border-radius: 10px;

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