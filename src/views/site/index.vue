<template>
    <div ref="divRef" class="page">
        <!-- 搜索栏 -->
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getSiteListData" @page-size="getSiteListData">
            <!-- 自定义头部 -->
            <template #header>
                <div class="table-header">
                    <DialogButton permission="site:add" @submit="handleAdd"
                        @closed="clearData">
                        新增站点
                        <template #content>
                            <DynamicForm v-model="formData"
                                :form-items="formItems">
                                <template #ico>
                                    <img style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.ico">
                                </template>
                            </DynamicForm>
                        </template>
                    </DialogButton>
                    <div class="icon-list">
                        <!-- 刷新数据 -->
                        <DataRefresh @click="getSiteListData" />
                        <!-- 页面全屏 -->
                        <FullScreenPage :target-ref="divRef" />
                        <!-- 导出excel -->
                        <ExcelExport :table-data="tableData" />
                    </div>
                </div>
            </template>
            <template #ico="{ row }">
                <div class="site">
                    <img :src="row.ico" alt="" />
                    <div class="info">
                        <p class="site-name">{{ row.siteName }} </p>
                        <p class="description">{{ row.description }}</p>
                    </div>
                </div>
            </template>
            <template #siteUrl="{ row }">
                <a style="color: #7893FE;" :href="row.siteUrl"
                    target="_blank">{{
                        row.siteUrl }}</a>
            </template>
            <!-- 自定义操作列 -->
            <template #option="{ row }">
                <DialogButton permission="site:edit"
                    :button-props="editButtonProps" :dialog-props="dialogProps"
                    @submit="handleUpdate" @click="getData(row)"
                    @closed="clearData">
                    编辑
                    <template #content>
                        <DynamicForm ref="formRef" v-model="formData"
                            :form-items="formItems">
                            <template #ico>
                                <img style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.ico">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton permission="site:delete"
                    :button-props="delButtonProps" @click="handleDel(row)">
                    删除
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { SiteService } from "@/api/siteApi"
import { CategoryService } from "@/api/categoryApi"
import { ElMessage, ElMessageBox, type Action, type ButtonProps, type DialogProps, type DialogEmits } from "element-plus"
type Site = Api.Site.SiteInfo
type Category = Api.Category.CategoryInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
interface CategoryOptions {
    value: Category['categoryId'] | string  // 兼容 number 和 string
    label: Category['categoryName']
}
const query = reactive<Site>({})
const formRef = ref()
const divRef = ref<HTMLElement | null>(null)    // 根标签DOM
const tableData = ref<Site[]>([])
const loading = ref(true)
const categoryOptions = ref<CategoryOptions[]>([])

// 加载分类选项
const loadCategoryOptions = () => {
    CategoryService.getCategoryOptions().then((data) => {
        categoryOptions.value = data.map(item => ({
            value: String(item.categoryId),  // 统一转换为字符串
            label: item.categoryName
        }))
    })
}

interface FormItemConfig {
    type: string
    prop?: string
    label?: string
    slot?: string
    props?: Record<string, any>
    rules?: Record<string, any>
    options?: any[]
}

