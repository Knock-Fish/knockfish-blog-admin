<template>
  <div v-permission="`blog:${permission}`" class="dialog-btn-content">
    <!-- 按钮：使用默认插槽 -->
    <ElButton v-bind="finalButtonProps" @click.stop="handleClick">
      <slot></slot>
    </ElButton>

    <!-- 弹窗 -->
    <ElDialog v-if="type === 'dialog'" v-model="dialogVisible" v-bind="finalDialogProps"
      v-on="componentsEmit">
      <!-- 弹窗内容插槽 -->
      <slot name="content"></slot>
      <!-- 透传 ElDialog 自带的所有插槽（header、footer、title 等）-->
      <template v-for="(name, _) in $slots" :key="name"
        v-if="name !== 'default' && name !== 'content'" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" @click="handleSubmit">
            确认
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { type ButtonProps, type DialogProps } from 'element-plus'
defineOptions({ inheritAttrs: false })
interface Props {
  /** 按钮类型：dialog-弹窗按钮，button-普通按钮，confirm-确认框按钮 */
  type?: 'dialog' | 'button'
  /** 权限码，如 'blog:article:add' */
  permission?: string
   /** 按钮属性 */
  buttonProps?: ButtonProps
  /** 弹窗属性（仅在 type 为 dialog 时生效） */
  dialogProps?: DialogProps
}
const dialogVisible = ref(false)
const DEFAULT_BUTTON_PROPS: ButtonProps = {
  // size: 'small',
}
const DEFAULT_DIALOG_PROPS: DialogProps = {
  title: 'Tips',
  width: '500px',
  zIndex: 10001,
  appendToBody: true,
}
const props = withDefaults(defineProps<Props>(), {
  type: 'dialog'  // 默认为弹窗按钮，保持原有行为
})
const finalButtonProps = computed(() => ({
  ...DEFAULT_BUTTON_PROPS,
  ...(props.buttonProps || {}),
}))

const finalDialogProps = computed(() => ({
  ...DEFAULT_DIALOG_PROPS,
  ...(props.dialogProps || {}),
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
const componentsEmit = computed(() => {
  return {
    open: () => emit('open'),
    opened: () => emit('opened'),
    close: () => emit('close'),
    closed: () => emit('closed'),
    'open-auto-focus': () => emit('open-auto-focus'),
    'close-auto-focus': () => emit('close-auto-focus'),
  }
})
const handleSubmit = () => {
  dialogVisible.value = !dialogVisible.value
  emit('submit')
}
const handleClick = (event: Event) => {
  if(props.type =='dialog'){
      dialogVisible.value = !dialogVisible.value
  }
  event?.stopPropagation()
  emit('click')
}
</script>

<style lang="scss" scoped>
.dialog-btn-content {
   display: inline-block;
   margin: 5px;
 }
</style>