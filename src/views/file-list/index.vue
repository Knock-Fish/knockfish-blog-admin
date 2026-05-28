<template>
    <div class="file-manager">
        <div class="fm-header">
            <div class="fm-breadcrumb">
                <div 
                    v-for="(item, index) in breadcrumbs" 
                    :key="item.key"
                    class="breadcrumb-item"
                    :class="{ 'is-active': index === breadcrumbs.length - 1 }"
                    @click="navigateTo(item.key)"
                >
                    <SvgIcon v-if="index === 0" icon="mdi:folder-home" size="16px" />
                    <span>{{ item.name }}</span>
                    <SvgIcon v-if="index < breadcrumbs.length - 1" icon="mdi:chevron-right" size="14px" />
                </div>
            </div>
            
            <div class="fm-actions">
                <ElButton 
                    type="primary" 
                    size="small"
                    @click="handleUpload"
                    class="action-btn"
                >
                    <SvgIcon icon="mdi:upload" size="16px" />
                    上传文件
                </ElButton>
                <ElButton 
                    size="small"
                    @click="createFolder"
                    class="action-btn"
                >
                    <SvgIcon icon="mdi:folder-plus" size="16px" />
                    新建文件夹
                </ElButton>
            </div>
        </div>

        <div class="fm-toolbar">
            <div class="toolbar-left">
                <ElInput 
                    v-model="searchQuery" 
                    placeholder="搜索文件或文件夹..."
                    size="small"
                    class="search-input"
                >
                    <template #prefix>
                        <SvgIcon icon="mdi:search" size="16px" />
                    </template>
                </ElInput>
            </div>
            
            <div class="toolbar-right">
                <ElSelect 
                    v-model="viewMode" 
                    size="small"
                    class="view-select"
                >
                    <ElOption label="列表视图" value="list" />
                    <ElOption label="网格视图" value="grid" />
                </ElSelect>
                
                <ElSelect 
                    v-model="sortBy" 
                    size="small"
                    class="sort-select"
                >
                    <ElOption label="名称" value="name" />
                    <ElOption label="大小" value="size" />
                    <ElOption label="时间" value="time" />
                </ElSelect>
            </div>
        </div>

        <div class="fm-content">
            <div v-if="viewMode === 'list'" class="list-view">
                <div class="list-header">
                    <div class="col-checkbox">
                        <ElCheckbox 
                            :indeterminate="isIndeterminate"
                            v-model="selectAll"
                            @change="handleSelectAll"
                        />
                    </div>
                    <div class="col-name">名称</div>
                    <div class="col-size">大小</div>
                    <div class="col-date">修改时间</div>
                    <div class="col-actions">操作</div>
                </div>
                
                <ElCheckboxGroup v-model="selectedFiles">
                    <div 
                        v-for="item in filteredFiles" 
                        :key="item.key"
                        class="list-item"
                        :class="{ 'is-selected': selectedFiles.includes(item.key), 'is-folder': item.isFolder }"
                        @click="toggleSelect(item.key)"
                    >
                        <div class="col-checkbox">
                            <ElCheckbox :value="item.key" />
                        </div>
                    <div class="col-name" @dblclick.stop="item.isFolder && openFolder(item)">
                        <div class="file-icon" :class="getFileIcon(item)">
                            <SvgIcon :icon="getFileIcon(item)" size="24px" />
                        </div>
                        <template v-if="editingFolder === item.key">
                            <ElInput 
                                v-model="editingFolderName" 
                                size="small" 
                                class="rename-input"
                                @keyup.enter="confirmRename"
                                @keyup.escape="cancelRename"
                                @blur="confirmRename"
                                @click.stop
                            />
                        </template>
                        <template v-else>
                            <span class="file-name">{{ item.isFolder ? item.folderName : getFileName(item.key) }}</span>
                        </template>
                    </div>
                    <div class="col-size">{{ item.sizeFormat }}</div>
                    <div class="col-date">{{ item.lastModified }}</div>
                    <div class="col-actions">
                        <ElButton v-if="item.isFolder" size="small" @click.stop="openFolder(item)">打开</ElButton>
                        <template v-else>
                            <ElButton size="small" @click.stop="previewFile(item)">预览</ElButton>
                            <ElButton size="small" @click.stop="downloadFile(item)">下载</ElButton>
                        </template>
                        <ElButton size="small" @click.stop="item.isFolder ? startRename(item) : null">
                            重命名
                        </ElButton>
                        <ElButton size="small" type="danger" @click.stop="deleteFile(item)">删除</ElButton>
                    </div>
                </div>
                </ElCheckboxGroup>
            </div>

            <div v-else class="grid-view">
                <div 
                    v-for="item in filteredFiles" 
                    :key="item.key"
                    class="grid-item"
                    :class="{ 'is-selected': selectedFiles.includes(item.key), 'is-folder': item.isFolder }"
                    @click="toggleSelect(item.key)"
                    @dblclick="item.isFolder && openFolder(item)"
                >
                    <div class="grid-icon" :class="getFileIcon(item)">
                        <SvgIcon :icon="getFileIcon(item)" size="48px" />
                    </div>
                    <template v-if="editingFolder === item.key">
                        <ElInput 
                            v-model="editingFolderName" 
                            size="small" 
                            class="rename-input"
                            @keyup.enter="confirmRename"
                            @keyup.escape="cancelRename"
                            @blur="confirmRename"
                            @click.stop
                        />
                    </template>
                    <template v-else>
                        <div class="grid-name">{{ item.isFolder ? item.folderName : getFileName(item.key) }}</div>
                    </template>
                    <div class="grid-info">
                        <span>{{ item.sizeFormat }}</span>
                        <span>{{ item.lastModified }}</span>
                    </div>
                    <div class="grid-actions">
                        <ElButton v-if="item.isFolder" size="small" @click.stop="openFolder(item)">打开</ElButton>
                        <template v-else>
                            <ElButton size="small" @click.stop="previewFile(item)">预览</ElButton>
                            <ElButton size="small" @click.stop="downloadFile(item)">下载</ElButton>
                        </template>
                        <ElButton size="small" type="danger" @click.stop="deleteFile(item)">删除</ElButton>
                    </div>
                </div>
            </div>

            <div v-if="filteredFiles.length === 0" class="empty-state">
                <SvgIcon icon="mdi:folder-open" size="64px" />
                <p>暂无文件</p>
                <ElButton type="primary" @click="handleUpload">上传文件</ElButton>
            </div>
        </div>

        <div v-if="selectedFiles.length > 0" class="fm-footer">
            <span>已选择 {{ selectedFiles.length }} 个文件</span>
            <div class="footer-actions">
                <ElButton size="small" @click="downloadSelected">批量下载</ElButton>
                <ElButton size="small" type="danger" @click="deleteSelected">批量删除</ElButton>
            </div>
        </div>

        <ElDialog 
            v-model="showPreview" 
            title="文件预览" 
            width="800px"
        >
            <div v-if="previewFileData" class="preview-content">
                <img v-if="isImage(previewFileData)" :src="previewFileData.url" class="preview-image" />
                <div v-else class="preview-other">
                    <SvgIcon icon="mdi:file" size="64px" />
                    <p>{{ getFileName(previewFileData.key) }}</p>
                    <ElButton type="primary" @click="downloadFile(previewFileData)">下载查看</ElButton>
                </div>
            </div>
        </ElDialog>

        <ElDialog 
            v-model="showNewFolderDialog" 
            title="新建文件夹" 
            width="400px"
        >
            <div class="new-folder-content">
                <ElInput 
                    v-model="newFolderName" 
                    placeholder="请输入文件夹名称"
                    @keyup.enter="confirmCreateFolder"
                />
            </div>
            <template #footer>
                <ElButton @click="showNewFolderDialog = false">取消</ElButton>
                <ElButton type="primary" @click="confirmCreateFolder">确定</ElButton>
            </template>
        </ElDialog>

        <input 
            ref="uploadInput" 
            type="file" 
            multiple 
            class="upload-input"
            @change="handleFileSelect"
        />
    </div>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type CheckboxValueType } from 'element-plus'
