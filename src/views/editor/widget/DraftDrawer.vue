<template>
    <ElDrawer 
        class="draft-drawer" 
        v-model="visible" 
        title="暂存箱"
        :with-header="true" 
        :close-on-click-modal="true"
        :close-on-press-escape="true" 
        direction="rtl" 
        :size="380"
        @open="handleOpen"
    >
        <template #header>
            <div class="drawer-custom-header">
                <span class="drawer-title">📦 暂存箱 · 草稿列表</span>
                <span class="drawer-count" v-if="draftList.length">
                    共 {{ draftList.length }} 条
                </span>
            </div>
        </template>
        <div class="drawer-body">
            <div v-if="draftList.length === 0" class="empty-draft">
                📭 暂无草稿，保存草稿后将显示在这里
            </div>
            <div v-else class="draft-list">
                <div 
                    v-for="draft in draftList" 
                    :key="draft.articleId"
                    class="draft-item"
                >
                    <div class="draft-cover">
                        <img 
                            v-if="draft.cover" 
                            :src="draft.cover"
                            class="draft-cover-img" 
                            alt="封面"
                        >
                        <div v-else class="draft-cover-placeholder">📄</div>
                    </div>
                    <div class="draft-info">
                        <div class="draft-title">
                            {{ draft.title || '无标题草稿' }}
                        </div>
                        <div class="draft-desc">
                            {{ (draft.description || '暂无摘要').slice(0, 80) }}
                        </div>
                        <div class="draft-time">
                            🕒 更新于 {{ draft.updatedTime }}
                        </div>
                    </div>
                    <div class="draft-actions">
                        <ElButton 
                            text 
                            type="danger" 
                            size="small"
                            class="delete-btn"
                            @click="handleDelete(draft)"
                        >
                            🗑️
                        </ElButton>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="drawer-footer-tip">
                最多存储 <strong>10</strong> 条草稿，点击草稿可快速加载编辑
            </div>
        </template>
    </ElDrawer>
</template>

<script setup lang='ts'>
import { ElMessageBox, ElMessage } from "element-plus"
import { ArticleService } from "@/api/articleApi"

type Article = Api.Article.ArticleInfo

const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const draftList = ref<Article[]>([])
const draftLoaded = ref<boolean>(false)

const getArticleDraftList = async () => {
    const data = await ArticleService.getTop10List({
        status: 'DRAFT'
    })
    draftList.value = data
}

const handleOpen = async () => {
    if (!draftLoaded.value) {
        await getArticleDraftList()
        draftLoaded.value = true
    }
}

const handleDelete = async (article: Article) => {
    if (!article.articleId) {
        ElMessage.warning('无效的文章ID')
        return
    }
    try {
        await ElMessageBox.confirm('确定要删除该文章吗？删除后无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            appendTo: document.body,
        })

        await ArticleService.delArticle(article.articleId)
        ElMessage.success('删除成功')
        draftLoaded.value = false
        getArticleDraftList()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
</script>

<style lang="scss" scoped>
.drawer-custom-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.drawer-title {
    font-size: 16px;
    font-weight: 600;
}

.drawer-count {
    font-size: 13px;
    color: var(--text-color-secondary);
}

.drawer-body {
    padding: 0 4px;
}

.empty-draft {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-color-secondary);
    font-size: 14px;
}

.draft-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.draft-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--hover-bg-color);
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: var(--border-color);
    }
}

.draft-cover {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
}

.draft-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.draft-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border-color);
    font-size: 24px;
}

.draft-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.draft-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.draft-desc {
    font-size: 12px;
    color: var(--text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.draft-time {
    font-size: 11px;
    color: var(--text-color-secondary);
}

.draft-actions {
    display: flex;
    align-items: center;
}

.delete-btn {
    padding: 4px;
}

.drawer-footer-tip {
    font-size: 12px;
    color: var(--text-color-secondary);
    text-align: center;
}
</style>
