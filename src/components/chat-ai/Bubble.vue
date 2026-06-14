<template>
    <div class="bubble-item"
        :class="[`placement-${placement}`, { 'is-markdown': isMarkdown }]">
        <div class="bubble-avatar" v-if="showAvatar">
            <SvgIcon
                :icon="placement === 'start' ? 'mdi:robot' : 'mdi:account-circle'"
                size="32px" />
        </div>
        <div class="bubble-content">
            <div class="bubble-text">
                <div v-if="isMarkdown" v-html="renderedContent"
                    class="markdown-content"></div>
                <div v-else>{{ content }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { marked } from 'marked'

const props = withDefaults(defineProps<{
    content?: string
    placement?: 'start' | 'end'
    isMarkdown?: boolean
    showAvatar?: boolean
}>(), {
    content: '',
    placement: 'start',
    isMarkdown: false,
    showAvatar: false
})

// 渲染后的内容（使用防抖）
const renderedContent = ref('')
let renderTimer: number | null = null
let lastContent = ''

// 防抖渲染Markdown
const renderMarkdownDebounced = (text: string) => {
    if (!text) {
        renderedContent.value = ''
        return
    }
    
    // 清除之前的定时器
    if (renderTimer) {
        clearTimeout(renderTimer)
    }
    
    // 如果内容变化不大，立即渲染
    if (text.length - lastContent.length < 50) {
        try {
            renderedContent.value = marked.parse(text) as string
            lastContent = text
        } catch {
            renderedContent.value = text
        }
        return
    }
    
    // 否则延迟渲染（防抖）
    renderTimer = window.setTimeout(() => {
        try {
            renderedContent.value = marked.parse(text) as string
            lastContent = text
        } catch {
            renderedContent.value = text
        }
        renderTimer = null
    }, 100)
}

// 监听内容变化
watch(() => props.content, (newContent) => {
    if (props.isMarkdown) {
        renderMarkdownDebounced(newContent)
    }
}, { immediate: true })

// 清理定时器
onUnmounted(() => {
    if (renderTimer) {
        clearTimeout(renderTimer)
    }
})
</script>

<style lang="scss" scoped>
.bubble-item {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    animation: fadeIn 0.3s ease;

    // 头像区域
    .bubble-avatar {
        flex-shrink: 0;
        color: var(--icon-color, #666);
    }

    // 内容区域
    .bubble-content {
        max-width: 70%;
        display: flex;
        flex-direction: column;
    }

    // 文本气泡
    .bubble-text {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        word-break: break-word;
        transition: all 0.2s ease;
    }
}

// 淡入动画
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// 左侧气泡（他人消息）
.placement-start {
    justify-content: flex-start;

    .bubble-content {
        align-items: flex-start;
    }

    .bubble-text {
        background-color: var(--card-color, #f5f5f5);
        // border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 12px 12px 12px 4px;
        color: var(--text-color, #333);
    }
}

// 右侧气泡（自己消息）
.placement-end {
    flex-direction: row-reverse;
    justify-content: flex-start;

    .bubble-content {
        align-items: flex-end;
    }

    .bubble-text {
        background-color: var(--card-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 12px 12px 4px 12px;
    }
}

// Markdown 内容样式
.is-markdown {
    .bubble-text {
        padding: 16px;
    }
}

// 深度选择器：穿透 v-html 渲染的内容
:deep(.markdown-content) {

    // 重置默认样式
    &>*:first-child {
        margin-top: 0;
    }

    &>*:last-child {
        margin-bottom: 0;
    }

    // 标题样式
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        font-weight: 600;
        margin: 12px 0 8px;
        line-height: 1.4;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    h1 {
        font-size: 1.6em;
    }

    h2 {
        font-size: 1.4em;
    }

    h3 {
        font-size: 1.2em;
    }

    h4 {
        font-size: 1.1em;
    }

    h5,
    h6 {
        font-size: 1em;
    }

    // 段落
    p {
        margin: 8px 0;
        line-height: 1.6;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    // 行内代码
    code {
        background-color: rgba(0, 0, 0, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        color: var(--code-color, #e83e8c);
    }

    // 代码块
    pre {
        background-color: #454545;
        color: #ffffff;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 10px 0;

        code {
            background: none;
            padding: 0;
            color: inherit;
            font-size: 0.9em;
        }
    }

    // 引用
    blockquote {
        border-left: 3px solid var(--primary-color, #409eff);
        padding-left: 12px;
        margin: 10px 0;
        color: var(--text-color-secondary, #666);
        font-style: italic;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    // 列表
    ul,
    ol {
        padding-left: 24px;
        margin: 8px 0;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    li {
        margin: 4px 0;
        line-height: 1.6;
    }

    // 链接
    a {
        color: var(--link-color, #409eff);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            text-decoration: underline;
            color: var(--link-hover-color, #66b1ff);
        }
    }

    // 图片
    img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 8px;
        margin: 8px 0;
        display: block;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    // 表格
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;

        th,
        td {
            border: 1px solid var(--border-color, #e0e0e0);
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: rgba(0, 0, 0, 0.03);
            font-weight: 600;
        }
    }

    // 分割线
    hr {
        margin: 16px 0;
        border: none;
        border-top: 1px solid var(--border-color, #e0e0e0);
    }

    // 强调
    strong {
        font-weight: 600;
    }

    em {
        font-style: italic;
    }
}
</style>