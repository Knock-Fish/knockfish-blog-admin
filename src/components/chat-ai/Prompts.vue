<template>
    <div class="prompts">
        <div class="prompts-header">
            <SvgIcon icon="mdi:lightbulb-outline" size="16px" />
            <span>{{ title }}</span>
        </div>
        <div class="prompts-grid">
            <ElButton
                v-for="prompt in prompts"
                :key="prompt.key"
                type="text"
                class="prompt-btn"
                @click="handleClick(prompt)"
            >
                <SvgIcon :icon="prompt.icon || 'mdi:message-circle-outline'" size="16px" />
                <span>{{ prompt.label }}</span>
            </ElButton>
        </div>
    </div>
</template>

<script setup lang='ts'>
export interface PromptItem {
    key: string
    label: string
    icon?: string
    value?: string
}

const props = withDefaults(defineProps<{
    title?: string
    prompts?: PromptItem[]
}>(), {
    title: '推荐问题',
    prompts: () => []
})

const emit = defineEmits<{
    (e: 'select', prompt: PromptItem): void
}>()

const handleClick = (prompt: PromptItem) => {
    emit('select', prompt)
}
</script>

<style lang="scss" scoped>
.prompts {
    background-color: var(--card-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
}

.prompts-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
}

.prompts-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.prompt-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: var(--hover-bg-color);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-color-secondary);
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--primary-color);
        color: #fff;

        svg {
            color: #fff;
        }
    }

    svg {
        color: var(--icon-color);
        flex-shrink: 0;
    }
}
</style>
