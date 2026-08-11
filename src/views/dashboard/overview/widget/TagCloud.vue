<template>
    <div class="word-cloud-card">
        <h4>博客标签词云</h4>
        <div v-loading="loading" style="height: calc(100% - 40px);">
            <Vue3WordCloud style="height: 100%;" :words="words" :color="colorFn"
                font-family="Microsoft YaHei" :show-tooltip="true"
                @word-click="handleWordClick" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Vue3WordCloud from 'vue3-word-cloud';
import { DashboardService, type TagCloudItem } from '@/api/dashboardApi';
import { ElMessage } from 'element-plus';

const words = ref<[string, number][]>([]);
const loading = ref(true);

const colorFn = ([, weight]: [string, number]) => {
    if (weight >= 90) return '#f56c6c';
    if (weight >= 70) return '#e6a23c';
    if (weight >= 60) return '#409eff';
    return '#67c23a';
};

const handleWordClick = (word: [string, number]) => {
    console.log('点击了：', word[0], '权重：', word[1]);
};

const fetchTagCloud = async () => {
    loading.value = true;
    try {
        const tags = await DashboardService.getTagCloud();
        const maxCount = Math.max(...tags.map(t => t.articleCount), 1);
        words.value = tags.map(tag => [
            tag.tagName,
            Math.round((tag.articleCount / maxCount) * 100) || 10
        ] as [string, number]);
    } catch (error) {
        ElMessage.error('获取标签云数据失败');
        console.error('Tag cloud fetch error:', error);
        words.value = [
            ['Vue3', 10], ['TypeScript', 9], ['ECharts', 8], ['Node.js', 7], ['Vite', 7],
            ['前端', 9], ['博客', 8], ['仪表盘', 6], ['API', 5], ['组件封装', 6]
        ];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchTagCloud();
});

defineExpose({ refresh: fetchTagCloud });
</script>

<style lang="scss" scoped>
.word-cloud-card {
    width: 100%;
    height: 100%;
    @include card();

    h4 {
        margin-bottom: 12px;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-color);
        position: relative;
        padding-left: 10px;
        
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
    }
}
</style>