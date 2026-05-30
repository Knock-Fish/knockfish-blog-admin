<template>
    <div class="editor">
        <ElPageHeader icon="" title="返回" @back="onBack">
            <template #icon>
                <SvgIcon icon="mdi:arrow-left-bold" />
            </template>
            <template #content>
                <span style="font-size: 14px;">
                    稿件状态：
                    <ElTag
                        :type="formData.status === 'PUBLISH' ? 'success' : 'info'">
                        {{ formData.status === 'PUBLISH' ? '已发布' : '草稿' }}
                    </ElTag>
                </span>
            </template>
            <template #extra>
                <div class="flex items-center">
                    <ElBadge :value="draftCount" :show-zero="false"
                        style="margin-right: 12px;">
                        <ElButton @click="handleDrawer">
                            暂存箱
                        </ElButton>
                    </ElBadge>
                    <ElButton @click="handleDraft">保存草稿</ElButton>
                    <ElButton type="primary" @click="handlePublish">立即发布
                    </ElButton>
                </div>
            </template>
        </ElPageHeader>
        <div class="form-content">
            <ElForm :model="formData">
                <div class="form-wrap">
                    <h2>发布设置</h2>
                    <ElFormItem label="标题">
                        <ElInput class="input" v-model="formData.title"
                            placeholder="请输入文章标题（最多100个字符）" />
                    </ElFormItem>
                    <div class="section-row">
                        <div class="left-section">
                            <!-- 图片上传 -->
                            <ElFormItem label="封面">
                                <Upload v-model="formData.cover"
                                    :props="uploadProps" text="请上传封面"
                                    @success="handleSuccess" />
                            </ElFormItem>
                        </div>
                        <div class="right-section">
                            <ElFormItem label="标签">
                                <div>
                                    <ElButton round size="small"
                                        @click="dialogVisible = !dialogVisible">
                                        <SvgIcon icon="mdi:tag-plus-outline">
                                            添加标签
                                        </SvgIcon>
                                    </ElButton>
                                    <div style="margin-top: 10px;">
                                        <ElSpace wrap
                                            v-if="selectTagList?.length">
                                            <ElTag :color="tag.color"
                                                v-for="tag in selectTagList"
                                                :key="tag.tagId">
                                                {{ tag.tagName }}
                                            </ElTag>
                                        </ElSpace>
                                        <span style="font-size: 13px;"
                                            v-else>暂无标签</span>
                                    </div>
                                </div>
                            </ElFormItem>
                        </div>
                    </div>
                    <ElFormItem label="摘要">
                        <ElInput v-model="formData.description" :rows="4"
                            type="textarea" placeholder="请输入文章摘要" />
                    </ElFormItem>
                    <h2>文章内容</h2>
                </div>
                <WangEditor ref="wangEditorRef" v-model="formData.content"
                    :toolbar-config="toolbarConfig"
                    :editor-config="editorConfig" />
            </ElForm>
            <ElDialog v-model="dialogVisible" title="添加标签" width="400"
                :z-index="10000" @open="getTagListData">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <ElPopover width="300" append-to-body
                            popper-class="popper-z-index" title="已选择标签："
                            placement="left-start">
                            <template #reference>
                                <ElButton size="small" round>
                                    已选择（{{ tagTemp?.length }}）
                                </ElButton>
                            </template>
                            <template #default>
                                <ElSpace wrap>
                                    <ElTag v-for="tag in tagTemp"
                                        :key="tag.tagId" closable
                                        @close="handleClose(tag)"
                                        :color="tag.color">
                                        {{ tag.tagName }}
                                    </ElTag>
                                </ElSpace>
                            </template>
                        </ElPopover>
                    </div>
                    <div>
                        <ElInput v-if="inputVisible" ref="InputRef"
                            v-model="inputValue" class="w-20" size="small"
                            @keyup.enter="handleInputConfirm"
                            @blur="handleInputConfirm" />
                        <ElButton v-else class="button-new-tag" size="small"
                            @click="showInput">
                            + New Tag
                        </ElButton>
                    </div>
                </div>
                <ElScrollbar style="margin-top: 15px;" max-height="200px"
                    @end-reached="loadMore">
                    <ElSpace wrap>
                        <ElTag :color="tag.color" v-for="tag in tagList"
                            :key="tag.tagId" @click="handleClick(tag)"
                            :class="{ 'is-action': isTagSelected(tag) }">
                            {{ tag.tagName }}
                        </ElTag>
                    </ElSpace>
                </ElScrollbar>
                <ElDivider>搜索标签</ElDivider>
                <ElInput v-model="query.tagName" placeholder="输入标签名称"
                    @keydown.enter="handleSearchTag">
                    <template #append>
                        <ElButton @click="handleSearchTag">
                            <SvgIcon icon="mdi:search"></SvgIcon>
                        </ElButton>
                    </template>
                </ElInput>

                <template #footer>
                    <ElButton @click="dialogVisible = false">取消</ElButton>
                    <ElButton type="primary" @click="handleSelectTagList">
                        添加
                    </ElButton>
                </template>
            </ElDialog>
        </div>
        <ElDrawer class="draft-drawer" v-model="drawer" title="暂存箱"
            :with-header="true" :close-on-click-modal="true"
            :close-on-press-escape="true" direction="rtl" :size="380">
            <template #header>
                <div class="drawer-custom-header">
                    <span class="drawer-title">📦 暂存箱 · 草稿列表</span>
                    <span class="drawer-count" v-if="draftList.length">共 {{
                        draftList.length }} 条</span>
                </div>
            </template>
            <div class="drawer-body">
                <div v-if="draftList.length === 0" class="empty-draft">
                    📭 暂无草稿，保存草稿后将显示在这里
                </div>
                <div v-else class="draft-list">
                    <div v-for="draft in draftList" :key="draft.articleId"
                        class="draft-item">
                        <div class="draft-cover">
                            <img v-if="draft.cover" :src="draft.cover"
                                class="draft-cover-img" alt="封面">
                            <div v-else class="draft-cover-placeholder">📄</div>
                        </div>
                        <div class="draft-info">
                            <div class="draft-title">{{ draft.title || '无标题草稿'
                            }}</div>
                            <div class="draft-desc">{{ (draft.description ||
                                '暂无摘要').slice(0, 80) }}</div>
                            <div class="draft-time">🕒 更新于 {{ draft.updatedTime
                                }}</div>
                        </div>
                        <div class="draft-actions">
                            <ElButton text type="danger" size="small"
                                class="delete-btn"
                                @click="delArticleDraft(draft)">
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
    </div>
