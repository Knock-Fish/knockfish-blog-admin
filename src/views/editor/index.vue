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
                <div class="btn-dropdown">
                    <el-dropdown placement="bottom">
                        <ElButton>操作</ElButton>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item>
                                    <div @click="handleDrawer">
                                        <ElBadge :value="draftCount"
                                            :show-zero="false">
                                            暂存箱
                                        </ElBadge>
                                    </div>
                                </el-dropdown-item>
                                <el-dropdown-item>
                                    <div @click="handleDraft">
                                        保存草稿
                                    </div>
                                </el-dropdown-item>
                                <el-dropdown-item>
                                    <div @click="handlePublish">
                                        立即发布
                                    </div>
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <div class="btn-list">
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
            <ElForm :model="formData" style="width: 100%;">
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
                                    :props="uploadProps" text="请上传封面" />
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
                <MdEditor v-model="formData.content"
                    @onUploadImg="onUploadImg" />
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
                        <div v-if="inputVisible">
                            <ElInput class="custom-tag-input" ref="InputRef"
                                v-model="tag.tagName" size="small"
                                @keyup.enter="handleInputConfirm">
                                <template #prefix>
                                    <ElColorPicker v-model="tag.color"
                                        @click.stop @mousedown.stop
                                        size="small" />
                                </template>
                                <template #append>
                                    <ElButton size="small"
                                        @click="handleInputConfirm">添加
                                    </ElButton>
                                </template>
                            </ElInput>

                        </div>
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
                        class="draft-item"
                        :class="{ 'is-editor': formData.articleId == draft.articleId }"
                        @click.stop="handleSelectDraft(draft)">
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
                                @click.stop="delArticleDraft(draft)">
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
import { ElMessageBox, ElMessage, type UploadFile, type UploadProps, type UploadRawFile, type InputInstance, ElPopover, type ScrollbarDirection, type UploadRequestOptions } from "element-plus"
import { TagService } from "@/api/tagApi"
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router"
import { useUserStore } from "@/store/modules/user"
import { ArticleService } from "@/api/articleApi"
import { R2FileService } from "@/api/r2FileApi"
import { getMdImagePathKeys } from "@utils/url/urlKey"
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import _ from 'lodash'
type Article = Api.Article.ArticleInfo
type ArticleDetail = Api.Article.ArticleDetailInfo
type Tag = Api.Tag.TagInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
const router = useRouter()
const route = useRoute()
const dialogVisible = ref<boolean>(false)
const userStore = useUserStore()
const { accessToken } = userStore
const query = reactive<Tag>({})    // 搜索关键词
const inputVisible = ref<boolean>(false)
const drawer = ref<boolean>(false)
const tag = reactive<Tag>({
    tagName: '',
    color: '#f4f4f5'
})
const InputRef = ref<InputInstance>()
const tagList = ref<Tag[]>([])  // 存储所有标签
const selectTagList = ref<Tag[]>([])    // 存储已选择的标签
const tagTemp = ref<Tag[]>([])  // 存储临时已选择的标签
const originImageList = ref<string[]>([])     // 存储编辑文章的原始图片url
const uploadImageList = ref<string[]>([])    // 存储上传的图片url
const tempCoverList = ref<string[]>([]) // 记录已上传的封面
const draftCount = ref<number>(0)   // 草稿数量
const draftList = ref<Article[]>([])    // 草稿列表
const draftLoaded = ref<boolean>(false) // 草稿是否已经加载
const tagLoaded = ref<boolean>(false)   // 标签数据是否已经加载过（用于缓存）
const hasUnsavedChanges = computed(() => !_.isEqual(originalData, formData))
// 分页参数
const page = reactive({
    total: 0,
    pageNum: 1,
    pageSize: 30
})
// 表单数据
const formData = reactive<Article>({
    title: "",
    cover: "",
    description: "",
    content: "",
    status: 'DRAFT',
    tags: []
})
// 原始表单数据
const originalData = reactive<Article>({
    title: "",
    cover: "",
    description: "",
    content: '',
    status: 'DRAFT',
    tags: []
})
const onUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
    try {
        // 只取第一张图片
        const file = files[0]
        if (!file) {
            callback([])
            return
        }
        // 执行单图上传，拿到图片在线地址
        const { url, key } = await R2FileService.uploadR2File({ file })
        uploadImageList.value.push(...new Set([...uploadImageList.value, key]))
        callback([url])
    } catch (err) {
        console.error('图片上传失败：', err)
        // 异常兜底，结束上传状态
        callback([])
    }
}
//------------------------------ 配置 -----------------------------------
/** 上传组件配置 */
const uploadProps = ref<Record<string, any>>({
    showFileList: false,
    httpRequest: async (options: UploadRequestOptions) => {
        const { file } = options
            const res = await R2FileService.uploadR2File({ file })
            tempCoverList.value.push(res.key)
            return res.url
    },
    action: '',
})
//------------------------------ 方法 -----------------------------------
/** 新增/保存文章 */
const saveOrPublish = async () => {
    // 如果表单存在文章id，则更新当前文章数据，否则添加该文章数据
    if (formData.articleId) {
        await ArticleService.updateArticle(formData)
        ElMessage.success('修改成功')
    } else {
        // 获取插入数据后的文章id
        const articleId = await ArticleService.addArticle(formData)
        formData.articleId = articleId
        ElMessage.success('提交成功')
    }
    // 每次新增/更新保存当前快照
    Object.assign(originalData, _.cloneDeep(formData))
}
/** 加载文章 */
const loadArticle = async (articleId: number) => {
    // 获取需要编辑的文章
    const article: ArticleDetail = await ArticleService.getArticleWithTagById(
        articleId
    )
    // 将数据赋值到表单
    Object.assign(formData, { ...article, })
    // 清空当前选择的标签项
    selectTagList.value = []
    // 清空当前临时选择的标签项
    tagTemp.value = []
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
    // 将表单的数据保存为原始数据
    _.assign(originalData, _.cloneDeep(formData))
    await nextTick()
    originImageList.value = article.urlKeys
    ElMessage.success('加载文章成功')
}
/** 返回上一级路由 */
const onBack = () => {
    router.back()
}
const delCover = () => {
    if (tempCoverList.value.length != 0) {
        const coverKey = new URL(formData.cover).pathname.substring(1)
        // 如果封面已经被使用（formData.cover 在 tempCoverList 中）
        if (formData.cover && tempCoverList.value.includes(coverKey)) {
            // 删除除了当前封面以外的所有临时封面
            const coversToDelete = tempCoverList.value.filter(
                url => url !== coverKey
            )
            if (coversToDelete.length > 0) {
                R2FileService.batchDelR2File(coversToDelete)
            }
            // 清空数组（保留正在使用的封面）
            tempCoverList.value = [coverKey]
        } else {
            // 封面没有被使用，全部删除
            R2FileService.batchDelR2File(tempCoverList.value)
            tempCoverList.value = []
        }
    }
}
/** 路由离开前拦截 */
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
        ).then(() => {
            return true  // 确认离开
        }).catch(() => {
            return false // 取消离开
        })
    } else {
        return true
    }
})
//------------------------------ 标签 -----------------------------------
/** 请求标签数据 */
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
/** 显示标签输入框 */
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
const handleInputConfirm = async () => {
    if (tag.tagName != '' && tag.color != '') {
        const tagId = await TagService.addTag(tag)
        tagList.value?.push({
            tagId,
            tagName: tag.tagName,
            color: tag.color
        })
    }
    inputVisible.value = false
    tag.tagName = ''
    tag.color = '#f4f4f5'
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
const handleSearchTag = async () => {
    // 搜索前启动加载
    tagLoaded.value = false
    await getTagListData()
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

//------------------------------ 图片操作 -----------------------------------
/** 删除未使用的图片 */
const delImages = async () => {
    const coverKey = formData.cover
        ? new URL(formData.cover).pathname.substring(1)
        : ''
    // 获取封面和编辑器的所有图片url
    const editorImages = [...getMdImagePathKeys(formData.content), coverKey]
    // 非数组则转为空数组   
    const originList = Array.isArray(originImageList.value) ? originImageList.value : []
    const uploadList = Array.isArray(uploadImageList.value) ? uploadImageList.value : []
    // 合并初始图片和已上传图片
    const allImages = [...originList, ...uploadList]
    // 找出未使用的图片
    const unused = allImages.filter(url => !editorImages.includes(url))
    if (unused.length > 0) {
        // 批量删除未使用的图片
        await R2FileService.batchDelR2File(unused)
    }
}
//------------------------------ 发布/编辑文章 -----------------------------------
/** 发布文章 */
const handlePublish = async () => {
    formData.status = 'PUBLISH'
    await saveOrPublish()
    delImages()
    delCover()
    onBack()
}
/** 组件处于编辑则根据路由参数获取指定文章 */
const getArticleById = async () => {
    // 判断当前是否为编辑
    if (route.name === 'Editor' && route.params.id) {
        await loadArticle(Number(route.params.id))
    }
}

//------------------------------ 草稿操作 -----------------------------------
/** 获取草稿数量 */
const getdraftCount = async () => {
    draftCount.value = await ArticleService.getDraftCount()
}
/** 保存草稿 */
const handleDraft = async () => {
    if (hasUnsavedChanges.value) {
        draftLoaded.value = false
        formData.status = 'DRAFT'
        await saveOrPublish()
        await getdraftCount()
    } else {
        ElMessage.success('文章已经保存')
    }

}
/** 获取10条草稿 */
const getArticleDraftList = async () => {
    const data = await ArticleService.getTop10List({
        status: 'DRAFT'
    })
    draftList.value = data
}
/** 打开抽屉获取草稿 */
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
        if (formData.articleId === article.articleId) {
            await ElMessageBox.confirm('当前文章正处于编辑，确定要删除该文章吗？', '警告', {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning',
                appendTo: document.body,
            })
            // 清空当前正在编辑的文章
            formData.articleId = undefined
            formData.title = ""
            formData.cover = ""
            formData.description = ""
            formData.content = ""
            formData.status = 'DRAFT'
            formData.tags = []
            Object.assign(originalData, _.cloneDeep(formData))
            selectTagList.value = []
            tagTemp.value = []
            router.replace({
                name: "Publish",
            })
        }

        // 确认后才执行
        await ArticleService.delArticle(article.articleId)
        ElMessage.success('删除成功')
        draftCount.value -= 1
        draftLoaded.value = false
        getArticleDraftList()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
/** 选择草稿进行编辑 */
const handleSelectDraft = async (draft: Article) => {
    // 检查是否有未保存的内容
    if (!_.isEqual(originalData, formData)) {
        try {
            // 提示是否保存当前内容
            await ElMessageBox.confirm(
                '当前有未保存的内容，是否先保存未草稿？',
                '提示',
                {
                    confirmButtonText: '保存当前草稿',
                    cancelButtonText: '不保存，直接打开',
                    type: 'warning',
                    appendTo: document.body,
                    distinguishCancelAndClose: true
                }
            )
            // 点击"保存当前草稿"
            await handleDraft()
            // 保存成功后跳转
            router.replace({
                name: "Editor",
                params: { id: draft.articleId }
            })
            drawer.value = false
        } catch (error) {
            // 点击"不保存，直接打开"（action === 'cancel'）
            if (error === 'cancel') {
                router.replace({
                    name: "Editor",
                    params: { id: draft.articleId }
                })
                drawer.value = false
            }
        }
    } else {
        router.replace({
            name: "Editor",
            params: { id: draft.articleId }
        })
        // 关闭抽屉
        drawer.value = false
    }
}
window.addEventListener('beforeunload', (e) => {
    e.preventDefault()
})
onMounted(async () => {
    await getArticleById()
    await getdraftCount()

})

onBeforeUnmount(() => {
    delImages()
    delCover()

})
watch(() => route.params.id, (newId) => {
    if (newId) loadArticle(Number(newId))
})
</script>

<style lang="scss" scoped>
@use "./style.scss";

.wang {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
}
</style>
<style lang="scss">
.popper-z-index {
    z-index: 10000 !important;
}
</style>