import { R2FileService } from '@/api/r2FileApi'

interface FileItem {
    key: string
    url: string
    size: string
    sizeFormat: string
    lastModified: string
    isFolder: boolean
    folderName?: string
}

const router = useRouter()
const uploadInput = ref<HTMLInputElement | null>(null)
const files = ref<FileItem[]>([])
const searchQuery = ref('')
const viewMode = ref('list')
const sortBy = ref('name')
const selectedFiles = ref<string[]>([])
const showPreview = ref(false)
const previewFileData = ref<FileItem | null>(null)
const currentPath = ref('')
const showNewFolderDialog = ref(false)
const newFolderName = ref('')
const editingFolder = ref<string | null>(null)
const editingFolderName = ref('')

const breadcrumbs = computed(() => {
    const crumbs = [{ key: '', name: '全部文件' }]
    
    if (currentPath.value) {
        const parts = currentPath.value.split('/').filter(p => p)
        let path = ''
        parts.forEach((part, index) => {
            path += (index === 0 ? '' : '/') + part
            crumbs.push({ key: path, name: part })
        })
    }
    
    return crumbs
})

const currentItems = computed(() => {
    let result = files.value.filter(item => {
        const itemPath = item.isFolder ? item.key : getParentPath(item.key)
        return itemPath === currentPath.value
    })
    
    const folders = result.filter(item => item.isFolder)
    const regularFiles = result.filter(item => !item.isFolder)
    
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        return result.filter(item => {
            const name = item.isFolder ? item.folderName : getFileName(item.key)
            return name.toLowerCase().includes(query)
        })
    }
    
    const sortedFolders = sortItems(folders, true)
    const sortedFiles = sortItems(regularFiles, false)
    
    return [...sortedFolders, ...sortedFiles]
})

