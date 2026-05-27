<template>
  <ElForm ref="formRef" :model="formModel" v-bind="formProps">
    <template v-for="(item, index) in formItems" :key="item.prop || index">
      <ElFormItem v-bind="item">
        <component v-if="item.prop" :class="item.class" :is="`El${item.type}`"
          v-model="formModel[item.prop]" v-bind="item.props"
          :ref="(el: any) => setItemRef(el, item.prop || '')">

          <!-- select 选项 -->
          <template v-if="item.type === 'Select'">
            <ElOption v-for="opt in item.options" :key="opt.value"
              v-bind="opt" />
          </template>

          <!-- radio-group -->
          <template v-else-if="item.type === 'RadioGroup'">
            <ElRadio v-for="opt in item.options" :key="opt.value" v-bind="opt">
              {{ opt.label }}
            </ElRadio>
          </template>

          <!-- checkbox-group -->
          <template v-else-if="item.type === 'CheckboxGroup'">
            <ElCheckbox v-for="opt in item.options" :key="opt.value"
              v-bind="opt">
              {{ opt.label }}
            </ElCheckbox>
          </template>

          <!-- 透传所有插槽 -->
          <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
            <slot :name="name" v-bind="slotData || {}" :item="item"></slot>
          </template>
        </component>

        <!-- 自定义插槽 -->
        <slot v-if="item.slot" :name="item.slot" :item="item"
          :model="formModel" />
      </ElFormItem>
    </template>

    <!-- 表单按钮 -->
    <ElFormItem v-if="showSubmit">
      <ElButton class="btn-submit" type="primary" native-type="submit"
        @click="handleSubmit">
        {{ submitText }}
      </ElButton>
      <ElButton class="btn-reset" v-if="showReset" @click="resetForm">
        {{ resetText }}
      </ElButton>
    </ElFormItem>
  </ElForm>
</template>

<script setup lang="ts">
import type {
  FormInstance,
  FormItemRule,
  FormItemProps,
  FormRules,
  FormProps,
  SelectOptionProps,
  CheckboxOption,
  RadioButtonProps,
  ElCheckbox,
  InputProps,
  SelectProps,
  RadioGroupProps,
  DatePickerProps,
  CheckboxGroupProps,
  ButtonProps,
  SegmentedProps,
} from 'element-plus'
const itemRefs = ref<Record<string, any>>({})
defineOptions({ inheritAttrs: false })
const formModel = defineModel<Record<string, any>>({ required: true })
const setItemRef = (el: any, prop: string) => {
  if (el) itemRefs.value[prop] = el
}

interface FormItem extends Partial<FormItemProps> {
  type?: string
  prop?: string
  class?: string
  props?: InputProps
  | SelectProps
  | CheckboxGroupProps
  | RadioGroupProps
  | DatePickerProps
  | ButtonProps
  | SegmentedProps
  slot?: string
  options?: SelectOptionProps
  | CheckboxOption
  | RadioButtonProps
}
interface Props {
  formProps?: FormProps
  formItems: FormItem[]
  showSubmit?: boolean
  submitText?: string
  resetText?: string
  showReset?: boolean
}

// props
const props = withDefaults(defineProps<Props>(), {
  showSubmit: false,
  submitText: '提交',
  showReset: false,
  resetText: '重置',
  formProps: () => ({
    labelWidth: 'auto',
    labelPosition: 'right',
    inline: false
  })
})

// 事件
const emit = defineEmits<{
  (e: 'submit', formModel: Record<string, any>): void
}>()

// 表单实例 & 校验规则
const formRef = ref<FormInstance | undefined>()


// 提交
const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate((valid) => {
    if (valid) emit('submit', formModel.value)
  })
}

// 重置
const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
}

// 对外暴露方法
defineExpose({
  formRef,
  resetForm,
  itemRefs,
  getFieldRef: (prop: string) => itemRefs.value[prop],
  validate: () => formRef.value?.validate()
})
</script>

<style lang="scss" scoped>
.btn-submit {
  margin-right: 12px;
}
</style>