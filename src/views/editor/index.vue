<template>
    <div class="editor">
        <EditorHeader 
            :status="formData.status"
            :draft-count="draftCount"
            @open-drawer="handleDrawer"
            @save-draft="handleDraft"
            @publish="handlePublish"
        />

        <EditorForm 
            ref="editorFormRef"
            v-model="formData"
            :selected-tags="selectTagList"
            @open-tag-dialog="dialogVisible = true"
            @cover-success="handleCoverSuccess"
        />

        <TagDialog 
            v-model="dialogVisible"
            v-model:selected-tags="selectTagList"
            @update:tag-ids="handleTagIdsUpdate"
        />

        <DraftDrawer v-model="drawer" />
    </div>
</template>

<script setup lang='ts'>
import { ElMessage, ElMessageBox } from "element-plus"
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router"
import { ArticleService } from "@/api/articleApi"
import { R2FileService } from "@/api/r2FileApi"
import _ from 'lodash'

import EditorHeader from './widget/EditorHeader.vue'
import EditorForm from './widget/EditorForm.vue'
import TagDialog from './widget/TagDialog.vue'
import DraftDrawer from './widget/DraftDrawer.vue'

type Article = Api.Article.ArticleInfo
type ArticleDetail = Api.Article.ArticleDetailInfo
type Tag = Api.Tag.TagInfo

const router = useRouter()
const route = useRoute()

const editorFormRef = ref<InstanceType<typeof EditorForm>>()
const dialogVisible = ref<boolean>(false)
const drawer = ref<boolean>(false)

const selectTagList = ref<Tag[]>([])
const originImageList = ref<string[]>([])
const uploadImageList = ref<string[]>([])
const hasUnsavedChanges = ref(false)
const tempCoverList = ref<string[]>([])
const draftCount = ref<number>(0)

const formData = reactive<Article>({
    title: "",
    cover: "",
    description: "",
    content: "",
    status: 'DRAFT',
    tags: []
})

const originalData = ref<Article>({
    title: "",
    cover: "",
    description: "",
    content: "",
    status: 'DRAFT',
    tags: []
})

const checkDirty = () => {
    const orig = originalData.value
    const cur = formData
    hasUnsavedChanges.value =
        orig.title !== cur.title ||
        orig.cover !== cur.cover ||
        orig.description !== cur.description ||
        orig.content !== cur.content ||
        orig.status !== cur.status ||
        JSON.stringify(orig.tags) !== JSON.stringify(cur.tags)
}

watch(
    () => [formData.title, formData.cover, formData.description, formData.content, formData.status, formData.tags],
    () => checkDirty(),
)

onBeforeRouteLeave((to, from) => {
    if (hasUnsavedChanges.value) {
        return ElMessageBox.confirm(
            '当前内容尚未保存，确定要离开吗？未保存的内容将会丢失。',
            '提示',
            {
                confirmButtonText: '离开（不保存）',
                cancelButtonText: '取消',
                type: 'warning',
                appendTo: document.body,
            }
        ).then(() => true).catch(() => false)
    } else {
        return true
    }
})

const getUrlKey = (urlList: string[]) => urlList.map((url: string) => new URL(url).pathname)

const getdraftCount = async () => {
    draftCount.value = await ArticleService.getDraftCount()
}

const delImages = () => {
    const editorImages = editorFormRef.value?.getElemsByType('image')
        .map((item: any) => item.src).filter(Boolean) || []
    const allImages = [...originImageList.value, ...uploadImageList.value]
    const unused = allImages.filter(url => !editorImages.includes(url))
    if (unused.length > 0) {
        R2FileService.batchDelR2File(getUrlKey(unused))
    }
}

const saveOrPublish = async () => {
    if (formData.articleId) {
        await ArticleService.updateArticle(formData)
        ElMessage.success('修改成功')
    } else {
        await ArticleService.addArticle(formData)
        ElMessage.success('提交成功')
    }
    originalData.value = {
        title: formData.title,
        cover: formData.cover,
        description: formData.description,
        content: formData.content,
        status: formData.status,
        tags: formData.tags ? [...formData.tags] : []
    }
    hasUnsavedChanges.value = false
}

const handleDraft = async () => {
    formData.status = 'DRAFT'
    await saveOrPublish()
}

const handlePublish = async () => {
    formData.status = 'PUBLISH'
    await saveOrPublish()
    delImages()
    if (tempCoverList.value.length > 0) {
        R2FileService.batchDelR2File(tempCoverList.value)
    }
    router.back()
}

const handleDrawer = () => {
    drawer.value = true
}

const handleCoverSuccess = (key: string) => {
    tempCoverList.value.push(key)
}

const handleTagIdsUpdate = (tagIds: number[]) => {
    formData.tags = tagIds
}

const getArticleById = async () => {
    if (route.name === 'Editor' && route.params.id) {
        const article: ArticleDetail = await ArticleService.getArticleWithTagById(
            Number(route.params.id)
        )
        Object.assign(formData, {
            ...article,
            description: article.description || ''
        })
        selectTagList.value = []
        await nextTick()
        originalData.value = {
            title: formData.title,
            cover: formData.cover,
            description: formData.description,
            content: formData.content,
            status: formData.status,
            tags: formData.tags ? [...formData.tags] : []
        }
        
        const imageElements = editorFormRef.value?.getElemsByType('image')
        originImageList.value = _.map(imageElements, 'src')

        if (article.tagIds && article.tagNames) {
            const tagIdArr = article.tagIds.split(',')
            const tagNameArr = article.tagNames.split(',')
            const tagColorArr = article.tagColors.split(',')

            const tagList = tagIdArr.map((tid, i) => ({
                tagId: Number(tid),
                tagName: tagNameArr[i] || '',
                color: tagColorArr[i] || ''
            }))

            selectTagList.value = tagList
            formData.tags = tagList.map(t => t.tagId!)
        }
        ElMessage.success('加载文章成功')
    }
}

onMounted(() => {
    getArticleById()
    getdraftCount()
})

onBeforeUnmount(() => {
    delImages()
    if (tempCoverList.value.length != 0) {
        R2FileService.batchDelR2File(tempCoverList.value)
    }
})
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
