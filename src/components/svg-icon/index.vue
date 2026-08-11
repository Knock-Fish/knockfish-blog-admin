<template>
    <span class="svg-icon">
        <IconifyIcon class="icon" :icon="icon" :width="size" :height="size"
            :color="color" :style="customStyle" />
        <div class="text">
            <slot></slot>
        </div>
    </span>

</template>

<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'
interface Props {
    icon: string
    size?: number | string
    color?: string
    customStyle?: Record<string, any>
}

withDefaults(defineProps<Props>(), {
    size: "1em",
    color: 'currentColor'
})
</script>
<style lang="scss" scoped>
.svg-icon {
    display: inline-flex;
    align-items: center;
    // gap: 5px;
    overflow: hidden;
    outline: none;
    vertical-align: middle;
    transition: all 0.5s;
}
</style>
