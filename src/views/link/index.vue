<template>
    <div ref="divRef" class="page">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :full-target-ref="divRef" :page="page" slot-header="header"
            :loading="loading" @refresh="getList"
            @current-page="getList" @page-size="getList">
            <template #header>
                <DialogButton :permission="LinkPerm.ADD"
                    @click="openAdd" @submit="handleAdd" @closed="clearForm">
                    新增友链
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('add', el)"
                            v-model="formData" :form-items="formItems">
                            <template #icon>
                                <img v-if="formData.avatar" style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.avatar">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
            </template>
            <template #linkInfo="{ row }">
                <div class="link-item">
                    <div class="link-icon">
                        <img :src="row.avatar" :alt="row.linkName" />
                    </div>
                    <div class="link-content">
                        <h4 class="link-name">{{ row.linkName }}</h4>
                        <p class="link-desc">{{ row.description }}</p>
                    </div>
                </div>
            </template>
            <template #linkUrl="{ row }">
                <a class="link-url" :href="row.linkUrl" target="_blank">{{
                    row.linkUrl }}</a>
            </template>
            <template #status="{ row }">
                <ElTag :type="row.status === 'display' ? 'success' : 'info'">
                    {{row.status === 'display' ? "显示" : "隐藏" }}
                </ElTag>
            </template>
            <template #option="{ row }">
                <DialogButton :permission="LinkPerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps" :dialog-props="editDialogProps"
                    @click="openEdit(row)" @submit="handleUpdate"
                    @closed="clearForm">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm :ref="(el: any) => setFormRef('edit', el)"
                            v-model="formData" :form-items="formItems">
                            <template #icon>
                                <img v-if="formData.avatar" style="
                            position: absolute;
                            right: 20px;
                            top: -5px;
                            width: 40px;
                            height: 40px;
                            margin-left: 30px;
                            vertical-align: middle;" :src="formData.avatar">
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton type="confirm" :buttonBorder="false"
                    :permission="LinkPerm.DELETE" :button-props="delButtonProps"
                    @click="handleDel(row)">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { onMounted, reactive, ref } from 'vue'
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { useCrudPage } from '@/composables/useCrudPage'
import { LinkPerm } from '@/constants'
import { LinkService } from '@/api/linkApi'
type Link = Api.Link.LinkInfo

const divRef = ref<HTMLElement | null>(null)

const {
  query, formData, page, tableData, loading,
  getList, clearForm, handleAdd, handleUpdate, handleDel,
  handleSearch, handleReset, editButtonProps, delButtonProps,
  setFormRef, openAdd, openEdit,
} = useCrudPage<Link>({
  api: {
    getList: LinkService.getLinkListData,
    add: LinkService.addLink,
    update: LinkService.updateLink,
    del: LinkService.delLink,
  },
  idKey: 'linkId',
  editFields: (row) => ({
    linkId: row.linkId,
    linkName: row.linkName,
    description: row.description,
    avatar: row.avatar,
    linkUrl: row.linkUrl,
    status: row.status,
  }),
  messages: {
    delConfirm: '确定要删除该友链吗？删除后无法恢复！',
    invalidId: '无效的友链ID',
  },
})

// 编辑弹窗：标题 + 关闭时销毁内容（每行一个编辑实例，避免同名 ref 抢占导致校验/重置指错）
const editDialogProps = { title: '友链信息', destroyOnClose: true }

// --------------- 表单项配置 ---------------
const formItems = ref([
    {
        type: 'Input',
        prop: 'linkName',
        label: '友链名称',
        slot: "icon",
        props: {
            placeholder: '请输入友链名称',
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
        prop: 'avatar',
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
        prop: 'linkUrl',
        label: '链接',
        props: {
            placeholder: '请输入链接',
        },
        rules: {
            required: true,
            message: '链接不能为空',
            trigger: 'blur'
        }
    },
    {
        type: 'Switch',
        prop: "status",
        label: '是否显示',
        props: {
            activeValue: "display",
            inactiveValue: "hide"
        }
    }
])
// --------------- 表格项配置 ---------------
const columns = reactive([
    { type: 'index', label: '序号' },
    { prop: 'linkName', label: '友链信息', slot: 'linkInfo', minWidth: '150', showOverflowTooltip: true },
    { slot: 'linkUrl', label: '链接', minWidth: '150', showOverflowTooltip: true },
    { slot: 'status', label: '状态', minWidth: '150'},
    { prop: 'createTime', label: '创建时间', minWidth: '150' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '150', permission: ['link:edit', 'link:delete'] }
])
useTableColumnPermission(columns)
// --------------- 搜索栏配置 ---------------
const searchList = [
    {
        prop: 'linkName',
        current: 'input',
        label: "友链名称",
        props: {
            placeholder: "请输入友链名称"
        }
    }
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

.link-item {
    display: flex;
    align-items: center;
    padding: 8px 0;

    .link-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f7fa;
        flex-shrink: 0;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .link-content {
        margin-left: 12px;
        flex: 1;
        min-width: 0;

        .link-name {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 4px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .link-desc {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.link-url {
    color: #4f46e5;
    font-size: 13px;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}
</style>
