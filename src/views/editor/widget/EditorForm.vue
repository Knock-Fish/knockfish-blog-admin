<template>
    <div class="form-content">
        <ElForm :model="formData">
            <div class="form-wrap">
                <h2>发布设置</h2>
                <ElFormItem label="标题">
                    <ElInput 
                        class="input" 
                        v-model="formData.title"
                        placeholder="请输入文章标题（最多100个字符）" 
                    />
                </ElFormItem>
                <div class="section-row">
                    <div class="left-section">
                        <ElFormItem label="封面">
                            <Upload 
                                v-model="formData.cover"
                                :props="uploadProps" 
                                text="请上传封面"
                                @success="handleSuccess" 
                            />
                        </ElFormItem>
                    </div>
                    <div class="right-section">
                        <ElFormItem label="标签">
                            <div>
                                <ElButton 
                                    round 
                                    size="small"
                                    @click="$emit('open-tag-dialog')"
                                >
                                    <SvgIcon icon="mdi:tag-plus-outline">
                                        添加标签
                                    </SvgIcon>
                                </ElButton>
                                <div style="margin-top: 10px;">
                                    <ElSpace wrap v-if="selectedTags?.length">
                                        <ElTag 
                                            :color="tag.color"
                                            v-for="tag in selectedTags"
                                            :key="tag.tagId"
                                        >
                                            {{ tag.tagName }}
                                        </ElTag>
                                    </ElSpace>
                                    <span style="font-size: 13px;" v-else>
                                        暂无标签
                                    </span>
                                </div>
                            </div>
                        </ElFormItem>
                    </div>
                </div>
                <ElFormItem label="摘要">
                    <ElInput 
                        v-model="formData.description" 
                        :rows="4"
                        type="textarea" 
                        placeholder="请输入文章摘要" 
                    />
                </ElFormItem>
                <h2>文章内容</h2>
            </div>
            <WangEditor 
                ref="wangEditorRef" 
                v-model="formData.content"
                :toolbar-config="toolbarConfig"
                :editor-config="editorConfig" 
            />
        </ElForm>
    </div>
</template>

<script setup lang='ts'>
import { type UploadFile, type UploadProps } from "element-plus"
import { useUserStore } from "@/store/modules/user"
import type { IDomEditor, SlateElement } from '@wangeditor-next/editor'

type Article = Api.Article.ArticleInfo
type InsertFnType = (url: string) => void
type Tag = Api.Tag.TagInfo
type ImageElement = SlateElement & {
    src: string
    alt: string
    url: string
    href: string
}

const props = defineProps<{
    modelValue: Article
    selectedTags: Tag[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: Article): void
    (e: 'open-tag-dialog'): void
    (e: 'cover-success', key: string): void
}>()

const userStore = useUserStore()
const { accessToken } = userStore

const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const wangEditorRef = ref<IDomEditor>()

const toolbarConfig = ref({
    toolbarKeys: [
        'headerSelect', 'blockquote', '|',
        'bold', 'italic', 'underline', 'through', '|',
        'color', 'bgColor', 'fontSize', 'fontFamily', '|',
        'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyJustify', '|',
        'indent', 'delIndent', '|',
        'bulletedList', 'numberedList', 'todo', '|',
        'insertLink', 'insertImage', 'uploadImage', 'insertVideo', 'uploadVideo', '|',
        'insertTable', 'codeBlock', '|',
        'undo', 'redo', 'clearStyle'
    ],
    modalAppendToBody: true
})

const editorConfig = ref({
    placeholder: '请输入内容...',
    MENU_CONF: {
        insertImage: {
            onInsertedImage: (imgNode: ImageElement) => {
                // console.log('图片已插入', imgNode.src)
            }
        },
        uploadImage: {
            server: import.meta.env.VITE_API_URL + '/api/r2-file',
            methods: "POST",
            fieldName: "file",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            customInsert(res: any, insertFn: InsertFnType) {
                const { url } = res.data
                insertFn(url)
            },
        }
    }
})

const uploadProps = ref<Record<string, any>>({
    showFileList: false,
    headers: {
        'Authorization': `Bearer ${accessToken}`,
    },
    action: import.meta.env.VITE_API_URL + '/api/r2-file',
})

const handleSuccess = (response: any, file: UploadFile) => {
    let urlKey = response.data.key
    emit('cover-success', urlKey)
    console.log("上传成功！", response, file)
    console.log("图片地址：", formData.value.cover)
}

defineExpose({
    wangEditorRef,
    getElemsByType: (type: string) => wangEditorRef.value?.getElemsByType(type) || []
})
</script>

<style lang="scss" scoped>
@use "../style.scss";
</style>
