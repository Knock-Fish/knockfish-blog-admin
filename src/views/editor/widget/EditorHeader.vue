<template>
    <ElPageHeader icon="" title="返回" @back="onBack">
        <template #icon>
            <SvgIcon icon="mdi:arrow-left-bold" />
        </template>
        <template #content>
            <span style="font-size: 14px;">
                稿件状态：
                <ElTag :type="status === 'PUBLISH' ? 'success' : 'info'">
                    {{ status === 'PUBLISH' ? '已发布' : '草稿' }}
                </ElTag>
            </span>
        </template>
        <template #extra>
            <div class="flex items-center">
                <ElBadge :value="draftCount" :show-zero="false" style="margin-right: 12px;">
                    <ElButton @click="$emit('open-drawer')">暂存箱</ElButton>
                </ElBadge>
                <ElButton @click="$emit('save-draft')">保存草稿</ElButton>
                <ElButton type="primary" @click="$emit('publish')">立即发布</ElButton>
            </div>
        </template>
    </ElPageHeader>
</template>

<script setup lang='ts'>
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps<{
    status: string
    draftCount: number
}>()

defineEmits<{
    (e: 'open-drawer'): void
    (e: 'save-draft'): void
    (e: 'publish'): void
}>()

const onBack = () => {
    router.back()
}
</script>
