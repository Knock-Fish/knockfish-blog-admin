<script setup lang="ts">
import { ref, shallowRef, shallowReactive, computed, onMounted } from 'vue'
import { ElButton, ElInput, ElSelect, ElOption } from 'element-plus'
import axios from '@/utils/http/axios'

interface Article {
  id: number
  title: string
  author: string
  category: string
  views: number
  createTime: string
  status: number
}

const searchKeyword = ref('')
const selectedCategory = ref('')
const loading = ref(false)

const rawData = shallowRef<Article[]>([])

const items = computed(() => {
  return rawData.value.filter(item => {
    const matchKeyword = !searchKeyword.value || item.title.includes(searchKeyword.value)
    const matchCategory = !selectedCategory.value || item.category === selectedCategory.value
    return matchKeyword && matchCategory
  })
})

const categories = shallowReactive<string[]>(['全部', '技术', '生活', '读书笔记', '工具推荐'])

const fetchArticles = async () => {
  loading.value = true
  try {
    const res: any = await axios.get({
      url: '/api/article/list',
      params: { page: 1, size: 100 },
      cache: true,
      ttl: 60000
    })
    rawData.value = res.data?.list || []
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (id: number, status: number) => {
  const article = rawData.value.find(item => item.id === id)
  if (article) {
    article.status = status
    await axios.put({
      url: `/api/article/${id}/status`,
      data: { status }
    })
  }
}

onMounted(() => {
  fetchArticles()
})
</script>

<template>
  <div class="performance-example">
    <div class="search-bar">
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索文章标题"
        style="width: 300px; margin-right: 16px;"
      />
      <ElSelect
        v-model="selectedCategory"
        placeholder="选择分类"
        style="width: 200px;"
      >
        <ElOption
          v-for="category in categories"
          :key="category"
          :label="category"
          :value="category === '全部' ? '' : category"
        />
      </ElSelect>
      <ElButton type="primary" @click="fetchArticles" :loading="loading">
        刷新数据
      </ElButton>
    </div>

    <div class="stats">
      <span>总数据量: {{ rawData.length.toLocaleString() }}</span>
      <span>筛选后: {{ items.length.toLocaleString() }}</span>
    </div>

    <div class="article-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="article-item"
      >
        <div class="article-title">{{ item.title }}</div>
        <div class="article-author">{{ item.author }}</div>
        <div class="article-category">{{ item.category }}</div>
        <div class="article-views">{{ item.views }}</div>
        <div class="article-time">{{ item.createTime }}</div>
        <ElButton
          :type="item.status === 1 ? 'success' : 'info'"
          size="small"
          @click="toggleStatus(item.id, item.status === 1 ? 0 : 1)"
        >
          {{ item.status === 1 ? '已发布' : '草稿' }}
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-example {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.stats {
  margin-bottom: 16px;
  display: flex;
  gap: 20px;
  color: #666;
}

.article-list {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.article-item {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid #f5f7fa;
  transition: background-color 0.2s;
}

.article-item:hover {
  background-color: #f5f7fa;
}

.article-title {
  flex: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-author,
.article-category,
.article-views,
.article-time {
  flex: 1;
  text-align: center;
}
</style>