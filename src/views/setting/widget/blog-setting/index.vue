<!-- setting/widget/BlogSetting.vue -->
<template>
    <div class="blog-setting">
        <h3>系统设置</h3>
        <!-- 博客设置内容 -->
        <DynamicForm v-model="formData" :form-items="formItems" :form-props="formProps" :show-submit="true"
            submit-text="保存修改">
            <template>

            </template>
        </DynamicForm>
    </div>
</template>

<script setup lang="ts">
import { type FormProps } from "element-plus"
const formData = ref({

})
const formItems = ref([])
const formProps = reactive<FormProps>({
    labelPosition: 'top'
})
</script>
<style lang="scss" scoped>
.blog-setting {
    padding: 20px;

    h3 {
        padding-bottom: 20px;
    }
}
</style>