<template>
    <div class="thinking">
        <span class="thinking-text" v-if="text == ''">{{ text }}</span>
        <div class="thinking-dots">
            <span class="dot dot-1"></span>
            <span class="dot dot-2"></span>
            <span class="dot dot-3"></span>
        </div>
    </div>
</template>

<script setup lang='ts'>
withDefaults(defineProps<{
    text?: string
}>(), {
    text: ''
})
</script>

<style lang="scss" scoped>
.thinking {
    display: flex;
    width: fit-content;
    align-items: center;
    gap: 8px;
    // padding: 12px 16px;
    padding: 16px;
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 12px 12px 12px 4px;
    color: #666;
    font-size: 14px;

    .thinking-dots {
        display: flex;
        align-items: center;
        gap: 4px;

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #007bff;
            animation: bounce 1.4s infinite ease-in-out;
        }

        .dot-1 {
            animation-delay: -0.32s;
        }

        .dot-2 {
            animation-delay: -0.16s;
        }

        .dot-3 {
            animation-delay: 0s;
        }
    }
}

@keyframes bounce {

    0%,
    80%,
    100% {
        transform: scale(0.6);
        opacity: 0.3;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
