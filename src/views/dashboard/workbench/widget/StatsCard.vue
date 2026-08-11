<template>
    <div class="stats-card">
        <div class="stats-grid" v-loading="loading">
            <div class="stat-item" v-for="(stat, index) in stats" :key="index">
                <div class="stat-info">
                    <div class="stat-label">{{ stat.label }}</div>
                    <div class="stat-value">{{ stat.value }}</div>
                </div>
                <div class="stat-icon" :class="stat.iconBg">
                    <SvgIcon :icon="stat.icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import { DashboardService, type DashboardOverview } from '@/api/dashboardApi';
import { ElMessage } from 'element-plus';

interface Stat {
    label: string;
    value: string | number;
    icon: string;
    iconBg: string;
}

const stats = ref<Stat[]>([
    { label: '今日发布', value: '0', icon: 'mdi:calendar-check', iconBg: 'bg-green' },
    { label: '文章总数', value: '0', icon: 'mdi:file-document-outline', iconBg: 'bg-blue' },
    { label: '草稿数量', value: '0', icon: 'mdi:file-edit-outline', iconBg: 'bg-orange' }
]);
const loading = ref(true);

const fetchStats = async () => {
    loading.value = true;
    try {
        const overview = await DashboardService.getOverview();
        stats.value = [
            {
                label: '今日发布',
                value: '0',
                icon: 'mdi:calendar-check',
                iconBg: 'bg-green'
            },
            {
                label: '文章总数',
                value: overview.totalArticles,
                icon: 'mdi:file-document-outline',
                iconBg: 'bg-blue'
            },
            {
                label: '草稿数量',
                value: overview.draftCount,
                icon: 'mdi:file-edit-outline',
                iconBg: 'bg-orange'
            }
        ];
    } catch (error) {
        ElMessage.error('获取统计数据失败');
        console.error('StatsCard fetch error:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchStats();
});

defineExpose({ refresh: fetchStats });
</script>

<style lang="scss" scoped>
.stats-card {
    overflow: hidden;
    height: 100%;
    .stats-grid {
        display: flex;
        gap: 10px;
        height: 100%;

        .stat-item {
            box-sizing: border-box;
            display: flex;
            flex: 1;
            justify-content: space-between;
            align-items: center;
            background-color: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: 7px;
            color: var(--text-color);
            padding: 15px 20px;

            .stat-icon {
                background-color: rgba(185, 214, 255, 0.8);
                width: 44px;
                height: 44px;
                border-radius: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #fff;
            }

            .stat-info {
                text-align: center;

                .stat-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .stat-label {
                    font-size: 13px;
                    color: var(--text-color-secondary);
                    margin-top: 4px;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .stats-card .stats-grid {
        flex-direction: column;
    }
}
</style>