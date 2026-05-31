<template>
    <div class="dashboard">
        <Statistic />
        <div class="chart-list">
            <div class="bar-chart">
                <VChart :option="barOption" autoresize />
            </div>
            <div class="line-chart">
                <VChart :option="lineOption" autoresize />
            </div>
        </div>
        <div class="tag-article">
            <div class="tag-cloud">
                <TagCloud />
            </div>
            <div class="article-latest">
                <ArticleLatest />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import Statistic from "./widget/Statistic.vue"
import ArticleLatest from "./widget/ArticleLatest.vue"
import TagCloud from "./widget/TagCloud.vue"
import VChart from 'vue-echarts'
import 'echarts'
const barOption = ref({
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
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
        type: 'value',
        name: '文章篇数'
    },
    series: [
        {
            name: '发布数量',
            type: 'bar',  // 柱状图，想看趋势改成 line 即可
            data: [28, 16, 35, 42, 38, 50, 45, 60, 52, 48, 55, 62],
            barWidth: '45%',
            itemStyle: {
                color: '#409EFF'
            }
        }
    ]
})


const lineOption = ref({
    title: {
        text: '折线图示例',
        textStyle: { fontSize: 14 }
    },
    xAxis: {
        data: ['周一', '周二', '周三', '周四', '周五'],
        axisLabel: { fontSize: 11 }
    },
    yAxis: {
        axisLabel: { fontSize: 11 }
    },
    series: [{ type: 'line', data: [120, 200, 150, 80, 70] }],
    grid: {
        containLabel: true,
        left: 10,
        right: 10,
        top: 40,
        bottom: 10
    }
})
</script>

<style lang="scss" scoped>
.dashboard {
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;

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

// 平板适配
@media (max-width: 1024px) and (min-width: 769px) {
    .dashboard {
        padding: 0 12px;

        .chart-list {
            gap: 12px;

            .bar-chart,
            .line-chart {
                height: 350px; // 平板稍微降低高度
            }
        }

        .tag-article {
            gap: 12px;
        }
    }
}

// 移动端适配
@media (max-width: 768px) {
    .dashboard {
        padding: 0 12px;

        .chart-list {
            flex-direction: column; // 改为垂直排列
            gap: 12px;
            margin-top: 12px;

            .bar-chart,
            .line-chart {
                width: 100%;
                height: 280px; // 移动端降低高度
                flex: none;
            }
        }

        .tag-article {
            flex-direction: column; // 改为垂直排列
            gap: 12px;
            margin-top: 12px;

            .article-latest,
            .tag-cloud {
                width: 100%;
                flex: none;
            }

            .tag-cloud {
                height: 400px;
                order: 1; // 标签云在上方
            }

            .article-latest {
                order: 2; // 最近文章在下方
            }
        }
    }
}

// 小屏手机适配（iPhone SE 等）
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

// 横屏适配
@media (max-width: 896px) and (orientation: landscape) {
    .dashboard {
        .chart-list {

            .bar-chart,
            .line-chart {
                height: 220px; // 横屏时降低高度
            }
        }
    }
}
</style>