<template>
    <div class="page">
        <div class="stats-grid">
            <ElCard class="stat-card" shadow="never">
                <div class="stat-content">
                    <div class="stat-label">📄 总文件引用</div>
                    <div class="stat-value">{{ stats.totalCount }}</div>
                    <div class="stat-sub">所有文件引用记录</div>
                </div>
            </ElCard>
            <ElCard class="stat-card" shadow="never">
                <div class="stat-content">
                    <div class="stat-label">📎 被引用文件</div>
                    <div class="stat-value">{{ stats.referencedCount }}</div>
                    <div class="stat-sub">去重后的文件数量</div>
                </div>
            </ElCard>
            <ElCard class="stat-card" shadow="never">
                <div class="stat-content">
                    <div class="stat-label">📰 文章引用</div>
                    <div class="stat-value">{{ stats.articleCount }}</div>
                    <div class="stat-sub">reference_type = article</div>
                </div>
            </ElCard>
            <ElCard class="stat-card" shadow="never">
                <div class="stat-content">
                    <div class="stat-label">📝 笔记引用</div>
                    <div class="stat-value">{{ stats.noteCount }}</div>
                    <div class="stat-sub">reference_type = note</div>
                </div>
            </ElCard>
        </div>

        <PageTable class="main-table" :pagination="false" :columns="columns"
            :table-data="filteredData" slot-header="header" :loading="loading"
            @selection-change="handleSelectionChange">
            <template #header>
                <div class="header-actions">
                    <ElButton type="success" size="default"
                        @click="triggerCleanup">
                        <SvgIcon icon="mdi:broom" size="16px" />
                        手动清理孤立文件
                    </ElButton>
                    <ElButton size="default" @click="loadData">
                        <SvgIcon icon="mdi:refresh" size="16px" />
                        刷新
                    </ElButton>
                </div>
            </template>
            <template #type="{ row }">
                <div class="type-tags">
                    <ElTag :type="getTypeTagType(row.referenceType)"
                        size="small">
                        {{ getTypeLabel(row.referenceType) }}
                    </ElTag>
                    <ElTag v-if="isOrphan(row)" type="warning" size="small">孤立
                    </ElTag>
                </div>
            </template>
            <template #filesize="{ row }">
                {{ formatFileSize(row.fileSize) }}
            </template>
            <template #referenceid="{ row }">
                <span v-if="row.referenceId">{{ row.referenceId }}</span>
                <span v-else class="text-muted">无</span>
            </template>
            <template #option="{ row }">
                <ElButton type="danger" size="small" @click="deleteSingle(row)">
                    删除</ElButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FileReferenceService } from '@/api/fileReferenceApi'

type FileReference = Api.FileReference.FileReferenceInfo

const loading = ref(false)
const searchKeyword = ref('')
const allData = ref<FileReference[]>([])
const selectedIds = ref<number[]>([])

const stats = reactive({
    totalCount: 0,
    referencedCount: 0,
    articleCount: 0,
    noteCount: 0
})

const filteredData = computed(() => {
    if (!searchKeyword.value.trim()) {
        return allData.value
    }
    const keyword = searchKeyword.value.toLowerCase()
    return allData.value.filter(item =>
        (item.fileName && item.fileName.toLowerCase().includes(keyword)) ||
        (item.filePath && item.filePath.toLowerCase().includes(keyword)) ||
        (item.fileId && item.fileId.toString().includes(keyword)) ||
        (item.referenceType && item.referenceType.toLowerCase().includes(keyword)) ||
        (item.referenceId && item.referenceId.toString().includes(keyword))
    )
})

const columns = ref([
    { type: 'selection', width: '50' },
    { prop: 'fileId', label: '文件ID', width: '100' },
    { prop: 'fileName', label: '文件名', minWidth: '180', showOverflowTooltip: true },
    { prop: 'filePath', label: '文件路径', minWidth: '250', showOverflowTooltip: true },
    { prop: 'fileSize', label: '文件大小', width: '120', slot: 'filesize' },
    { prop: 'referenceType', label: '引用类型', width: '130', slot: 'type' },
    { prop: 'referenceId', label: '引用ID', width: '100', slot: 'referenceid' },
    { prop: 'createTime', label: '创建时间', width: '180' },
    { prop: 'action', label: '操作', fixed: 'right', slot: 'option', width: '80' }
])