const sortItems = (items: FileItem[], isFolder: boolean): FileItem[] => {
    return [...items].sort((a, b) => {
        const nameA = isFolder ? a.folderName : getFileName(a.key)
        const nameB = isFolder ? b.folderName : getFileName(b.key)
        
        switch (sortBy.value) {
            case 'name':
                return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
            case 'size':
                return parseInt(a.size || '0') - parseInt(b.size || '0')
            case 'time':
                return new Date(b.lastModified || '').getTime() - new Date(a.lastModified || '').getTime()
            default:
                return 0
        }
    })
}

const filteredFiles = computed(() => currentItems.value)

const selectAll = computed({
    get: () => selectedFiles.value.length === currentItems.value.length && currentItems.value.length > 0,
    set: (val) => {
        if (val) {
            selectedFiles.value = currentItems.value.map(f => f.key)
        } else {
            selectedFiles.value = []
        }
    }
})

const isIndeterminate = computed(() => {
    return selectedFiles.value.length > 0 && selectedFiles.value.length < currentItems.value.length
})

const getParentPath = (key: string): string => {
    const lastSlash = key.lastIndexOf('/')
    return lastSlash > 0 ? key.substring(0, lastSlash) : ''
}

const getFileName = (key: string): string => {
    const parts = key.split('/')
    return parts[parts.length - 1] || key
}

const getFileIcon = (item: FileItem): string => {
    if (item.isFolder) {
        return 'mdi:folder'
    }
    
    const name = getFileName(item.key).toLowerCase()
    const extensions: Record<string, string> = {
        '.jpg': 'mdi:image',
        '.jpeg': 'mdi:image',
        '.png': 'mdi:image',
        '.gif': 'mdi:image',
        '.svg': 'mdi:image',
        '.pdf': 'mdi:file-pdf',
        '.doc': 'mdi:file-word',
        '.docx': 'mdi:file-word',
        '.xls': 'mdi:file-excel',
        '.xlsx': 'mdi:file-excel',
        '.ppt': 'mdi:file-powerpoint',
        '.pptx': 'mdi:file-powerpoint',
        '.txt': 'mdi:file-text',
        '.zip': 'mdi:archive',
        '.rar': 'mdi:archive',
        '.mp4': 'mdi:video',
        '.mp3': 'mdi:audio'
    }
    
    for (const [ext, icon] of Object.entries(extensions)) {
        if (name.endsWith(ext)) {
            return icon
        }
    }
    
    return 'mdi:file'
}

const isImage = (item: FileItem): boolean => {
    if (item.isFolder) return false
    const name = getFileName(item.key).toLowerCase()
    return ['.jpg', '.jpeg', '.png', '.gif', '.svg'].some(ext => name.endsWith(ext))
}

const toggleSelect = (key: string) => {
    const index = selectedFiles.value.indexOf(key)
    if (index > -1) {
        selectedFiles.value.splice(index, 1)
    } else {
        selectedFiles.value.push(key)
    }
}

const handleSelectAll = (val: CheckboxValueType) => {
    if (val) {
        selectedFiles.value = currentItems.value.map(f => f.key)
    } else {
        selectedFiles.value = []
    }
}

