<template>
    <div class="dashboard">
        <Statistic ref="statisticRef" />
        <div class="chart-list">
            <div class="bar-chart" v-loading="chartLoading">
                <VChart :option="barOption" autoresize />
            </div>
            <div class="line-chart" v-loading="chartLoading">
                <VChart :option="lineOption" autoresize />
            </div>
        </div>
        <div class="tag-article">
            <div class="tag-cloud">
                <TagCloud ref="tagCloudRef" />
            </div>
            <div class="article-latest">
                <ArticleLatest ref="articleLatestRef" />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, shallowRef } from 'vue';
import Statistic from "./widget/Statistic.vue";
import ArticleLatest from "./widget/ArticleLatest.vue";
import TagCloud from "./widget/TagCloud.vue";
import VChart from 'vue-echarts';
import 'echarts';
import { DashboardService, type ArticleTrend } from '@/api/dashboardApi';

const statisticRef = shallowRef<InstanceType<typeof Statistic>>();
const tagCloudRef = shallowRef<InstanceType<typeof TagCloud>>();
const articleLatestRef = shallowRef<InstanceType<typeof ArticleLatest>>();

const barOption = ref<any>(null);
const lineOption = ref<any>(null);
const chartLoading = ref(true);

const initBarChart = (trend: ArticleTrend) => {
    barOption.value = {
        title: {
            text: '月度文章发布数量统计',
            left: 'center',
            textStyle: { fontSize: 16 }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: trend.labels
        },
        yAxis: {
            type: 'value',
            name: '文章篇数'
        },
        series: [
            {
                name: '发布数量',
                type: 'bar',
                data: trend.values,
                barWidth: '45%',
                itemStyle: {
                    color: '#409EFF'
                }
            }
        ]
    };
};

const initLineChart = (trend: ArticleTrend) => {
    lineOption.value = {
        title: {
            text: '文章发布趋势',
            textStyle: { fontSize: 14 }
        },
        xAxis: {
            data: trend.labels.slice(-7),
            axisLabel: { fontSize: 11 }
        },
        yAxis: {
            axisLabel: { fontSize: 11 }
        },
        series: [{ type: 'line', data: trend.values.slice(-7) }],
        grid: {
            containLabel: true,
            left: 10,
            right: 10,
            top: 40,
            bottom: 10
        }
    };
};

const fetchChartsData = async () => {
    chartLoading.value = true;
    try {
        const trend = await DashboardService.getArticleTrend({ period: 'monthly' });
        initBarChart(trend);
        initLineChart(trend);
    } catch (error) {
        console.error('Chart data fetch error:', error);
        const mockLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const mockValues = [28, 16, 35, 42, 38, 50, 45, 60, 52, 48, 55, 62];
        initBarChart({ labels: mockLabels, values: mockValues, period: 'monthly', year: new Date().getFullYear() });
        initLineChart({ labels: mockLabels, values: mockValues, period: 'monthly', year: new Date().getFullYear() });
    } finally {
        chartLoading.value = false;
    }
};

const refreshAll = () => {
    statisticRef.value?.refresh();
    tagCloudRef.value?.refresh();
    articleLatestRef.value?.refresh();
    fetchChartsData();
};

onMounted(() => {
    fetchChartsData();
});
</script>

<style lang="scss" scoped>
.dashboard {
    box-sizing: border-box;
    overflow: hidden;
    margin: 15px;

    .chart-list {
        display: flex;
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
        margin-top: 15px;

        .bar-chart {
            @include card();
            flex: 1.5;
            height: 400px;
        }

        .line-chart {
            @include card();
            flex: 2;
            height: 400px;
        }
    }

    .tag-article {
        display: flex;
        width: 100%;
        margin-top: 15px;
        gap: 10px;

        .article-latest {
            flex: 0.7;
        }

        .tag-cloud {
            flex: 2;
        }
    }
}

@media (max-width: 1024px) and (min-width: 769px) {
    .dashboard {
        padding: 0 12px;

        .chart-list {
            gap: 12px;

            .bar-chart,
            .line-chart {
                height: 350px;
            }
        }

        .tag-article {
            gap: 12px;
        }
    }
}

@media (max-width: 768px) {
    .dashboard {
        padding: 0 12px;

        .chart-list {
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;

            .bar-chart,
            .line-chart {
                width: 100%;
                height: 280px;
                flex: none;
            }
        }

        .tag-article {
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;

            .article-latest,
            .tag-cloud {
                width: 100%;
                flex: none;
            }

            .tag-cloud {
                height: 400px;
                order: 1;
            }

            .article-latest {
                order: 2;
            }
        }
    }
}

@media (max-width: 480px) {
    .dashboard {
        padding: 0 10px;

        .chart-list {
            gap: 10px;
            margin-top: 10px;

            .bar-chart,
            .line-chart {
                height: 240px;
            }
        }

        .tag-article {
            gap: 10px;
            margin-top: 10px;
        }
    }
}

@media (max-width: 896px) and (orientation: landscape) {
    .dashboard {
        .chart-list {
            .bar-chart,
            .line-chart {
                height: 220px;
            }
        }
    }
}
</style>