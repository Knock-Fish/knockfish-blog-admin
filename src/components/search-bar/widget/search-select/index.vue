<template>
    <ElSelect
        v-model="value"
        v-bind="config"
        clearable
    >
        <ElOption
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
        />
    </ElSelect>
</template>

<script lang="ts" setup>
// 定义组件值类型
type ValueVO =  string | number
import { ElOption} from "element-plus"
interface OptionItem {
    value: ValueVO
    label: string
}
interface SearchFormItem {
    placeholder?: string
}
const prop = defineProps<{
    value?: ValueVO // 选择框的值
    options: OptionItem[]
    config?: SearchFormItem
}>()
// 定义emit事件
const emit = defineEmits<{
    (e: 'update:value', value: ValueVO): void // 更新选择框值的事件
}>()
// 计算属性:处理v-model双向绑定
const value = computed({
    get: () => prop.value,
    set: (value: ValueVO) => emit('update:value', value)
})
// 合并默认配置和自定义配置
const config = reactive({
    ...(prop.config || {})
})
</script>
