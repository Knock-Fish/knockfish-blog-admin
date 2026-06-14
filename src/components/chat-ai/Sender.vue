<template>
    <div class="sender">
        <div class="sender-wrapper">
            <div class="sender-textarea">
                <ElInput :model-value="modelValue"
                    @update:model-value="handleInput"
                    :type="textarea ? 'textarea' : 'text'"
                    :rows="textarea ? (autoSize?.minRows || 2) : 1"
                    :autosize="textarea && autoSize" :placeholder="placeholder"
                    :clearable="clearable"
                    :class="{ 'textarea-mode': textarea }" />
            </div>
            <div class="sender-actions">
                <slot name="prepend"></slot>
                <slot name="append"></slot>
                <ElButton :type="loading ? 'danger' : 'primary'" :size="size"
                    @click="handleButtonClick" class="submit-btn">
                    <SvgIcon :icon="loading ? 'mdi:stop' : 'mdi:send'" />
                </ElButton>
            </div>
        </div>
        <Transition name="slide-up">
            <div v-if="showScrollTip" class="scroll-tip">
                <SvgIcon icon="mdi:chevron-up" size="16px" />
                <span>已展开</span>
            </div>
        </Transition>
    </div>
</template>

<script setup lang='ts'>
const props = withDefaults(defineProps<{
    modelValue?: string
    loading?: boolean
    variant?: 'default' | 'updown'
    placeholder?: string
    clearable?: boolean
    autoSize?: { minRows?: number; maxRows?: number }
    size?: 'small' | 'default' | 'large'
}>(), {
    modelValue: '',
    loading: false,
    variant: 'default',
    placeholder: '请输入...',
    clearable: false,
    autoSize: () => ({ minRows: 2, maxRows: 5 }),
    size: 'default'
})
const handleButtonClick = () => {
    if (props.loading) {
        handleAbort()
    } else {
        handleSubmit()
    }
}
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'submit'): void
    (e: 'abort'): void
}>()

const textarea = computed(() => props.variant === 'updown')
const showScrollTip = ref(false)

const handleInput = (value: string) => {
    emit('update:modelValue', value)
}

const handleSubmit = () => {
    if (props.modelValue.trim()) {
        emit('submit')
    }
}
const handleAbort = () => {
    emit('abort')
}

watch(() => props.modelValue, (val) => {
    if (textarea.value && val) {
        const lines = val.split('\n').length
        const maxRows = props.autoSize?.maxRows || 5
        showScrollTip.value = lines >= maxRows
    } else {
        showScrollTip.value = false
    }
})
</script>

<style lang="scss" scoped>
.sender {
    width: 100%;
    position: relative;
}

.sender-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--card-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 10px 5px;
    transition: border-color 0.2s ease;

    .sender-textarea {
        :deep(.el-input__inner) {
            /* 单行输入框 固定高度 */
            height: 40px;
            line-height: 40px;
        }

        :deep(.el-textarea__inner) {
            /* 多行文本框 最小高度 */
            min-height: 80px;
            /* 如需固定高度就用 height: 80px; */
            max-height: 140px;
            /* 超出出现滚动条 */
        }

        :deep(.el-input__inner),
        :deep(.el-textarea__inner) {
            border: none !important;
            border-bottom: none !important;
            box-shadow: none !important;
            resize: none;
            padding: 0 12px;
            /* 配套调整内边距 */
        }
    }


    &:focus-within {
        border-color: #9b9b9b;
    }
}


.sender-actions {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

.submit-btn {
    /* 宽高保持一致 = 正方形，加圆角就是正圆 */
    width: 36px;
    height: 36px;
    padding: 0 !important;
    /* 清空默认内边距 */
    border-radius: 50%;
    flex-shrink: 0;

    :deep(.el-button__icon) {
        margin-right: 0;
        font-size: 16px;
        /* 微调图标大小，居中美观 */
    }
}


.scroll-tip {
    position: absolute;
    bottom: calc(100% + 4px);
    right: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background-color: var(--text-color-secondary);
    color: #fff;
    font-size: 12px;
    border-radius: 4px;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(8px);
}
</style>
