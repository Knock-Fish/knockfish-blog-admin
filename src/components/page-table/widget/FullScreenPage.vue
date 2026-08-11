<template>
    <ElButton
        class="full-screen-button"
        @click="handleClick"
        type="info"
        plain
    >
        <SvgIcon
            :icon="fullScreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'"
        />
    </ElButton>
</template>

<script setup lang='ts'>
const fullScreen = ref<boolean>(false)
const props = defineProps<{
    targetRef: HTMLElement | null
}>()
const handleClick = () => {
    if (props.targetRef && !fullScreen.value) {
        props.targetRef.classList.add("full-screen-page")
        fullScreen.value = true
    } else {
        props.targetRef?.classList.remove("full-screen-page")
        fullScreen.value = false
    }
}
</script>

<style lang="scss">
.full-screen-page {
    height: calc(100% - 30px) !important;
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    background: var(--bg-color);
    padding: 15px;
    margin: 0 !important;
    z-index: 10000;
}
</style>
<style lang="scss" scoped>
.full-screen-button{
    @include icon-button
}
</style>