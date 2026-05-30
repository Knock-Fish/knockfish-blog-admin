<template>
    <div class="chart">
        <VChart :option="articleOption" autoresize />
    </div>
</template>

<script setup lang='ts'>
import VChart from 'vue-echarts'
import 'echarts'
const articleOption = {
    title: { text: "月度发文量", left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: { data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] },
    yAxis: { type: "value" },
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
}
</script>

<style lang="scss" scoped>
.chart {
    width: 100%;
    height: 100%;
    @include card()
}
</style>