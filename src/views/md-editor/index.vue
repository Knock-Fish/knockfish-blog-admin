<template>
    <div class="md-editor">
        <MdEditor
            :theme="isDark ? 'dark' : 'light'" />
    </div>
</template>

<script setup lang='ts'>
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
const isDark = useDark()
</script>

<style lang="scss" scoped></style>