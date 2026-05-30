<!-- FileHeader.vue -->
<template>
    <div class="file-header">
        <div class="fm-header">
            <div class="fm-breadcrumb">
                <div v-for="(item, index) in breadcrumbs" :key="item.key"
                    class="breadcrumb-item"
                    :class="{ 'is-active': index === breadcrumbs.length - 1 }"
                    @click="handleNavigate(item.key, index)">
                    <SvgIcon v-if="index === 0" icon="mdi:folder-home" size="16px" />
                    <SvgIcon v-else-if="index > 0 && index === breadcrumbs.length - 1" 
                        icon="mdi:folder" size="16px" />
                    <span>{{ item.name }}</span>
                    <SvgIcon v-if="index < breadcrumbs.length - 1"
                        icon="mdi:chevron-right" size="14px" />
                </div>
            </div>

            <div class="fm-actions">
                <ElButton type="primary" size="small" class="action-btn" @click="handleUpload">
                    <SvgIcon icon="mdi:upload" size="16px" />
                    上传文件
                </ElButton>
                <ElButton size="small" class="action-btn" @click="handleCreateFolder">
                    <SvgIcon icon="mdi:folder-plus" size="16px" />
                    新建文件夹
                </ElButton>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
interface BreadcrumbItem {
    key: string
    name: string
}

interface Props {
    breadcrumbs: BreadcrumbItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'navigateTo', key: string): void
    (e: 'upload'): void
    (e: 'createFolder'): void
}>()

const handleNavigate = (key: string, index: number) => {
    // 如果点击的是当前激活项，不触发导航
    if (index === props.breadcrumbs.length - 1) return
    emit('navigateTo', key)
}

const handleUpload = () => {
    emit('upload')
}

const handleCreateFolder = () => {
    emit('createFolder')
}
</script>

<style lang="scss" scoped>
.file-header {
    margin-bottom: 16px;
}

.fm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--card-color, #fff);
    border-radius: 8px;
    border: 1px solid var(--border-color, #e4e7ed);
    margin-bottom: 12px;
}

.fm-breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;

    .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        color: #606266;
        transition: all 0.2s;
        font-size: 14px;

        &:hover {
            color: #409EFF;
        }

        &.is-active {
            color: #303133;
            font-weight: 500;
            cursor: default;

            &:hover {
                color: #303133;
            }
        }
    }
}

.fm-actions {
    display: flex;
    gap: 8px;

    .action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
    }
}
</style>