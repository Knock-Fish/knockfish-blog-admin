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
        text: '柱状图示例',
        textStyle: { fontSize: 14 } // 移动端缩小标题
    },
    xAxis: { 
        data: ['周一', '周二', '周三', '周四', '周五'],
        axisLabel: { fontSize: 11 } // 移动端缩小坐标轴文字
    },
    yAxis: {
        axisLabel: { fontSize: 11 }
    },
    series: [{ type: 'bar', data: [120, 200, 150, 80, 70] }],
    grid: {
        containLabel: true,
        left: 10,
        right: 10,
        top: 40,
        bottom: 10
    }
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
        gap: 15px;
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
        gap: 15px;

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