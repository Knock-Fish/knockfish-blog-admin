<template>
    <div class="container">
        <ElRow justify="space-between">
            <ElCol :span="13">
                <ElInput v-model="query.title" class="input" size="large"
                    placeholder="输入文章标题查询">
                    <template #prefix>
                        <SvgIcon icon="mdi:search" />
                    </template>
                </ElInput>
            </ElCol>
            <ElCol :span="1.5">
                <DialogButton type="button" :permission="ArticlePerm.ADD"
                    @click="handleAdd">
                    新增文章
                </DialogButton>
            </ElCol>
        </ElRow>
        <ElEmpty v-if="!articleList" description="description" />
        <ElScrollbar v-else ref="scrollbarRef" class="list"
            max-height="calc(100vh - 200px)" :distance="50"
            @end-reached="onEndReached">
            <div class="grid">
                <ElCard class="card" shadow="never" v-for="article in articleList"
                    :key="article.articleId" @click="goToArticleDetail(article)">
                    <div class="image-container">
                        <ElImage :src="article.cover" lazy fit="cover" />
                    </div>
                    <div class="bottom">
                        <span class="title">{{ article.title }}</span>
                        <div class="info">
                            <span class="date">
                                <SvgIcon icon="mdi:clock-outline">
                                    {{ article.publishTime }}
                                </SvgIcon>
                            </span>
                            <span class="action-btn">
                                <DialogButton type="button"
                                    :button-props="editButtonProps"
                                    :permission="ArticlePerm.EDIT"
                                    @click="goToArticleEditor(article)">
                                    编辑
                                </DialogButton>
                                <DialogButton type="button"
                                    :button-props="delButtonProps"
                                    :permission="ArticlePerm.DELETE"
                                    @click="handleDel(article)">
                                    删除
                                </DialogButton>
                            </span>
                        </div>
                    </div>
                </ElCard>
                <!-- 加载更多提示 -->
                <div class="loading-more" v-if="loading">
                    <SvgIcon icon="mdi:loading" class="loading-icon" />
                    加载中...
                </div>
                <div class="no-more" v-else-if="!hasMore && articleList.length > 0">
                    没有更多了~
                </div>
            </div>
        </ElScrollbar>
    </div>
</template>

<script setup lang='ts'>
import { ArticleService } from "@/api/articleApi"
import { ArticlePerm } from "@/constants/permission"
import { ElEmpty, ElMessage, ElMessageBox, ElScrollbar, type ButtonProps, type ScrollbarInstance } from "element-plus"
type Article = Api.Article.ArticleInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
interface ArticleQuery {
    title?: string
}
const router = useRouter()
const articleList = ref<Article[]>([])  // 文章列表
const loading = ref<boolean>(false) // 是否加载
const hasMore = ref<boolean>(true)  // 是否有更多文章
const query = reactive<ArticleQuery>({})     // 搜索关键词
const scrollbarRef = ref<ScrollbarInstance>()  // 滚动容器实例
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
// --------------- 按钮配置 ---------------
const editButtonProps: ButtonProps = {
    size: "small"
}
const delButtonProps: ButtonProps = {
    size: "small",
    type: "danger"
}
/** 跳转到新增页面 */
const handleAdd = () => {
    router.push({ name: 'Publish' })
}
/** 滚动加载文章 */
const loadMore = async () => {
    if (loading.value || !hasMore.value || articleList.value.length >= page.total) {
        return
    }
    loading.value = true
    page.pageNum++
    try {
        const data: PaginatingParams<Article> = await ArticleService.getArticleListData({
            ...query,
            pageNum: page.pageNum,
            pageSize: page.pageSize,
        })
        // 追加文章
        articleList.value = [...articleList.value, ...data.list]
        page.total = data.total
        hasMore.value = articleList.value.length < page.total

    } catch (error) {
        console.error('加载更多失败:', error)
        ElMessage.error('加载更多失败')
        page.pageNum--
    } finally {
        loading.value = false
        // 内容不足以撑出滚动条时继续加载，直到出现滚动条或没有更多
        ensureFilled()
    }
}
/** 触底回调 */
const onEndReached = (direction: string) => {
    if (direction === 'bottom') loadMore()
}
/** 内容未填满容器时自动继续加载 */
const ensureFilled = async () => {
    await nextTick()
    const wrap = scrollbarRef.value?.wrapRef
    if (!wrap) return
    if (hasMore.value && !loading.value && wrap.scrollHeight <= wrap.clientHeight) {
        loadMore()
    }
}
/** 获取文章数据 */
const getArticleListData = async () => {
    if (loading.value) return

    loading.value = true
    try {
        const data: PaginatingParams<Article> = await ArticleService.getArticleListData({
            ...query,
            pageNum: page.pageNum,
            pageSize: page.pageSize,
        })
        articleList.value = data.list
        page.total = data.total
        hasMore.value = articleList.value.length < page.total
    } catch (error) {
        console.error('获取文章列表失败:', error)
        ElMessage.error('获取文章列表失败')
    } finally {
        loading.value = false
        ensureFilled()
    }
}
/** 跳转到文章编辑页面 */
const goToArticleEditor = (data: Article) => {
    router.push({
        name: "Editor",
        params: {
            id: data.articleId
        }
    })
}
/** 跳转到文章详情页面 */
const goToArticleDetail = (data: Article) => {
    router.push({
        name: "Detail",
        params: {
            id: data.articleId
        }
    })
}
/** 删除文章 */
const handleDel = async (row: Article) => {
    if (!row.articleId) {
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
        await ArticleService.delArticle(row.articleId)
        ElMessage.success('删除成功')
        getArticleListData()

    } catch (error) {
        ElMessage.info('已取消')
    }
}
onMounted(async () => {
    await getArticleListData()
})
</script>