const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024
        i++
    }
    return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

const getTypeLabel = (type?: string): string => {
    const map: Record<string, string> = { 'article': '文章', 'note': '笔记' }
    return map[type || ''] || (type || '未知')
}

type TagType = 'success' | 'info' | 'primary' | 'warning' | 'danger'
const getTypeTagType = (type?: string): TagType => {
    const map: Record<string, TagType> = { 'article': 'primary', 'note': 'success' }
    return map[type || ''] || 'info'
}

const isOrphan = (row: FileReference): boolean => {
    return !row.referenceId || row.referenceId === null
}

const loadData = async () => {
    loading.value = true
    try {
        const refsResult = await FileReferenceService.getAllFileReferences()
        allData.value = refsResult || []

        const pathsResult = await FileReferenceService.getReferencedPaths()
        const referencedPaths = pathsResult || []

        stats.totalCount = allData.value.length
        stats.referencedCount = referencedPaths.length
        stats.articleCount = allData.value.filter(d => d.referenceType === 'article').length
        stats.noteCount = allData.value.filter(d => d.referenceType === 'note').length

        selectedIds.value = []

        if (stats.totalCount > 0) {
            ElMessage.success(`加载成功，共 ${stats.totalCount} 条文件引用`)
        } else {
            ElMessage.info('暂无文件引用记录')
        }
    } catch (error) {
        console.error('加载数据失败:', error)
        ElMessage.error('加载数据失败')
        allData.value = []
    } finally {
        loading.value = false
    }
}

const handleSelectionChange = (val: FileReference[]) => {
    selectedIds.value = val.map(item => item.fileId!).filter(id => id !== undefined)
}

const deleteSingle = async (row: FileReference) => {
    if (!row.fileId) {
        ElMessage.warning('无效的文件ID')
        return
    }
    try {
        await ElMessageBox.confirm(
            `确定要删除文件引用吗？\n文件：${row.fileName || '未命名'}\nID：${row.fileId}`,
            '确认删除',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning',
                appendTo: document.body
            }
        )

        await FileReferenceService.deleteFileReferenceById(row.fileId)
        ElMessage.success('删除成功')
        await loadData()
    } catch {
        ElMessage.info('已取消')
    }
}

const triggerCleanup = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要执行手动清理任务吗？\n这将删除所有孤立文件（无引用且超过72小时的文件），操作不可逆！',
            '手动清理孤立文件',
            {
                confirmButtonText: '确定清理',
                cancelButtonText: '取消',
                type: 'warning',
                appendTo: document.body
            }
        )

        ElMessage.info('正在执行清理任务，请稍候...')
        const result = await FileReferenceService.cleanupOrphanFiles()
        ElMessage.success('清理任务执行成功: ' + (result || ''))
        await loadData()
    } catch {
        ElMessage.info('已取消')
    }
}

onMounted(async () => {
    await loadData()
})
</script>

<style lang="scss" scoped>
.page {
    @include page;
    gap: 10px;

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;

        .stat-card {
            padding: 16px 20px;
            border-radius: 12px;

            .stat-content {
                .stat-label {
                    font-size: 13px;
                    color: #999;
                    margin-bottom: 6px;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .stat-sub {
                    font-size: 12px;
                    color: #bbb;
                    margin-top: 4px;
                }
            }
        }
    }

    .main-table {
        flex: 1;
        overflow: hidden;


        .type-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .text-muted {
            color: #999;
        }
    }
}

@media (max-width: 768px) {
    .page {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .page-header {
            flex-direction: column;
            align-items: stretch;

            .header-actions {
                justify-content: stretch;

                .el-button {
                    flex: 1;
                    justify-content: center;
                }
            }
        }
    }
}

@media (max-width: 480px) {
    .page {
        .stats-grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>