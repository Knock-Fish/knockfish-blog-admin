<template>
    <div class="md-editor">
        <MdEditor :theme="isDark ? 'dark' : 'light'"/>
    </div>
</template>

<script setup lang='ts'>
const isDark = useDark()
    
</script>

<style lang="scss" scoped>
    
</style>