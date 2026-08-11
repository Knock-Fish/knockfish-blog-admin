<template>
    <ElButton class="data-refresh" type="info" plain @click="handleClick">
        <SvgIcon
            icon="ri:refresh-line"
        />
    </ElButton>
</template>

<script setup lang='ts'>
const emit = defineEmits<{
    (e: 'click') :void
}>()
const handleClick = () => {
    emit('click')
}
</script>

<style lang="scss" scoped>
    .data-refresh{
        @include icon-button
    }
</style>