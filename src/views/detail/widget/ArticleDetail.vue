<template>
    <div class="article-detail">
        <h1>{{ article?.title }}</h1>
        <div class="meta">
            <span class="author">作者：{{ article?.username }}</span>
            <time class="publish-time">时间：{{ article?.publishTime }}</time>
            <time class="updated-time" v-if="article?.updatedTime">最后修改时间：{{
                article?.updatedTime }}</time>
        </div>
        <div>
            <MdPreview :id="editorId" :modelValue="article?.content" />

            <MdCatalog :editorId="editorId" :scrollElement="scrollElement"
                :offsetTop="80" />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
const scrollElement = document.documentElement
type Article = Api.Article.ArticleInfo
// 1. 定义一个唯一且不变的 ID
const editorId = 'markdown-preview';
interface Props {
    article?: Article
}
const props = defineProps<Props>()
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