const handleUpload = () => {
    uploadInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const fileList = target.files
    if (!fileList) return
    
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (!file) continue
        try {
            await R2FileService.uploadR2File(file)
        } catch (error) {
            console.error('上传失败:', error)
        }
    }
    
    ElMessage.success('上传成功')
    await fetchFiles()
    target.value = ''
}

const showCreateFolderDialog = () => {
    newFolderName.value = ''
    showNewFolderDialog.value = true
}

const confirmCreateFolder = () => {
    if (!newFolderName.value.trim()) {
        ElMessage.warning('请输入文件夹名称')
        return
    }
    
    const newPath = currentPath.value 
        ? `${currentPath.value}/${newFolderName.value.trim()}`
        : newFolderName.value.trim()
    
    const exists = files.value.some(f => f.key === newPath)
    if (exists) {
        ElMessage.warning('文件夹已存在')
        return
    }
    
    const newFolder: FileItem = {
        key: newPath,
        url: '',
        size: '',
        sizeFormat: '-',
        lastModified: new Date().toLocaleString(),
        isFolder: true,
        folderName: newFolderName.value.trim()
    }
    
    files.value.push(newFolder)
    showNewFolderDialog.value = false
    ElMessage.success('文件夹创建成功')
}

const createFolder = showCreateFolderDialog

const navigateTo = (key: string) => {
    currentPath.value = key
    selectedFiles.value = []
}

const navigateToParent = () => {
    if (!currentPath.value) return
    const lastSlash = currentPath.value.lastIndexOf('/')
    currentPath.value = lastSlash > 0 ? currentPath.value.substring(0, lastSlash) : ''
}

const openFolder = (item: FileItem) => {
    if (!item.isFolder) return
    currentPath.value = item.key
    selectedFiles.value = []
}

const previewFile = (item: FileItem) => {
    if (item.isFolder) {
        openFolder(item)
        return
    }
    previewFileData.value = item
    showPreview.value = true
}