</template>

<script setup lang='ts'>
import { ElMessageBox, ElMessage, type UploadFile, type UploadProps, type UploadRawFile, type InputInstance, ElPopover, type ScrollbarDirection, formEmits } from "element-plus"
import { TagService } from "@/api/tagApi"
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router"
import { useUserStore } from "@/store/modules/user"
import { ArticleService } from "@/api/articleApi"
import { R2FileService } from "@/api/r2FileApi"

import type { IEditorConfig, IDomEditor, SlateElement } from '@wangeditor-next/editor'
import _ from 'lodash'
type Article = Api.Article.ArticleInfo
type InsertFnType = (url: string) => void
type ArticleDetail = Api.Article.ArticleDetailInfo
type Tag = Api.Tag.TagInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
type ImageElement = SlateElement & {
    src: string
    alt: string
    url: string
    href: string
}
const router = useRouter()
const route = useRoute()
const wangEditorRef = ref<IDomEditor>() // 获取富文本编辑器组件实例
const dialogVisible = ref<boolean>(false)
const userStore = useUserStore()
const { accessToken } = userStore
const query = reactive<Tag>({})    // 搜索关键词
const inputVisible = ref<boolean>(false)
const drawer = ref<boolean>(false)
const inputValue = ref<string>('')
const InputRef = ref<InputInstance>()
const tagList = ref<Tag[]>([])  // 存储所有标签
const selectTagList = ref<Tag[]>([])    // 存储已选择的标签
const tagTemp = ref<Tag[]>([])  // 存储临时已选择的标签
const originImageList = ref<string[]>([])     // 存储编辑文章的原始图片url
const uploadImageList = ref<string[]>([])    // 存储上传的图片url
const hasUnsavedChanges = ref(false)    // 标记是否有未保存的修改
const tempCoverList = ref<string[]>([])
const draftCount = ref<number>(0)
const draftList = ref<Article[]>([])
const draftLoaded = ref<boolean>(false)
// 标签数据是否已经加载过（用于缓存）
const tagLoaded = ref<boolean>(false)
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 30
})
const getTagListData = async () => {
    // 已经加载过数据，直接返回，不发请求
    if (tagLoaded.value) return
    const data: PaginatingParams<Tag> = await TagService.getTagListData({
        ...query,
        pageNum: page.pageNum,  // 当前页码
        pageSize: page.pageSize,    // 每页条数
    })
    // 第一页覆盖，后面页追加（滚动加载）
    if (page.pageNum === 1) {
        tagList.value = data.list
    } else {
        tagList.value.push(...data.list)
    }
    tagList.value = data.list
    page.total = data.total
    tagLoaded.value = true
}
const onBack = () => {
    router.back()
}
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
// 对比数据是否有变化
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
// 监听表单变化
watch(
    () => [formData.title, formData.cover, formData.description, formData.content, formData.status, formData.tags],
    () => checkDirty(),
    { deep: true }
)
// 路由离开前拦截
onBeforeRouteLeave((to, from) => {
    if (hasUnsavedChanges.value) {
        // 关键：直接返回 ElMessageBox.confirm() 这个 Promise
        return ElMessageBox.confirm(
            '当前内容尚未保存，确定要离开吗？未保存的内容将会丢失。',
            '提示',
            {
                confirmButtonText: '离开（不保存）',
                cancelButtonText: '取消',
                type: 'warning',
                appendTo: document.body,
            }
        ).then(() => {
            return true  // 确认离开
        }).catch(() => {
            return false // 取消离开
        })
    } else {
        return true
    }
})
const showInput = () => {
    inputVisible.value = true
    nextTick(() => {
        InputRef.value!.input!.focus()
    })
}
/** 查找选中的标签 */
const isTagSelected = (tag: Tag) => {
    return tagTemp.value.some(item => item.tagId === tag.tagId)
}
/** 新增标签 */
const handleInputConfirm = () => {
    if (inputValue.value) {
        tagList.value?.push({
            tagName: inputValue.value
        })
    }
    inputVisible.value = false
    inputValue.value = ''
}
/** 删除已选中的临时标签 */
const handleClose = (tag: Tag) => {
    const index = tagTemp.value.findIndex(t => t.tagId === tag.tagId)
    if (index !== -1) tagTemp.value.splice(index, 1)
}
/** 添加/删除临时标签 */
const handleClick = (tag: Tag) => {
    // 找到下标
    const index = tagTemp.value.findIndex(t => t.tagId === tag.tagId)
    if (index !== -1) {
        tagTemp.value.splice(index, 1)
    } else {
        tagTemp.value.push(tag)
    }
}
/** 搜索标签 */
const handleSearchTag = () => {
    // 搜索前启动加载
    tagLoaded.value = false
    getTagListData()
}
/** 获取选中的标签 */
const handleSelectTagList = () => {
    // 关闭对话框
    dialogVisible.value = false
    // 临时选中标签转为实际选中标签
    selectTagList.value = [...tagTemp.value]
    // 提取标签id存储到表单tags
    formData.tags = selectTagList.value.map(tag => tag.tagId!)
}
/** 提取图片 key */
const getUrlKey = (urlList: string[]) => urlList.map((url: string) => new URL(url).pathname)
/** 发布文章 */
// const publishArticle = async () => {
//     if (formData.articleId) {
//         formData.status = 'PUBLISH'
//         await ArticleService.updateArticle(formData)
//         ElMessage.success('修改成功')
//     } else {
//         formData.status = 'DRAFT'
//         await ArticleService.addArticle(formData)
//         ElMessage.success('提交成功')
//     }
// }
/** 获取草稿数量 */
const getdraftCount = async () => {
    draftCount.value = await ArticleService.getDraftCount()
}
/** 删除未使用的图片 */
const delImages = () => {
    // 获取编辑器的所有图片url
    const editorImages = wangEditorRef.value?.getElemsByType('image')
        .map((item: any) => item.src).filter(Boolean) || []
    // 合并初始图片和已上传图片
    const allImages = [...originImageList.value, ...uploadImageList.value]
    // 找出未使用的图片
    const unused = allImages.filter(url => !editorImages.includes(url))
    if (unused.length > 0) {
        // 批量删除未使用的图片
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
    // 获取旧图片url的key
    let urlKey = new URL(originalData.value.cover).pathname
    // 删除旧图片
    R2FileService.delR2File({key: urlKey})
    // 保存成功后同步快照
    originalData.value = {
        title: formData.title,
        cover: formData.cover,
        description: formData.description,
        content: formData.content,
        status: formData.status,
        tags: formData.tags ? [...formData.tags] : []
    }
    hasUnsavedChanges.value = false // 清除脏标记
}
/** 保持草稿 */
const handleDraft = async () => {
    formData.status = 'DRAFT'
    await saveOrPublish()
}
/** 发布文章 */
const handlePublish = async () => {
    formData.status = 'PUBLISH'
    await saveOrPublish()
    delImages()
    if (tempCoverList.value.length > 0) {
        R2FileService.batchDelR2File(tempCoverList.value)
    }
    onBack()
}
/** 加载标签 */
const loadMore = async (direction: ScrollbarDirection) => {
    if (direction !== 'bottom') return

    // 全部加载完了，不再请求
    if (tagList.value.length >= page.total) return

    // 下一页
    page.pageNum += 1
    tagLoaded.value = false
    await getTagListData()
}
/** 工具栏配置 */
const toolbarConfig = ref({
    toolbarKeys: [
        'headerSelect', 'blockquote', '|',
        'bold', 'italic', 'underline', 'through', '|',
        'color', 'bgColor', 'fontSize', 'fontFamily', '|',
        'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyJustify', '|',
        'indent', 'delIndent', '|',
        'bulletedList', 'numberedList', 'todo', '|',
        'insertLink', 'insertImage', 'uploadImage', 'insertVideo', 'uploadVideo', '|',
        'insertTable', 'codeBlock', '|',
        'undo', 'redo', 'clearStyle'
    ],
    // 将弹窗添加到body，避免被容器遮挡
    modalAppendToBody: true
})
/** 编辑器配置 */
const editorConfig = ref({
    placeholder: '请输入内容...',
    MENU_CONF: {
        insertImage: {
            // 插入图片后的回调
            onInsertedImage: (imgNode: ImageElement) => {
                // console.log('图片已插入', imgNode.src)
                // editorImageList.value.push(imgNode.src)
                // 可在此进行自定义逻辑，如图片统计等
            }
        },
        uploadImage: {
            server: import.meta.env.VITE_API_URL + '/api/r2-file',
            methods: "POST",
            fieldName: "file",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            // 自定义插入图片
            customInsert(res: any, insertFn: InsertFnType) {
                const { url } = res.data
                uploadImageList.value.push(url)
                insertFn(url)
            },
        }
    }
})
const uploadProps = ref<Record<string, any>>({
    showFileList: false,
    headers: {
        'Authorization': `Bearer ${accessToken}`,
    },
    action: import.meta.env.VITE_API_URL + '/api/r2-file',
})
/** 封面上传成功的回调函数 */
const handleSuccess = (response: any, file: UploadFile) => {
    // 获取旧图片url的key
    let urlKey = response.data.key
    tempCoverList.value.push(urlKey)
    console.log("上传成功！", response, file)
    console.log("图片地址：", formData.cover)
}
/** 组件处于编辑则根据路由参数获取指定文章 */
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
        tagTemp.value = []
        await nextTick()
        originalData.value = {
            title: formData.title,
            cover: formData.cover,
            description: formData.description,
            content: formData.content,
            status: formData.status,
            tags: formData.tags ? [...formData.tags] : []
        }
        // 获取编辑器的所有图片
        const imageElements = wangEditorRef.value?.getElemsByType('image')
        // 存储文章内容初始图片
        originImageList.value = _.map(imageElements, 'src')

        if (article.tagIds && article.tagNames) {
            const tagIdArr = article.tagIds.split(',')
            const tagNameArr = article.tagNames.split(',')
            const tagColorArr = article.tagColors.split(',')

            // 组装成前端需要的标签对象
            const tagList = tagIdArr.map((tid, i) => ({
                tagId: Number(tid),
                tagName: tagNameArr[i] || '',
                color: tagColorArr[i] || ''
            }))

            selectTagList.value = tagList
            tagTemp.value = [...tagList] // 同步弹窗选中
            formData.tags = tagList.map(t => t.tagId!) // 提交用的ID数组
        }
        ElMessage.success('加载文章成功')
    }
}
/** 获取10条草稿 */
const getArticleDraftList = async () => {
    const data = await ArticleService.getTop10List({
        status: 'DRAFT'
    })
    draftList.value = data
}
const handleDrawer = async () => {
    drawer.value = true
    if (!draftLoaded.value) {
        await getArticleDraftList()
        draftLoaded.value = true
    }
}
/** 删除草稿 */
const delArticleDraft = async (article: Article) => {
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

        // 确认后才执行
        await ArticleService.delArticle(article.articleId)
        ElMessage.success('删除成功')
        draftLoaded.value = false
        getArticleDraftList()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
onMounted(() => {
    getArticleById()
    getdraftCount()
})
onBeforeUnmount(() => {
    delImages()
    if (tempCoverList.value.length != 0) {
        // R2FileService.batchDelR2File({keys: tempCoverList.value})
        
    }
})
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
<style lang="scss">
.popper-z-index {
    z-index: 10000 !important;
}
</style>