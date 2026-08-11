<template>
    <el-row :gutter="15" class="card-list" v-loading="loading">
        <el-col v-for="(item, index) in dataList" :key="index" :sm="12" :md="6"
            :lg="6">
            <div class="custom-card">
                <el-statistic class="box-title" :value="item.num">
                    <template #title>
                        <span class="des subtitle">{{ item.des }}</span>
                    </template>
                </el-statistic>

                <div class="change-box">
                    <span class="change-text">较上周</span>
                    <span class="change"
                        :class="[item.change.indexOf('+') === -1 ? 'text-danger' : 'text-success']">
                        {{ item.change }}
                    </span>
                </div>
                <div class="iconfont-sys">
                    <SvgIcon :icon="item.icon"></SvgIcon>
                </div>
            </div>
        </el-col>
    </el-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { DashboardService, type DashboardOverview } from "@/api/dashboardApi";
import { ElMessage } from "element-plus";

interface StatItem {
    des: string;
    icon: string;
    num: number;
    change: string;
}

const dataList = ref<StatItem[]>([]);
const loading = ref(true);

const mapOverviewToStats = (overview: DashboardOverview): StatItem[] => [
    {
        des: '总访问次数',
        icon: 'mdi:account-eye',
        num: overview.totalVisits,
        change: overview.visitChange
    },
    {
        des: '文章总数量',
        icon: 'mdi:file-document-outline',
        num: overview.totalArticles,
        change: overview.articleChange
    },
    {
        des: '标签总数量',
        icon: 'mdi:tag-outline',
        num: overview.totalTags,
        change: overview.tagChange
    },
    {
        des: '收藏站点总数量',
        icon: 'mdi:sitemap-outline',
        num: overview.totalSites,
        change: overview.siteChange
    }
];

const fetchOverview = async () => {
    loading.value = true;
    try {
        const overview = await DashboardService.getOverview();
        dataList.value = mapOverviewToStats(overview);
    } catch (error) {
        ElMessage.error('获取统计数据失败');
        console.error('Dashboard overview fetch error:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchOverview();
});

defineExpose({ refresh: fetchOverview });
</script>

<style lang="scss" scoped>
.card-list {
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    background-color: transparent !important;

    .custom-card {
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        height: 140px;
        padding: 0 18px;
        list-style: none;
        transition: all 0.3s ease;
        background-color: var(--card-color);
        border: 1px solid var(--border-color);
        border-radius: 15px;
        $icon-size: 52px;

        .el-statistic {
            :deep(.el-statistic__number) {
                display: block;
                margin-top: 10px;
                font-size: 28px;
                font-weight: 400;
            }
        }

        .iconfont-sys {
            position: absolute;
            top: 0;
            right: 20px;
            bottom: 0;
            width: $icon-size;
            height: $icon-size;
            margin: auto;
            overflow: hidden;
            font-size: 22px;
            line-height: $icon-size;
            color: var(--el-color-primary) !important;
            text-align: center;
            background-color: var(--el-color-primary-light-9);
            border-radius: 12px;
        }

        .des {
            display: block;
            height: 14px;
            font-size: 14px;
            line-height: 14px;
        }

        .change-box {
            display: flex;
            align-items: center;
            margin-top: 10px;

            .change-text {
                display: block;
                font-size: 13px;
                color: var(--text-color);
            }

            .change {
                display: block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: bold;

                &.text-success {
                    color: var(--el-color-success);
                }

                &.text-danger {
                    color: var(--el-color-danger);
                }
            }
        }
    }
}

.dark {
    .card-list {
        .art-custom-card {
            .iconfont-sys {
                background-color: #232323 !important;
            }
        }
    }
}
</style>