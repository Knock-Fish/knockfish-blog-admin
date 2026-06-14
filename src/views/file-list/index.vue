<template>
    <div class="page">
        <FileHeader :breadcrumbs="breadcrumbs" @navigate-to="navigateTo" />
        <PageTable class="table" :pagination="false" :columns="columns"
            :table-data="tableData" :loading="loading" @row-click="handleRowClick">
            <template #file="{ row }">
                <div class="col-name">
                    <div class="file-icon">
                        <SvgIcon :icon="getFileIcon(row)" size="24px" />
                    </div>
                    <div class="file-info">
                        <p>{{ getFileName(row.key) }}</p>
                        <p v-if="row.lastModified">
                            {{
                                dayjs(row.lastModified).format('YYYY-MM-DD HH:mm:ss')
                            }}&nbsp;&nbsp;&nbsp;{{
                                row.sizeFormat
                            }}
                        </p>
                    </div>
                </div>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { R2FileService } from '@/api/r2FileApi'
import dayjs from 'dayjs'
import FileHeader from './widget/FileHeader.vue'

type R2File = Api.R2File.R2FileInfo
interface R2FileTree extends R2File {
  children?: R2FileTree[]
}

const currentPath = ref('')
const tableData = ref<R2FileTree[]>([])
const fileTreeCache = ref<R2FileTree[]>([]) // 缓存用
const loading = ref(true)
const router = useRouter()
const columns = ref([
    { type: 'selection' },
    { label: '名称', slot: 'file', align: "left" }
])

// 面包屑
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

const navigateTo = (key: string) => {
    currentPath.value = key === '' ? '' : key + '/'
    getR2FileList()
}

const handleRowClick = (row: any) => {
    if (row.lastModified == null) {
        currentPath.value = row.key
        getR2FileList()
        return
    }
    router.push({
        name: "FileDetail",
        params: {
            key: row.key
        }
    })
}

const getFileName = (key: string): string => {
    const parts = key.split('/').filter(p => p)
    return parts.length > 0 ? parts.pop()! : key
}

const getFileIcon = (item: R2FileTree): string => {
    if (item.sizeFormat === '-') {
        return 'mdi:folder'
    }
    
    const extensions: Record<string, string> = {
        '.jpg': 'mdi:image', '.jpeg': 'mdi:image', '.webp': "mdi:image",
        '.png': 'mdi:image', '.gif': 'mdi:image', '.svg': 'mdi:image',
        '.pdf': 'mdi:file-pdf', '.doc': 'mdi:file-word', '.docx': 'mdi:file-word',
        '.xls': 'mdi:file-excel', '.xlsx': 'mdi:file-excel',
        '.ppt': 'mdi:file-powerpoint', '.pptx': 'mdi:file-powerpoint',
        '.txt': 'mdi:file-text', '.zip': 'mdi:archive', '.rar': 'mdi:archive',
        '.mp4': 'mdi:video', '.mp3': 'mdi:audio'
    }

    for (const [ext, icon] of Object.entries(extensions)) {
        if (item.key.endsWith(ext)) return icon
    }
    return 'mdi:file'
}

// 获取文件列表 + 缓存
const findFolderInTree = (key: string, list: R2FileTree[]): R2FileTree | null => {
  for (const item of list) {
    if (item.key === key) return item
    if (item.children?.length) {
      const res = findFolderInTree(key, item.children)
      if (res) return res
    }
  }
  return null
}

const getR2FileList = async () => {
  loading.value = true
  try {
    // 查缓存
    if (!currentPath.value) {
      if (fileTreeCache.value.length) {
        tableData.value = fileTreeCache.value
        return
      }
    } else {
      const folder = findFolderInTree(currentPath.value, fileTreeCache.value)
      if (folder?.children) {
        tableData.value = folder.children
        return
      }
    }

    // 请求数据
    const data = await R2FileService.getR2FilePrefixList({ prefix: currentPath.value })
    const list = data as R2FileTree[]

    // 存入缓存
    if (!currentPath.value) {
      fileTreeCache.value = list
    } else {
      const parent = findFolderInTree(currentPath.value, fileTreeCache.value)
      if (parent) parent.children = list
    }

    // 渲染
    tableData.value = list
  } finally {
    loading.value = false
  }
}

onMounted(() => {
    getR2FileList()
})
</script>

<style lang="scss" scoped>
.page {
    @include page;
    .table {
        .col-name {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            cursor: pointer;

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
            }

            .file-info {
                min-height: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                
                p {
                    margin: 0;
                    
                    &:first-child {
                        font-weight: 500;
                        margin-bottom: 4px;
                    }
                    
                    &:last-child {
                        font-size: 12px;
                        color: var(--el-text-color-secondary);
                    }
                }
            }
        }
    }
}
</style>
