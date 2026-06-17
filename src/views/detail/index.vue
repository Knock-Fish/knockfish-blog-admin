<template>
    <div class="detail">
        <div class="article-content">
            <!-- 骨架屏 -->
            <ArticleSkeleton v-if="loading" />

            <!-- 核心：外层 flex 左右布局 -->
            <div class="article" v-else
                style="position: relative; display: flex; gap: 24px;">
                <!-- 左侧正文区域 -->
                <div class="article-detail">
                    <h1>{{ article?.title }}</h1>
                    <div class="meta">
                        <span class="author">作者：{{ article?.username }}</span>
                        <time class="publish-time">时间：{{ article?.publishTime
                        }}</time>
                        <time class="updated-time"
                            v-if="article?.updatedTime">最后修改时间：{{
                                article?.updatedTime }}</time>
                    </div>
                    <MdPreview style="background-color: transparent;" :id="editorId" :modelValue="article?.content"
                        :theme="isDark ? 'dark' : 'light'"
                        :codeTheme="isDark ? 'github' : 'atom'" />
                </div>

                <!-- 右侧目录区域 + 吸顶 + 暂无目录提示 -->
                <div class="catalog-wrap">
                    <MdCatalog v-if="hasCatalog" :editorId="editorId"
                        :scrollElement="scrollElement" />
                    <div v-else class="empty-catalog">暂无目录</div>
                </div>
            </div>
        </div>

        <!-- 移动端悬浮按钮 -->
        <div class="bar">
            <div class="contents-btn" @click="drawer = !drawer">
                <SvgIcon icon="mdi:file-document-box-outline" />
            </div>
        </div>
        <ElDrawer v-model="drawer" :with-header="false">
            <!-- 抽屉也同步判断目录 -->
            <MdCatalog v-if="hasCatalog" :editorId="editorId"
                :scrollElement="scrollElement" />
            <div v-else class="drawer-empty">暂无目录</div>
        </ElDrawer>
    </div>
</template>

<script setup lang='ts'>
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { useRouter, useRoute } from "vue-router"
import { ArticleService } from "@/api/articleApi"
import { useWindowSize } from '@vueuse/core'
import { ArticleSkeleton } from '@/components/skeletons'

const isDark = useDark()
const route = useRoute()
const drawer = ref<boolean>(false)
const article = ref<Api.Article.ArticleInfo>()
const loading = ref(true)
const { width } = useWindowSize()

// 滚动容器
const scrollElement = document.documentElement
const editorId = 'markdown-preview'

// 计算：是否存在可生成目录的标题（1~6级markdown标题）
const hasCatalog = computed(() => {
    if (!article.value?.content) return false
    return /^#{1,6}\s+.+/m.test(article.value.content)
})

const getArticleById = async () => {
    loading.value = true
    try {
        if (route.name === 'Detail' && route.params.id) {
            const articleInfo = await ArticleService.getArticleInfoById(Number(route.params.id))
            article.value = articleInfo
        }
    } finally {
        loading.value = false
    }
}

watch(width, (val) => {
    if (val >= 1300) drawer.value = false
})

onMounted(async () => {
    await getArticleById()
})
</script>

<style lang="scss" scoped>
.detail {
    display: flex;
    z-index: 10000;
    gap: 10px;
    margin: 15px;

    .article-content {
        box-sizing: border-box;
        width: 100%;
        padding: 20px;
        background-color: var(--header-color);
        border: 1px solid var(--border-color);

        @media screen and (max-width: 1300px) {
            width: 100%;
        }

        .article {
            width: 100%;

            .article-detail {
                flex: 1;
                min-width: 0;

                &>h1 {
                    font-weight: bold;
                    margin-bottom: 20px;
                }

                .meta {
                    display: flex;
                    margin-bottom: 20px;
                    gap: 5px;

                    .author,
                    .publish-time,
                    .updated-time {
                        margin-right: 20px;
                        color: #8a919f;
                    }

                    @media screen and (max-width: $screen-medium) {
                        flex-direction: column;
                    }
                }
            }

            /* 目录容器：定宽 + 吸顶 + 居中提示文字 */
            .catalog-wrap {
                width: 220px;
                flex-shrink: 0;
                position: sticky;
                top: 105px;
                height: calc(100vh - 100px);
                overflow-y: auto;
                overflow-x: hidden;

                /* 小屏直接隐藏目录 */
                @media screen and (max-width: 1300px) {
                    display: none;
                }

                .empty-catalog {
                    color: #999;
                    font-size: 14px;
                }
            }
        }
    }

    .bar {
        display: none;
        flex-direction: column;
        gap: 5px;
        position: fixed;
        right: 50px;
        bottom: 50px;

        @media screen and (max-width: 1300px) {
            display: flex;
        }

        .contents-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--card-color);
            border: 1px solid var(--text-color);
            transition: all 0.5s;
        }
    }
}

/* 移动端抽屉暂无目录样式 */
.drawer-empty {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
}
</style>