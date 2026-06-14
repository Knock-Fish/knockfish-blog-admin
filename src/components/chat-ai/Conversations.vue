<template>
    <div class="conversations">
        <div class="conversations-header" v-if="$slots.header">
            <slot name="header"></slot>
        </div>
        
        <div class="conversations-list">
            <template v-for="(group, groupName) in groupedItems" :key="groupName">
                <div v-if="groupable && groupName" class="group-header">
                    {{ groupName }}
                </div>
                <div
                    v-for="item in group"
                    :key="getItemKey(item)"
                    class="conversation-item"
                    :class="{ 'active': getItemKey(item) === modelValue }"
                    @click="handleItemClick(item)"
                >
                    <div class="item-label" :style="labelStyle">
                        <SvgIcon icon="mdi:message-outline" size="16px" />
                        <span :title="showTooltip ? item.label : undefined">{{ item.label }}</span>
                    </div>
                    <div v-if="showBuiltInMenu" class="item-actions">
                        <ElDropdown trigger="click" @command="(cmd) => handleMenuCommand(cmd, item)">
                            <SvgIcon icon="mdi:dots-vertical" size="16px" />
                            <template #dropdown>
                                <ElDropdownMenu>
                                    <ElDropdownItem command="edit">编辑</ElDropdownItem>
                                    <ElDropdownItem command="delete">删除</ElDropdownItem>
                                </ElDropdownMenu>
                            </template>
                        </ElDropdown>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'

export interface ConversationItem<T = any> {
    id: string
    label: string
    group?: string
    [key: string]: any
}

const props = withDefaults(defineProps<{
    modelValue?: string
    items?: ConversationItem[]
    groupable?: boolean
    labelMaxWidth?: number
    showTooltip?: boolean
    rowKey?: string
    showBuiltInMenu?: boolean
}>(), {
    items: () => [],
    groupable: false,
    labelMaxWidth: 200,
    showTooltip: true,
    rowKey: 'id',
    showBuiltInMenu: false
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'select', item: ConversationItem): void
    (e: 'edit', item: ConversationItem): void
    (e: 'delete', item: ConversationItem): void
}>()

const labelStyle = computed(() => ({
    maxWidth: `${props.labelMaxWidth}px`
}))

const groupedItems = computed(() => {
    if (!props.groupable) {
        return { '': props.items }
    }
    
    return props.items.reduce((acc, item) => {
        const group = item.group || ''
        if (!acc[group]) {
            acc[group] = []
        }
        acc[group].push(item)
        return acc
    }, {} as Record<string, ConversationItem[]>)
})

const getItemKey = (item: ConversationItem) => {
    return item[props.rowKey as keyof ConversationItem] as string
}

const handleItemClick = (item: ConversationItem) => {
    const key = getItemKey(item)
    emit('update:modelValue', key)
    emit('select', item)
}

const handleMenuCommand = (command: string, item: ConversationItem) => {
    if (command === 'edit') {
        emit('edit', item)
    } else if (command === 'delete') {
        emit('delete', item)
    }
}
</script>

<style lang="scss" scoped>
.conversations {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--card-color);
}

.conversations-header {
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
}

.conversations-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
}

.group-header {
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-color-secondary);
    font-weight: 500;
}

.conversation-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--hover-bg-color);
    }

    &.active {
        background-color: var(--primary-color);
        
        .item-label span {
            color: #fff;
        }
        
        .item-label svg {
            color: #fff;
        }
    }
}

.item-label {
    display: flex;
    align-items: center;
    gap: 20px;
    overflow: hidden;

    span {
        // flex: 1;
        overflow: hidden;
        // text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        color: var(--text-color);
    }

    svg {
        flex-shrink: 0;
        color: var(--icon-color);
    }
}

.item-actions {
    opacity: 0;
    transition: opacity 0.2s ease;

    svg {
        color: var(--icon-color);
    }
}

.conversation-item:hover .item-actions {
    opacity: 1;
}
</style>
