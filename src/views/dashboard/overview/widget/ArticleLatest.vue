<template>
    <div class="article-latest">
        <h4>最近文章</h4>
        <ul class="article-list">
            <li class="article-item" v-for="(item, index) in articleList"
                :key="index">
                <div class="article-title">{{ item.title }}</div>
                <div class="article-date">{{ item.date }}</div>
            </li>
        </ul>
    </div>
</template>

<script setup lang='ts'>
const articleList = [
    { title: 'Vue 3 组合式 API 最佳实践', date: '2024-01-15' },
    { title: 'TypeScript 类型系统深入解析', date: '2024-01-14' },
    { title: 'ECharts 图表组件封装技巧', date: '2024-01-13' },
    { title: 'Tailwind CSS 实用指南', date: '2024-01-12' },
    { title: '前端性能优化完全指南', date: '2024-01-11' },
    { title: 'Pinia 状态管理入门', date: '2024-01-10' },
    { title: 'Vite 插件开发教程', date: '2024-01-09' },
    { title: 'ES2024 新特性一览', date: '2024-01-08' },
    { title: '响应式设计最佳实践', date: '2024-01-07' },
    { title: 'WebAssembly 入门与实践', date: '2024-01-06' }
]
</script>

<style lang="scss" scoped>
.article-latest {
    @include card();

    h4 {
        margin-bottom: 12px;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-color);
        position: relative;
        padding-left: 10px;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
    }

    .article-list {
        list-style: none;
        padding: 0;
        margin: 0;

        .article-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
                transform: translateX(3px);

                .article-title {
                    color: #667eea;
                }
            }

            &:last-child {
                border-bottom: none;
            }

            .article-title {
                flex: 1;
                font-size: 13px;
                color: var(--text-color);
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: 10px;
                transition: color 0.3s ease;
            }

            .article-date {
                font-size: 11px;
                color: #999;
                white-space: nowrap;
                font-family: monospace;
            }
        }
    }
}

// 移动端适配
@media (max-width: 768px) {
    .article-latest {
        max-width: 100%;

        .article-list {
            .article-item {
                padding: 6px 0;

                .article-title {
                    font-size: 12px;
                }

                .article-date {
                    font-size: 10px;
                }
            }
        }
    }
}
</style>