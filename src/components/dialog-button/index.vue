<template>
  <div v-permission="resolvePermission(permission)" class="dialog-btn-content">
    <!-- 按钮 -->
    <ElButton :class="{'btn-border': !buttonBorder}" v-bind="finalButtonProps" @click.stop="handleClick" ref="buttonRef">
      <slot></slot>
    </ElButton>

    <!-- 弹窗 -->
    <ElDialog
      v-if="type === 'dialog'"
      v-model="dialogVisible"
      v-bind="finalDialogProps"
      v-on="componentsEmit"
    >
      <!-- 弹窗内容插槽 -->
      <slot name="content"></slot>

      <!-- 透传 ElDialog 自带的除 default、content 外的所有插槽 -->
      <template v-for="slotName in slotNames" :key="slotName" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData" />
      </template>

      <!-- 固定底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" @click="handleSubmit">确认</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { type ButtonProps, type DialogProps, ElButton, ElDialog } from 'element-plus'
import { computed, ref, useSlots } from 'vue'

defineOptions({ inheritAttrs: false })

interface Props {
  /** 按钮类型：dialog-弹窗按钮，button-普通按钮，confirm-确认框按钮 */
  type?: 'dialog' | 'button' | 'confirm'
  /** 权限码，如 'blog:article:add' */
  permission?: string
  /** 按钮属性 */
  buttonProps?: ButtonProps
  /** 弹窗属性（仅在 type 为 dialog 时生效） */
  dialogProps?: DialogProps
  /** 弹窗标题，优先级高于按钮文本 */
  title?: string,
  buttonBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'dialog',
  buttonBorder: true
})

const dialogVisible = ref(false)
const buttonRef = ref<InstanceType<typeof ElButton> | null>(null)
const currentDialogTitle = ref('')

const DEFAULT_BUTTON_PROPS: ButtonProps = {
  // size: 'small',
}

const DEFAULT_DIALOG_PROPS: DialogProps = {
  title: '',
  width: '500px',
  zIndex: 10001,
  appendToBody: true,
}

const finalButtonProps = computed(() => ({
  ...DEFAULT_BUTTON_PROPS,
  ...(props.buttonProps || {}),
}))

const finalDialogProps = computed(() => ({
  ...DEFAULT_DIALOG_PROPS,
  ...(props.dialogProps || {}),
  title: props.dialogProps?.title || props.title || currentDialogTitle.value,
}))

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'submit'): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close'): void
  (e: 'closed'): void
  (e: 'open-auto-focus'): void
  (e: 'close-auto-focus'): void
}>()

// 用于透传 ElDialog 事件的监听器
const componentsEmit = computed(() => ({
  open: () => emit('open'),
  opened: () => emit('opened'),
  close: () => emit('close'),
  closed: () => emit('closed'),
  'open-auto-focus': () => emit('open-auto-focus'),
  'close-auto-focus': () => emit('close-auto-focus'),
}))

// 获取插槽，并过滤掉 default 和 content（因为已经单独使用）
const slots = useSlots()
const slotNames = computed(() => {
  return Object.keys(slots).filter(name => name !== 'default' && name !== 'content')
})

// 处理提交
const handleSubmit = () => {
  dialogVisible.value = false
  emit('submit')
}

// 处理按钮点击
const handleClick = (event: Event) => {
  if (props.type === 'dialog') {
    dialogVisible.value = !dialogVisible.value
    if (dialogVisible.value) {
      // 弹窗打开时，确定标题
      if (props.dialogProps?.title) {
        currentDialogTitle.value = props.dialogProps.title
      } else if (props.title) {
        currentDialogTitle.value = props.title
      } else {
        const buttonText = buttonRef.value?.$el?.textContent?.trim() || ''
        currentDialogTitle.value = buttonText
      }
    }
  }
  event?.stopPropagation()
  emit('click')
}

// 权限解析
const resolvePermission = (permission?: string): string | undefined => {
  if (!permission) return undefined
  return permission.startsWith('blog:') ? permission : `blog:${permission}`
}
</script>

<style lang="scss" scoped>
.dialog-btn-content {
  display: inline-block;
  margin: 5px;
  .el-button{
    padding: 10px;
  }
}
.btn-border{
  border: none;
}
</style>