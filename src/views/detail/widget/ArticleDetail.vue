<template>
    <div class="article-detail">
        <h1>{{ article?.title }}</h1>
        <div class="meta">
            <span class="author">作者：{{ article?.username }}</span>
            <time class="publish-time">时间：{{ article?.publishTime }}</time>
            <time class="updated-time" v-if="article?.updatedTime">最后修改时间：{{
                article?.updatedTime }}</time>
        </div>
        <div class="markdown-body" v-html="processedHtml" v-enhance-code></div>
    </div>
</template>

<script setup lang='ts'>
import '@/assets/style/markdown.scss'
import '@/assets/style/one-dark-pro.scss'
type Article = Api.Article.ArticleInfo
interface Props {
    article?: Article
}
const props = defineProps<Props>()
import "prismjs/themes/prism-tomorrow.min.css"
import Prism from 'prismjs'
onMounted(() => {
    nextTick()
    Prism.highlightAll()
})
onUpdated(() => {
    Prism.highlightAll()
})
// 处理 HTML，为标题添加 ID
const processedHtml = computed(() => {
    if (!props.article?.content) return ''

    let html = props.article.content
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

    headings.forEach(tag => {
        const regex = new RegExp(`<${tag}([^>]*)>(.*?)</${tag}>`, 'gi')
        html = html.replace(regex, (match, attrs, content) => {
            // 检查是否已经有 id
            if (attrs.includes('id=')) return match

            // 生成 id：移除特殊字符，转为小写，用短横线连接
            const id = content
                .replace(/<[^>]*>/g, '') // 移除 HTML 标签
                .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-') // 替换特殊字符
                .replace(/-+/g, '-') // 合并多个短横线
                .replace(/^-|-$/g, '') // 移除首尾短横线
                .toLowerCase()
                || `heading-${Date.now()}-${Math.random()}`

            return `<${tag} id="${id}"${attrs}>${content}</${tag}>`
        })
    })
    return html
})

</script>

<style lang="scss" scoped>
.article-detail {
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
</style>