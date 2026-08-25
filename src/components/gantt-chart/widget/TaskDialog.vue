<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? '编辑任务' : '新增任务'"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <ElForm ref="taskFormRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="任务名称" prop="text">
        <ElInput v-model="form.text" placeholder="请输入任务名称" />
      </ElFormItem>
      <ElFormItem label="任务类型" prop="type">
        <ElRadioGroup v-model="form.type" :disabled="isEdit">
          <ElRadioButton label="task">普通任务</ElRadioButton>
          <ElRadioButton label="milestone">里程碑</ElRadioButton>
          <ElRadioButton label="project">汇总任务</ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="任务状态" prop="status">
        <!-- 汇总任务：自动派生，禁止手动修改 -->
        <ElSelect v-if="form.type === 'project'" v-model="form.status" disabled>
          <ElOption label="未开始（自动派生）" value="todo" />
          <ElOption label="进行中（自动派生）" value="doing" />
          <ElOption label="已完成（自动派生）" value="done" />
          <ElOption label="已延期（自动派生）" value="delay" />
          <ElOption label="已取消" value="cancel" />
        </ElSelect>
        <!-- 里程碑：只有已完成 / 未完成 两档 -->
        <ElSelect v-else-if="form.type === 'milestone'" v-model="form.status">
          <ElOption label="未完成" value="todo" />
          <ElOption label="已完成" value="done" />
        </ElSelect>
        <ElSelect v-else v-model="form.status">
          <ElOption label="未开始" value="todo" />
          <ElOption label="进行中" value="doing" />
          <ElOption label="已完成" value="done" />
          <ElOption label="已延期" value="delay" />
          <ElOption label="已取消" value="cancel" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="开始日期" prop="start">
        <ElDatePicker
          v-model="form.start"
          type="datetime"
          placeholder="选择开始日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="form.type === 'project'"
        />
        <div v-if="form.type === 'project'" style="color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; margin-top: 4px">
          汇总任务的开始/结束时间由子项自动计算，禁止手动修改
        </div>
      </ElFormItem>
      <ElFormItem v-if="form.type !== 'milestone'" label="结束日期" prop="end">
        <ElDatePicker
          v-model="form.end"
          type="datetime"
          placeholder="选择结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :disabled="form.type === 'project'"
        />
      </ElFormItem>
      <ElFormItem v-if="form.type === 'task'" label="完成进度" prop="progress">
        <ElSlider
          v-model="form.progress"
          :min="0"
          :max="1"
          :step="0.01"
          :format-tooltip="(val: number) => Math.round(val * 100) + '%'"
        />
      </ElFormItem>
      <ElFormItem v-else-if="form.type === 'project'" label="完成进度">
        <ElProgress :percentage="Math.round(form.progress * 100)" :stroke-width="12" />
        <div style="color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; margin-top: 4px">
          汇总任务的完成进度由子项按工期加权自动计算
        </div>
      </ElFormItem>
      <!-- milestone：无进度条/无进度控件，完成与否由上方 status 的"已完成/未完成"控制 -->
      <ElFormItem label="负责人">
        <ElInput v-model="form.owner" placeholder="可留空" />
      </ElFormItem>
      <ElFormItem label="任务描述">
        <ElInput v-model="form.description" type="textarea" :rows="3" placeholder="可留空" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

export type TaskType = 'task' | 'milestone' | 'project'
export type TaskStatus = 'todo' | 'doing' | 'done' | 'delay' | 'cancel'

export interface TaskDialogForm {
  id: string | null
  text: string
  start: string
  end: string
  progress: number
  type: TaskType
  status: TaskStatus
  owner: string
  description: string
  parentId: string | null
  insertAfterId: string | null
}

const props = defineProps<{
  visible: boolean
  isEdit: boolean
  saving: boolean
  form: TaskDialogForm
  rules: FormRules
}>()

const emit = defineEmits<{
  (evt: 'update:visible', v: boolean): void
  (evt: 'submit', form: TaskDialogForm): void // 修改：携带表单数据
}>()

const taskFormRef = ref<FormInstance>()

// 弹窗打开时清除校验状态
watch(
  () => props.visible,
  (v) => {
    if (v) {
      nextTick(() => {
        taskFormRef.value?.clearValidate()
      })
    }
  }
)

// 提交按钮点击处理
const handleSubmit = () => {
  taskFormRef.value?.validate((valid) => {
    if (valid) {
      emit('submit', props.form) // 传递当前表单数据
    }
  })
}

// 暴露校验方法供父组件调用（可选）
defineExpose({ validate: () => taskFormRef.value?.validate() })
</script>