const downloadFile = (item: FileItem) => {
    if (item.isFolder) return
    const link = document.createElement('a')
    link.href = item.url
    link.download = getFileName(item.key)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const deleteFile = async (item: FileItem) => {
    if (item.isFolder) {
        const childKeys = files.value
            .filter(f => f.key.startsWith(item.key + '/'))
            .map(f => f.key)
        
        const keysToDelete = [item.key, ...childKeys]
        files.value = files.value.filter(f => !keysToDelete.includes(f.key))
        ElMessage.success('删除成功')
    } else {
        files.value = files.value.filter(f => f.key !== item.key)
        ElMessage.success('删除成功')
    }
    selectedFiles.value = selectedFiles.value.filter(k => k !== item.key)
}

const downloadSelected = () => {
    selectedFiles.value.forEach(key => {
        const item = files.value.find(f => f.key === key)
        if (item && !item.isFolder) {
            downloadFile(item)
        }
    })
}

const deleteSelected = async () => {
    const folderKeys = selectedFiles.value.filter(key => {
        const item = files.value.find(f => f.key === key)
        return item?.isFolder
    })
    
    folderKeys.forEach(folderKey => {
        const childKeys = files.value
            .filter(f => f.key.startsWith(folderKey + '/'))
            .map(f => f.key)
        files.value = files.value.filter(f => ![folderKey, ...childKeys].includes(f.key))
    })
    
    files.value = files.value.filter(f => !selectedFiles.value.includes(f.key))
    ElMessage.success('批量删除成功')
    selectedFiles.value = []
}

const startRename = (item: FileItem) => {
    if (!item.isFolder) return
    editingFolder.value = item.key
    editingFolderName.value = item.folderName || ''
}

const confirmRename = () => {
    if (!editingFolder.value) return
    
    const folder = files.value.find(f => f.key === editingFolder.value)
    if (!folder) return
    
    if (!editingFolderName.value.trim()) {
        ElMessage.warning('文件夹名称不能为空')
        return
    }
    
    const oldPath = editingFolder.value
    const parentPath = getParentPath(oldPath)
    const newPath = parentPath ? `${parentPath}/${editingFolderName.value.trim()}` : editingFolderName.value.trim()
    
    const exists = files.value.some(f => f.key === newPath && f.key !== oldPath)
    if (exists) {
        ElMessage.warning('文件夹名称已存在')
        return
    }
    
    const oldPrefix = oldPath + '/'
    files.value.forEach(f => {
        if (f.key === oldPath) {
            f.key = newPath
            f.folderName = editingFolderName.value.trim()
        } else if (f.key.startsWith(oldPrefix)) {
            f.key = newPath + f.key.substring(oldPath.length)
        }
    })
    
    if (currentPath.value === oldPath) {
        currentPath.value = newPath
    }
    
    editingFolder.value = null
    editingFolderName.value = ''
    ElMessage.success('重命名成功')
}

const cancelRename = () => {
    editingFolder.value = null
    editingFolderName.value = ''
}

const mockFiles: FileItem[] = [
    {
        key: 'documents',
        url: '',
        size: '',
        sizeFormat: '-',
        lastModified: '2024-01-15 14:30:00',
        isFolder: true,
        folderName: 'documents'
    },
    {
        key: 'images',
        url: '',
        size: '',
        sizeFormat: '-',
        lastModified: '2024-01-14 09:15:00',
        isFolder: true,
        folderName: 'images'
    },
    {
        key: 'documents/report.pdf',
        url: '#',
        size: '2048000',
        sizeFormat: '2.0 MB',
        lastModified: '2024-01-15 14:30:00',
        isFolder: false
    },
    {
        key: 'images/photo.jpg',
        url: 'https://picsum.photos/800/600',
        size: '1024000',
        sizeFormat: '1.0 MB',
        lastModified: '2024-01-14 09:15:00',
        isFolder: false
    },
    {
        key: 'documents/meeting-notes.docx',
        url: '#',
        size: '512000',
        sizeFormat: '512 KB',
        lastModified: '2024-01-13 16:45:00',
        isFolder: false
    },
    {
        key: 'images/banner.png',
        url: 'https://picsum.photos/1200/400',
        size: '1536000',
        sizeFormat: '1.5 MB',
        lastModified: '2024-01-11 10:00:00',
        isFolder: false
    },
    {
        key: 'documents/presentation.pptx',
        url: '#',
        size: '5120000',
        sizeFormat: '5.0 MB',
        lastModified: '2024-01-10 15:30:00',
        isFolder: false
    },
    {
        key: 'archives',
        url: '',
        size: '',
        sizeFormat: '-',
        lastModified: '2024-01-09 08:00:00',
        isFolder: true,
        folderName: 'archives'
    },
    {
        key: 'archives/backup.zip',
        url: '#',
        size: '10240000',
        sizeFormat: '10 MB',
        lastModified: '2024-01-09 08:00:00',
        isFolder: false
    },
    {
        key: 'videos',
        url: '',
        size: '',
        sizeFormat: '-',
        lastModified: '2024-01-08 17:20:00',
        isFolder: true,
        folderName: 'videos'
    },
    {
        key: 'videos/tutorial.mp4',
        url: '#',
        size: '50240000',
        sizeFormat: '50 MB',
        lastModified: '2024-01-08 17:20:00',
        isFolder: false
    },
    {
        key: 'data',
        url: '',
        size: '',
        sizeFormat: '-',
        lastModified: '2024-01-07 14:00:00',
        isFolder: true,
        folderName: 'data'
    },
    {
        key: 'data/sales-report.xlsx',
        url: '#',
        size: '3072000',
        sizeFormat: '3.0 MB',
        lastModified: '2024-01-12 11:20:00',
        isFolder: false
    },
    {
        key: 'data/config.txt',
        url: '#',
        size: '1024',
        sizeFormat: '1 KB',
        lastModified: '2024-01-07 14:00:00',
        isFolder: false
    },
    {
        key: 'images/icon.svg',
        url: '#',
        size: '4096',
        sizeFormat: '4 KB',
        lastModified: '2024-01-06 09:30:00',
        isFolder: false
    }
]

const fetchFiles = async () => {
    files.value = mockFiles
}

fetchFiles()
</script>

<style lang="scss" scoped>
.file-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
}

.fm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--card-color);
    border-bottom: 1px solid var(--border-color);
}

.fm-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
}

.breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-color);
    font-size: 14px;

    &:hover {
        background: var(--hover-bg-color);
    }

    &.is-active {
        font-weight: 500;
    }
}

.fm-actions {
    display: flex;
    gap: 12px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
}

.fm-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--card-color);
    border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
    flex: 1;
    max-width: 300px;
}

.search-input {
    width: 100%;
}

.toolbar-right {
    display: flex;
    gap: 12px;
}

.view-select,
.sort-select {
    width: 120px;
}

