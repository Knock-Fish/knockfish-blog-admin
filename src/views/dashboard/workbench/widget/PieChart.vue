<template>
  <div class="pie-chart">
    <VChart :option="pieOption" autoresize />
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'

const pieOption = {
  title: {
    text: '文章分类占比',
    left: 'center',
    textStyle: { fontSize: 14 }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{b}：{c} 篇 ({d}%)'
  },
  // 收紧空白
  grid: {
    top: 30,
    left: 10,
    right: 10,
    bottom: 10
  },
  series: [
    {
      name: '文章分类',
      type: 'pie',
      radius: ['45%', '70%'], // 内圈、外圈大小，做成环形
      center: ['50%', '55%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4 // 区块圆角，更柔和
      },
      label: {
        show: true,
        position: 'outside',
        fontSize: 11
      },
      // 中间显示总数
      labelLine: {
        length: 8,
        length2: 12
      },
      data: [
        { name: '前端技术', value: 42 },
        { name: '后端开发', value: 35 },
        { name: '随笔日记', value: 20 },
        { name: '工具教程', value: 18 },
        { name: '其他', value: 10 }
      ],
      // 配色和你折线图统一风格
      color: ['#3390ff', '#67C23A', '#E6A23C', '#9C88FF', '#909399']
    }
  ]
}
</script>

<style lang="scss" scoped>
.pie-chart {
  width: 100%;
  height: 300px;
  @include card();
}
</style>