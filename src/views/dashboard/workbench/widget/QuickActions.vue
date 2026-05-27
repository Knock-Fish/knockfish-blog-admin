<template>
    <div class="quick-actions">
        <div class="actions-header">
            <h3 class="header-title">快捷功能</h3>
        </div>
        <div class="actions-grid">
            <div class="action-item" v-for="action in quickActions" :key="action.title" @click="handleAction(action)">
                <div class="action-icon" :class="action.bgClass">
                    <SvgIcon :icon="action.icon" />
                </div>
                <div class="action-text">
                    <p class="action-title">{{ action.title }}</p>
                    <p class="action-description" style="font-size: 10px;">{{ action.description }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ElMessage } from 'element-plus'

const quickActions = ref([
    {
        title: '写文章',
        icon: 'mdi:file-edit',
        bgClass: 'action-blue',
        description: '写一篇新文章'
    },
    {
        title: '站点分类',
        icon: 'mdi:folder',
        bgClass: 'action-green',
        description: '管理站点分类'
    },
    {
        title: '文章标签',
        icon: 'mdi:tag',
        bgClass: 'action-purple',
        description: '文章相关标签'
    },
    {
        title: '文件管理',
        icon: 'mdi:folder-open',
        bgClass: 'action-orange',
        description: '管理文章文件'
    },
    {
        title: '系统设置',
        icon: 'mdi:settings',
        bgClass: 'action-gray',
        description: '配置管理系统参数'
    },
    {
        title: '用户管理',
        icon: 'mdi:users',
        bgClass: 'action-cyan',
        description: '管理系统用户'
    }
])

const handleAction = (action: { title: string }) => {
    ElMessage.info(`点击了：${action.title}`)
}
</script>

<style lang="scss" scoped>
.quick-actions {
    background: var(--card-color);
    border-radius: 7px;
    border: 1px solid var(--border-color);
    overflow: hidden;
    padding: 15px;

    .actions-header {
        box-sizing: border-box;
        padding-bottom: 20px;

        .header-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
        }

    }

    .actions-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;

        .action-item {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s ease;

            .action-icon {
                width: 44px;
                height: 44px;
                border-radius: 11px;
                background-color: var(--el-color-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #fff;
            }

            .action-text {
                .action-title {
                    font-size: 10px;
                    color: var(--text-color);
                    margin-bottom: 5px;
                    font-weight: bold;
                }

                .action-description {
                    font-size: 8px;
                    color: var(--text-color);
                }
            }
        }
    }
}
</style>