// 基础表单配置
const baseFormItems: FormItemConfig[] = [
    {
        type: 'Input',
        prop: 'siteName',
        label: '名称',
        slot: "ico",
        props: {
            placeholder: '请输入站点名称',
            style: {
                width: '80%'
            }
        },
        rules: {
            required: true,
            message: '名称不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'ico',
        label: '图标',
        props: {
            placeholder: '请输入图标链接',
        },
        rules: {
            required: true,
            message: '图标链接不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'description',
        label: '描述',
        props: {
            type: 'textarea',
            placeholder: '请输入描述',
        },
        rules: {
            required: true,
            message: '描述不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Input',
        prop: 'siteUrl',
        label: '链接',
        props: {
            placeholder: '请输入链接',
        },
        rules: {
            required: true,
            message: '名称不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Select',
        prop: 'categoryId',
        label: '所属分类',
        props: {
            placeholder: '请选择分类',
            clearable: true,
        },
        rules: {
            required: true,
            message: '类别不能为空',
            trigger: 'change'
        }
    }
]

// 动态表单配置
const formItems = computed<FormItemConfig[]>(() => {
    return baseFormItems.map(item => {
        if (item.prop === 'categoryId') {
            return {
                ...item,
                options: categoryOptions.value
            }
        }
        return item
    })
})

const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const formData = reactive<Record<string, any>>({})
const editButtonProps = ref<ButtonProps>({
    size: "small"
})
const delButtonProps = ref<ButtonProps>({
    size: "small",
    type: "danger"
})
const dialogProps = ref<DialogProps>({
    title: "站点信息"
})
const columns = ref([
    { type: 'index', label: '序号' },
    { prop: 'siteName', label: '站点名称', slot: 'ico', minWidth: '200', showOverflowTooltip: true },
    { slot: 'siteUrl', label: 'URL', minWidth: '180', showOverflowTooltip: true },
    { prop: 'createTime', label: '创建时间', minWidth: '140' },
    { prop: 'categoryName', label: '所属分类', minWidth: '90' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150' }
])
const getSiteListData = async () => {
    loading.value = true
    try {
        const data: PaginatingParams<Site> = await SiteService.getSiteListData({
            ...query,
            pageNum: page.pageNum,  // 当前页码
            pageSize: page.pageSize,    // 每页条数
        })
        tableData.value = data.list
        page.total = data.total
    } finally {
        loading.value = false
    }
}
/** 编辑前获取数据 */
const getData = (row: Site) => {
    // 清空之前的表单数据
    Object.keys(formData).forEach(key => {
        delete formData[key]
    })
    // 设置编辑数据，只设置需要的字段
    // categoryId 统一转换为字符串，确保与 options.value 类型一致
    Object.assign(formData, {
        siteId: row.siteId,
        siteName: row.siteName,
        description: row.description,
        ico: row.ico,
        siteUrl: row.siteUrl,
        categoryId: String(row.categoryId)
    })
}
const clearData = () => {
    // 清除表单数据，重置表单校验
    if (formRef.value) {
        formRef.value.resetForm()
    }
    // 清空formData数据
    Object.keys(formData).forEach(key => {
        formData[key] = ''
    })
    delete formData.siteId
}
const clearAllData = () => {
    Object.keys(formData).forEach(key => {
        delete formData[key]
    })
}
/** 编辑 */
const handleUpdate = async () => {
    // 确保 categoryId 是有效值
    if (!formData.categoryId) {
        ElMessage.warning('请选择所属分类')
        return
    }
    await SiteService.updateSite({
        siteId: formData.siteId,
        siteName: formData.siteName,
        description: formData.description,
        ico: formData.ico,
        siteUrl: formData.siteUrl,
        categoryId: formData.categoryId
    })
    ElMessage({
        message: '编辑成功',
        type: 'success',
    })
    getSiteListData()
}
const handleAdd = async () => {
    // 确保 categoryId 是有效值
    if (!formData.categoryId) {
        ElMessage.warning('请选择所属分类')
        return
    }
    await SiteService.addSite({
        siteName: formData.siteName,
        description: formData.description,
        ico: formData.ico,
        siteUrl: formData.siteUrl,
        categoryId: formData.categoryId
    })
    ElMessage({
        message: '提交成功',
        type: 'success',
    })
    clearAllData()
    getSiteListData()
}
const handleDel = async (row: Site) => {
    if (!row.siteId) {
        ElMessage.warning('无效的站点ID')
        return
    }

    try {
        await ElMessageBox.confirm('确定要删除该站点吗？删除后无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            appendTo: document.body,
        })

        // 确认后才执行
        await SiteService.delSite(row.siteId)
        ElMessage.success('删除成功')
        getSiteListData()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
/** 搜索 */
const handleSearch = () => {
    getSiteListData()
}
/** 搜索栏配置 */
const searchList = [
    {
        prop: 'siteName',
        current: 'input',
        label: "站点名称",
        props: {
            placeholder: "请输入站点名称"
        }
    },
    {
        prop: 'categoryName',
        current: 'input',
        label: "所属分类",
        props: {
            placeholder: "请输入分类"
        }
    }
]
/** 搜索重置 */
const handleReset = () => {
    getSiteListData()
}
onMounted(() => {
    getSiteListData()
    loadCategoryOptions()
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
}

.site {
    display: flex;
    align-items: center;

    img {
        width: 30px;
        height: 30px;
        /* vertical-align: middle; */
    }

    .info {
        margin-left: 10px;

        .site-name {
            font-size: 13px;
            font-weight: bold;
        }

        .description {
            font-size: 11px;
            color: #5f7f9e;
        }
    }

}
</style>
