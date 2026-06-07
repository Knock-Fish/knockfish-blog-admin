<template>
    <div class="container">
        <ElRow justify="space-between">
            <ElCol :span="13">
                <ElInput v-model="input4" class="input" size="large"
                    placeholder="输入文章标题查询">
                    <template #prefix>
                        <SvgIcon icon="mdi:search" />
                    </template>
                </ElInput>
            </ElCol>
            <ElCol :span="1.5">
                <DialogButton type="button" permission="article:add"
                    @click="handleAdd">
                    新增文章
                </DialogButton>
            </ElCol>
        </ElRow>
        <ElEmpty v-if="!articleList" description="description" />
        <div class="list" v-else>
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
                                permission="article:edit"
                                @click="goToArticleEditor(article)">
                                编辑
                            </DialogButton>
                            <DialogButton type="button"
                                :button-props="delButtonProps"
                                permission="article:delete"
                                @click="handleDel(article)">
                                删除
                            </DialogButton>
                        </span>
                    </div>
                </div>
            </ElCard>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { useRouter } from "vue-router"
import { ArticleService } from "@/api/articleApi"
import { ElEmpty, ElMessage, ElMessageBox, type ButtonProps } from "element-plus"
type Article = Api.Article.ArticleInfo
type PaginatingParams<T> = Api.Common.PaginatingParams<T>
interface ArticleQuery {
    title?: string
}
const input4 = ref()
const router = useRouter()
const articleList = ref<Article[]>([])
const query = reactive<ArticleQuery>({})
const page = reactive({ // 分页参数
    total: 0,
    pageNum: 1,
    pageSize: 10
})
const editButtonProps: ButtonProps = {
    size: "small"
}
const delButtonProps: ButtonProps = {
    size: "small",
    type: "danger"
}
const handleAdd = () => {
    router.push({ name: 'Publish' })
}
const getArticleListData = async () => {
    const data: PaginatingParams<Article> = await ArticleService.getArticleListData({
        ...query,
        pageNum: page.pageNum,  // 当前页码
        pageSize: page.pageSize,
    })
    articleList.value = data.list
    page.total = data.total
}
const goToArticleEditor = (data: Article) => {
    router.push({
        name: "Editor",
        params: {
            id: data.articleId
        }
    })
}
const goToArticleDetail = (data: Article) => {
    router.push({
        name: "Detail",
        params: {
            id: data.articleId
        }
    })
}
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
onMounted(() => {
    getArticleListData()
})
</script>

<style lang="scss" scoped>
.container {
    padding: 20px;
    border-radius: 15px;
    border: 1px solid var(--border-color);
    background-color: var(--card-color);
    min-height: calc(100vh - 160px);

    .el-empty {
        height: calc(100vh - 200px);
    }

    .list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin: 20px 0;

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


        .card {
            border-radius: 8px;
            box-sizing: border-box;
            cursor: pointer;
            overflow: hidden;

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
    }
}
</style>