<style lang="scss" scoped>
.container {
    padding: 20px;
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
    border: 1px solid var(--border-color);
    background-color: var(--card-color);
    height: calc(100vh - 111px);

    margin: 15px;

    .el-empty {
        height: calc(100vh - 200px);
    }

    .list {
        margin: 20px 0;

        :deep(.el-scrollbar__bar) {
            display: none;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;

            @media screen and (min-width: 900px) and (max-width: $screen-larger) {
                grid-template-columns: repeat(3, 1fr);
            }

            @media screen and (min-width: $screen-medium) and (max-width: 900px) {
                grid-template-columns: repeat(3, 1fr);
            }

            @media screen and (max-width: $screen-medium) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media screen and (max-width: $screen-small) {
                grid-template-columns: repeat(1, 1fr);
            }
        }

        .card {
            box-sizing: border-box;
            cursor: pointer;
            overflow: hidden;
            background-color: transparent !important;

            .image-container {
                aspect-ratio: 16 / 9;
                overflow: hidden;
                background-color: #f5f7fa;

                :deep(.el-image) {
                    width: 100%;
                    height: 100%;

                    .el-image__inner {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                }
            }

            &:hover {
                :deep(.dialog-btn-content) {
                    opacity: 1 !important;
                }
            }

            :deep(.el-card__body) {
                padding: 0 !important;
            }

            .bottom {
                padding: 5px 10px;

                .title {
                    display: block;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    font-size: 14px;
                    color: var(--text-color);
                }

                .info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    margin-top: 6px;
                    display: flex;
                    justify-content: space-between;

                    @media screen and (max-width: $screen-medium) {
                        display: block;

                        .date {
                            display: block;
                        }

                        .action-btn {
                            display: block;
                            text-align: right;
                        }
                    }

                    .date {
                        font-size: 13px;
                        color: #78829D;
                    }

                    .action-btn {
                        :deep(.dialog-btn-content) {
                            opacity: 0;
                            transition: all 0.3s;
                        }
                    }
                }
            }
        }

        .loading-more,
        .no-more {
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            color: #78829D;
            font-size: 14px;

            .loading-icon {
                animation: rotate 1s linear infinite;
                margin-right: 8px;
            }
        }
    }
}
</style>
