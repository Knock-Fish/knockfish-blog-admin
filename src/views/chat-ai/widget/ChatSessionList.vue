<template>
    <Conversations
        v-model="activeKeyModel"
        :items="items"
        groupable
        :label-max-width="200"
        :show-tooltip="false"
        row-key="id"
        show-built-in-menu
        @select="(item) => emit('select', item as unknown as ConversationItem)"
        @edit="(item) => emit('edit', item as unknown as ConversationItem)"
        @delete="(item) => emit('delete', item as unknown as ConversationItem)">
        <template #header>
            <div :class="headerClass">
                <ElButton type="primary" size="small" @click="emit('new')">新对话</ElButton>
                <ElButton
                    v-if="showToggle"
                    class="toggle-btn"
                    :class="{ 'expanded': expanded }"
                    @click="emit('toggle')">
                    <SvgIcon icon="mdi:dock-left"></SvgIcon>
                </ElButton>
            </div>
        </template>
    </Conversations>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Conversations } from '@/components/chat-ai'
import type { ConversationItem } from '../types'

const props = withDefaults(
    defineProps<{
        items: ConversationItem[]
        modelValue: string
        headerClass?: string
        showToggle?: boolean
        expanded?: boolean
    }>(),
    {
        headerClass: '',
        showToggle: false,
        expanded: false,
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
    select: [item: ConversationItem]
    edit: [item: ConversationItem]
    delete: [item: ConversationItem]
    new: []
    toggle: []
}>()

const activeKeyModel = computed({
    get: () => props.modelValue,
    set: (v: string) => emit('update:modelValue', v),
})
</script>
