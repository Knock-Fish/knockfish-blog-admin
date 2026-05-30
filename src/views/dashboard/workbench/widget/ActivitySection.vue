<template>
    <div class="activity-section">
        <div class="section-header">
            <h3 class="section-title">
                最近动态
            </h3>
            <ElButton type="text" class="more-btn">查看全部</ElButton>
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
const activities = ref([
    {
        type: 'success',
        icon: 'mdi:check-circle',
        description: '文章《Vue3 学习笔记》已发布成功',
        time: '5分钟前'
    },
    {
        type: 'info',
        icon: 'mdi:user-plus',
        description: '新用户「小明」注册成功',
        time: '15分钟前'
    },
    {
        type: 'warning',
        icon: 'mdi:alert-circle',
        description: '评论内容需要审核',
        time: '30分钟前'
    },
    {
        type: 'success',
        icon: 'mdi:upload',
        description: '图片上传成功',
        time: '1小时前'
    },
    {
        type: 'info',
        icon: 'mdi:settings',
        description: '系统配置已更新',
        time: '2小时前'
    },
])
</script>

<style lang="scss" scoped>
.activity-section {
    box-sizing: border-box;
    background: var(--card-color);
    height: 505px;
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
        /* border-bottom: 1px solid var(--border-color); */


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