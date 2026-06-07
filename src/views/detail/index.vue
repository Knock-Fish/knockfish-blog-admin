<template>
    <div class="detail">
        <div class="article-content">
            <!-- 骨架屏 -->
            <ElSkeleton v-if="loading" animated :count="1">
                <template #template>
                    <div style="padding: 20px;">
                        <ElSkeletonItem variant="text" style="width: 60%; margin-bottom: 20px;" />
                        <ElSkeletonItem variant="text" style="width: 40%; margin-bottom: 30px;" />
                        <ElSkeletonItem variant="rect" style="width: 100%; height: 200px; margin-bottom: 30px;" />
                        <ElSkeletonItem variant="text" style="width: 100%; margin-bottom: 10px;" />
                        <ElSkeletonItem variant="text" style="width: 90%; margin-bottom: 10px;" />
                        <ElSkeletonItem variant="text" style="width: 85%; margin-bottom: 10px;" />
                        <ElSkeletonItem variant="text" style="width: 95%; margin-bottom: 10px;" />
                        <ElSkeletonItem variant="text" style="width: 80%;" />
                    </div>
                </template>
            </ElSkeleton>
            
            <!-- 文章内容 -->
            <ArticleDetail v-else :article="article" />
        </div>
        <div class="article-anchor">
            <ElAffix :offset="110">
                <ElCard shadow="never">
                    <template #header>
                        <div>
                            文章目录
                        </div>
                    </template>
                    <AnchorNav :headings="headings" />
                </ElCard>
            </ElAffix>
        </div>
        <div class="bar">
            <ElButton class="contents-btn" @click="drawer = true">
                <SvgIcon icon="mdi:table-of-contents"></SvgIcon>
            </ElButton>
        </div>
        <ElDrawer v-model="drawer" title="文章目录" append-to-body :z-index="10000"
            size="280px">
            <AnchorNav :headings="headings" />
        </ElDrawer>
    </div>
</template>

<script setup lang='ts'>
import { ElSkeleton, ElSkeletonItem } from 'element-plus'
import ArticleDetail from './widget/ArticleDetail.vue'
import AnchorNav from './widget/AnchorNav.vue'
type Article = Api.Article.ArticleInfo
import { useRouter, useRoute } from "vue-router"
import { ArticleService } from "@/api/articleApi"
const route = useRoute()
const drawer = ref<boolean>(false)
const article = ref<Article>()
const headings = ref<Array<{ id: string, text: string, level: number }>>([])
const loading = ref(true)
const { width } = useWindowSize()
const getArticleById = async () => {
    loading.value = true
    try {
        if (route.name === 'Detail' && route.params.id) {
            const articleInfo: Article = await ArticleService.getArticleInfoById(
                Number(route.params.id)
            )
            article.value = articleInfo
            headings.value = extractHeadingsFromHtml(articleInfo.content)
        }
    } finally {
        loading.value = false
    }
}
watch(width, (val) => {
  if (val >= 1300) drawer.value = false
})
// 提取标题的通用函数
const extractHeadingsFromHtml = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    return Array.from(elements).map((el, index) => ({
        id: el.id || `heading-${index}`,
        text: el.textContent || '',
        level: parseInt(el.tagName.substring(1))
    }))
}
onMounted(() => {
    getArticleById()
})
</script>

<style lang="scss" scoped>
.detail {
    display: flex;
    z-index: 10000;
    gap: 10px;
    margin: 10px auto;

    .article-content {
        box-sizing: border-box;
        width: 80%;
        padding: 20px;
        background-color: var(--header-color);
        border: 1px solid var(--border-color);

        @media screen and (max-width: 1300px) {
            width: 100%;
        }
    }

    .article-anchor {
        width: 20%;

        @media screen and (max-width: 1300px) {
            display: none;
        }

        .el-card {
            height: calc(100vh - 130px);
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
            background-color: #ffffff;
            border: 1px solid var(--text-color);
            transition: all 0.5s;
        }
    }
}
</style>
