<template>
    <div class="editor-wrapper">
        <Toolbar class="editor-toolbar" :editor="editorRef"
            :defaultConfig="props.toolbarConfig" :mode="props.mode" />
        <Editor style="height: 1000px; overflow-y: hidden;" v-model="modelValue"
            :defaultConfig="props.editorConfig" :mode="mode"
            @onCreated="handleCreated" />
    </div>
</template>

<script setup lang='ts'>
import '@wangeditor-next/editor/dist/css/style.css'
import { Boot } from '@wangeditor-next/editor'
import '@wangeditor-next/code-highlight'                                  // 👈 核心库

import type {
    IDomEditor,
    IToolbarConfig,
    IEditorConfig,
} from '@wangeditor-next/editor'

const modelValue = defineModel<string>({ required: true, default: '' })  // 与父组件双向绑定
// 必须用 shallowRef，避免 Vue 深度追踪
const editorRef = shallowRef<IDomEditor>()  // 编辑器实例
interface Props {
    editorConfig?: Partial<IEditorConfig>
    toolbarConfig?: Partial<IToolbarConfig>
    mode?: string
}
const props = withDefaults(defineProps<Props>(), {
    mode: 'default' // 编辑器模式
})

const handleCreated = (editor: IDomEditor) => {
    editorRef.value = editor // 记录editor
}
// onMounted(() => {
//     Boot.registerModule(markdownModule)
// })
// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

defineExpose({
    editorRef,
    getElemsByType: (type: string, isPrefix?: boolean) => editorRef.value?.getElemsByType(type),
})
</script>
<style lang="scss" scoped>
.editor-wrapper {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: var(--border-color);
    border-radius: 6px;
    overflow: hidden;
    z-index: 10000;
}
</style>