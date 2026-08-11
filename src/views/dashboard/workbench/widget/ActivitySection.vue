<template>
    <div class="activity-section" v-loading="loading">
        <div class="section-header">
            <h3 class="section-title">
                最近动态
            </h3>
            <ElButton link class="more-btn">查看全部</ElButton>
        </div>
        <div class="activity-list">
            <ElTimeline>
                <ElTimelineItem :timestamp="activity.time"
                    v-for="(activity, index) in activities" :key="index"
                    placement="top">
                    <div class="activity-item">
                        <div class="activity-icon" :class="activity.type">
                            <SvgIcon :icon="activity.icon" />
                        </div>
                        <div class="activity-content">
                            <p class="activity-desc">{{ activity.description }}
                            </p>
                            <p class="activity-time">{{ activity.time }}</p>
                        </div>
                    </div>
                </ElTimelineItem>
            </ElTimeline>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import { DashboardService, type ActivityItem } from '@/api/dashboardApi';

interface Activity {
    type: string;
    icon: string;
    description: string;
    time: string;
}

const activities = ref<Activity[]>([]);
const loading = ref(true);

const getActivityType = (type: string) => {
    const typeMap: Record<string, { type: string; icon: string }> = {
        'article_publish': { type: 'success', icon: 'mdi:check-circle' },
        'article_update': { type: 'info', icon: 'mdi:file-edit' },
        'tag_create': { type: 'info', icon: 'mdi:tag-plus' },
        'site_add': { type: 'info', icon: 'mdi:globe' },
    };
    return typeMap[type] || { type: 'info', icon: 'mdi:information' };
};

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const now = new Date();
    const time = new Date(timeStr);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return timeStr.substring(0, 10);
};

const fetchActivities = async () => {
    loading.value = true;
    try {
        const activityItems = await DashboardService.getActivities({ limit: 10 });
        activities.value = activityItems.map(item => {
            const activityType = getActivityType(item.type);
            return {
                type: activityType.type,
                icon: activityType.icon,
                description: `${item.title}《${item.content}》`,
                time: formatTime(item.time)
            };
        });
    } catch (error) {
        console.error('ActivitySection fetch error:', error);
        activities.value = [
            { type: 'success', icon: 'mdi:check-circle', description: '文章《Vue3 学习笔记》已发布成功', time: '5分钟前' },
            { type: 'info', icon: 'mdi:user-plus', description: '新用户「小明」注册成功', time: '15分钟前' },
            { type: 'warning', icon: 'mdi:alert-circle', description: '评论内容需要审核', time: '30分钟前' },
            { type: 'success', icon: 'mdi:upload', description: '图片上传成功', time: '1小时前' },
            { type: 'info', icon: 'mdi:settings', description: '系统配置已更新', time: '2小时前' },
        ];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchActivities();
});

defineExpose({ refresh: fetchActivities });
</script>

<style lang="scss" scoped>
.activity-section {
    box-sizing: border-box;
    background: var(--card-color);
    height: 557px;
    border-radius: 12px;
    padding: 15px;
    border: 1px solid var(--border-color);
    overflow-y: auto;
    scrollbar-width: none;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .section-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color);
    }

    .more-btn {
        font-size: 13px;
        color: var(--el-color-primary);
        padding: 0;
    }
}

.activity-list {
    margin-top: 20px;
    :deep(.el-timeline){
        padding-left: 0;
    }
    .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;

        .activity-icon {
            width: 35px;
            height: 35px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;

            &.success {
                background-color: var(--el-color-success-light-9);
                color: var(--el-color-success);
            }

            &.info {
                background-color: var(--el-color-info-light-9);
                color: var(--el-color-info);
            }

            &.warning {
                background-color: var(--el-color-warning-light-9);
                color: var(--el-color-warning);
            }
        }

        .activity-content {
            flex: 1;

            .activity-desc {
                font-size: 13px;
                color: var(--text-color);
                margin: 0;
                margin-bottom: 4px;
            }

            .activity-time {
                font-size: 11px;
                color: var(--text-color-secondary);
                margin: 0;
            }
        }
    }
}
</style>