<!-- <template>
    <div class="bar-chart">
        <BaseVchart :option="barOption" autoresize />
    </div>
</template>

<script setup lang='ts'>
import type { EChartsOption } from 'echarts'
const barOption = ref<EChartsOption>({
    title: { text: '柱状图示例' },
    xAxis: { data: ['周一', '周二', '周三', '周四', '周五'] },
    yAxis: {},
    series: [{ type: 'bar', data: [120, 200, 150, 80, 70] }]
})

</script>

<style lang="scss" scoped>
.bar-chart{
    @include card()
}
</style> -->