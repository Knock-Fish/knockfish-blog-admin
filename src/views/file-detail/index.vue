<template>
    <div class="page">
        <div class="detail-container">
            <div class="back-bar">
                <ElButton @click="router.back()" size="small">
                    <SvgIcon icon="mdi:arrow-left" size="16px" />
                    返回
                </ElButton>
            </div>

            <div v-if="loading" class="loading-state">
                <ElSkeleton :rows="5" animated />
            </div>

            <template v-else-if="file">
                <div class="file-card">
                    <div class="file-icon-wrapper">
                        <SvgIcon :icon="getFileIcon(file?.key)" size="64px" class="file-icon" />
                    </div>
                    
                    <div class="file-info">
                        <h2 class="file-name">{{ getFileName(file?.key) }}</h2>
                        <div class="file-meta">
                            <span class="meta-item">
                                <SvgIcon icon="mdi:folder-outline" size="16px" />
                                {{ file?.sizeFormat || '-' }}
                            </span>
                            <span class="meta-item">
                                <SvgIcon icon="mdi:clock-outline" size="16px" />
                                {{ dayjs(file?.lastModified).format('YYYY-MM-DD HH:mm:ss') }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3 class="section-title">文件信息</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">路径</span>
                            <span class="info-value path-value">{{ file?.key }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">文件大小</span>
                            <span class="info-value">{{ file?.sizeFormat || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">最后修改</span>
                            <span class="info-value">{{ dayjs(file?.lastModified).format('YYYY-MM-DD HH:mm:ss') }}</span>
                        </div>
                        <div class="info-item full-width">
                            <span class="info-label">URL</span>
                            <div class="url-wrapper">
                                <span class="info-value url-value">{{ file?.url }}</span>
                                <ElButton 
                                    size="small" 
                                    @click="copyUrl"
                                    :disabled="!file?.url"
                                >
                                    <SvgIcon v-if="!copied" icon="mdi:content-copy" size="14px" />
                                    <SvgIcon v-else icon="mdi:check" size="14px" />
                                    {{ copied ? '已复制' : '复制' }}
                                </ElButton>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="file?.url" class="preview-section">
                    <h3 class="section-title">文件预览</h3>
                    <div class="preview-wrapper">
                        <img 
                            v-if="isImageFile(file?.key)" 
                            :src="file?.url" 
                            :alt="file?.key"
                            class="preview-image"
                        />
                        <div v-else class="preview-placeholder">
                            <SvgIcon :icon="getFileIcon(file?.key)" size="48px" />
                            <span>暂无预览</span>
                        </div>
                    </div>
                </div>
            </template>

            <ElEmpty v-else description="未找到文件信息" />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { R2FileService } from '@/api/r2FileApi'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

type R2File = Api.R2File.R2FileInfo

const router = useRouter()
const route = useRoute()
const file = ref<R2File>()
const loading = ref(false)
const copied = ref(false)

const getFileByKey = async () => {
    loading.value = true
    const key = route.params.key as string
    if (route.name === 'FileDetail' && key) {
        try {
            const fileInfo: R2File = await R2FileService.getFileInfo({ key })
            file.value = fileInfo
        } catch (error) {
            console.error('获取文件信息失败:', error)
        }
    }
    loading.value = false
}

const getFileName = (key?: string) => {
    if (!key) return '-'
    return key.split('/').pop() || key
}

const getFileIcon = (key?: string) => {
    if (!key) return 'mdi:file-outline'
    const ext = key.split('.').pop()?.toLowerCase() || ''
    
    const iconMap: Record<string, string> = {
        jpg: 'mdi:file-image',
        jpeg: 'mdi:file-image',
        png: 'mdi:file-image',
        webp: 'mdi:file-image',
        gif: 'mdi:file-image',
        mp4: 'mdi:file-video',
        mov: 'mdi:file-video',
        avi: 'mdi:file-video',
        pdf: 'mdi:file-pdf-box',
        doc: 'mdi:file-word',
        docx: 'mdi:file-word',
        xls: 'mdi:file-excel',
        xlsx: 'mdi:file-excel',
        ppt: 'mdi:file-powerpoint',
        pptx: 'mdi:file-powerpoint',
        zip: 'mdi:folder-zip',
        rar: 'mdi:folder-zip',
        '7z': 'mdi:folder-zip',
        txt: 'mdi:file-document-outline',
        md: 'mdi:language-markdown'
    }
    
    return iconMap[ext] || 'mdi:file-outline'
}

const isImageFile = (key?: string) => {
    if (!key) return false
    const ext = key.split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
}

const copyUrl = async () => {
    if (!file.value?.url) return
    try {
        await navigator.clipboard.writeText(file.value.url)
        copied.value = true
        ElMessage.success('链接已复制到剪贴板')
        setTimeout(() => {
            copied.value = false
        }, 2000)
    } catch (error) {
        ElMessage.error('复制失败')
    }
}

onMounted(() => {
    getFileByKey()
})
</script>

<style lang="scss" scoped>
.page {
    @include page;
}

.detail-container {
    max-width: 900px;
    margin: 0 auto;
}

.back-bar {
    margin-bottom: 20px;
}

.loading-state {
    background: var(--card-color);
    border-radius: 8px;
    padding: 20px;
}

.file-card {
    background: var(--card-color);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
}

.file-icon-wrapper {
    width: 100px;
    height: 100px;
    background: var(--hover-bg-color);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.file-icon {
    color: var(--primary-color);
}

.file-info {
    flex: 1;
    min-width: 0;
}

.file-name {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 12px 0;
    word-break: break-all;
}

.file-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--text-color-secondary);
}

.info-section,
.preview-section {
    background: var(--card-color);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &.full-width {
        grid-column: 1 / -1;
    }
}

.info-label {
    font-size: 13px;
    color: var(--text-color-secondary);
}

.info-value {
    font-size: 14px;
    color: var(--text-color);
    word-break: break-all;

    &.path-value {
        font-family: monospace;
        background: var(--hover-bg-color);
        padding: 8px 12px;
        border-radius: 6px;
    }
}

.url-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.url-value {
    flex: 1;
    min-width: 200px;
    font-family: monospace;
    background: var(--hover-bg-color);
    padding: 8px 12px;
    border-radius: 6px;
}

.preview-wrapper {
    background: var(--hover-bg-color);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.preview-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
}

.preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    color: var(--text-color-secondary);
}

@media (max-width: 768px) {
    .file-card {
        flex-direction: column;
        text-align: center;
    }

    .file-meta {
        justify-content: center;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .url-wrapper {
        flex-direction: column;
        align-items: stretch;
    }

    .url-value {
        min-width: unset;
    }
}
</style>