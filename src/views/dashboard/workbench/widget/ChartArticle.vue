<template>
    <div class="article-chart" v-loading="loading">
        <VChart :option="articleOption" autoresize />
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import 'echarts';
import { DashboardService, type ArticleTrend } from '@/api/dashboardApi';

const articleOption = ref<any>({
    title: { text: "月度发文量", left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: { data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] },
    yAxis: { type: "value" },
    grid: {
        top: 35,
        left: 20,
        right: 20,
        bottom: 15,
        containLabel: true
    },
    series: [{
        type: "line",
        smooth: true,
        data: [28, 16, 35, 79, 38, 50, 45, 90, 25, 36, 76, 34],
        areaStyle: {
            color: {
                type: "linear",
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: "rgba(51, 144, 255, 0.5)" },
                    { offset: 1, color: "rgba(51, 144, 255, 0.1)" }
                ]
            }
        }
    }]
});

const loading = ref(true);

const fetchData = async () => {
    loading.value = true;
    try {
        const trend = await DashboardService.getArticleTrend({ period: 'monthly' });
        articleOption.value.xAxis.data = trend.labels;
        articleOption.value.series[0].data = trend.values;
    } catch (error) {
        console.error('ChartArticle fetch error:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchData();
});

defineExpose({ refresh: fetchData });
</script>

<style lang="scss" scoped>
.article-chart{
    width: 100%;
    height: 400px;
    @include card()
}
</style>