.fm-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.list-view {
    background: var(--card-color);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.list-header {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background: var(--hover-bg-color);
    font-weight: 500;
    font-size: 13px;
    color: var(--text-color);
}

.col-checkbox,
.col-name,
.col-size,
.col-date,
.col-actions {
    display: flex;
    align-items: center;
}

.col-checkbox {
    width: 40px;
}

.col-name {
    flex: 1;
    min-width: 200px;
}

.col-size {
    width: 100px;
    text-align: right;
}

.col-date {
    width: 180px;
    text-align: right;
}

.col-actions {
    width: 180px;
    justify-content: flex-end;
    gap: 8px;
}

.list-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: var(--hover-bg-color);
    }

    &.is-selected {
        background: var(--el-color-primary-light-9);
    }

    .file-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);

        &.mdi-folder {
            color: #FFB347;
            background: rgba(255, 179, 71, 0.2);
        }

        &.mdi-image {
            color: #4ECDC4;
            background: rgba(78, 205, 196, 0.2);
        }

        &.mdi-file-pdf {
            color: #FF6B6B;
            background: rgba(255, 107, 107, 0.2);
        }

        &.mdi-file-word {
            color: #4169E1;
            background: rgba(65, 105, 225, 0.2);
        }

        &.mdi-file-excel {
            color: #32CD32;
            background: rgba(50, 205, 50, 0.2);
        }

        &.mdi-file-powerpoint {
            color: #FFA500;
            background: rgba(255, 165, 0, 0.2);
        }

        &.mdi-video {
            color: #9B59B6;
            background: rgba(155, 89, 182, 0.2);
        }

        &.mdi-audio {
            color: #E74C3C;
            background: rgba(231, 76, 60, 0.2);
        }

        &.mdi-archive {
            color: #F39C12;
            background: rgba(243, 156, 18, 0.2);
        }
    }

    .file-name {
        font-size: 14px;
        color: var(--text-color);
    }

    &.is-folder {
        .file-icon {
            &.mdi-folder {
                color: #FFB347;
                background: rgba(255, 179, 71, 0.2);
            }
        }
    }
}

.rename-input {
    width: 200px;
}

.grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.grid-item {
    background: var(--card-color);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        border-color: var(--el-color-primary);
    }

    &.is-selected {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
    }

    .grid-icon {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);

        &.mdi-folder {
            color: #FFB347;
            background: rgba(255, 179, 71, 0.2);
        }

        &.mdi-image {
            color: #4ECDC4;
            background: rgba(78, 205, 196, 0.2);
        }

        &.mdi-file-pdf {
            color: #FF6B6B;
            background: rgba(255, 107, 107, 0.2);
        }

        &.mdi-file-word {
            color: #4169E1;
            background: rgba(65, 105, 225, 0.2);
        }

        &.mdi-file-excel {
            color: #32CD32;
            background: rgba(50, 205, 50, 0.2);
        }

        &.mdi-file-powerpoint {
            color: #FFA500;
            background: rgba(255, 165, 0, 0.2);
        }

        &.mdi-video {
            color: #9B59B6;
            background: rgba(155, 89, 182, 0.2);
        }

        &.mdi-audio {
            color: #E74C3C;
            background: rgba(231, 76, 60, 0.2);
        }

        &.mdi-archive {
            color: #F39C12;
            background: rgba(243, 156, 18, 0.2);
        }
    }

    .grid-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: 8px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .grid-info {
        font-size: 12px;
        color: var(--text-color-secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        margin-bottom: 12px;
    }

    .grid-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.2s;

        & button {
            padding: 4px 8px;
            font-size: 12px;
        }
    }

    &:hover .grid-actions {
        opacity: 1;
    }

    &.is-folder {
        .grid-icon {
            &.mdi-folder {
                color: #FFB347;
                background: rgba(255, 179, 71, 0.2);
            }
        }
    }
}

.new-folder-content {
    padding: 20px 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-color-secondary);

    svg {
        margin-bottom: 16px;
        opacity: 0.5;
    }

    p {
        margin-bottom: 20px;
        font-size: 14px;
    }
}

.fm-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--card-color);
    border-top: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--text-color);
}

.footer-actions {
    display: flex;
    gap: 12px;
}

.preview-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

.preview-image {
    max-width: 100%;
    max-height: 500px;
    border-radius: 8px;
}

.preview-other {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    color: var(--text-color-secondary);

    svg {
        margin-bottom: 16px;
        opacity: 0.5;
    }

    p {
        margin-bottom: 20px;
        font-size: 14px;
    }
}

.upload-input {
    display: none;
}
</style>