import { onBeforeUnmount, onMounted } from 'vue'

type HotkeyHandlers = Record<string, (event: KeyboardEvent) => void>

/**
 * 全局热键：仅在 enabled() 为真时响应，卸载时自动解绑。
 * 输入框聚焦时不拦截，避免影响页面其它表单。
 */
export function useHotkeys(handlers: HotkeyHandlers, enabled: () => boolean = () => true) {
  const listener = (event: KeyboardEvent) => {
    if (!enabled()) return

    const target = event.target as HTMLElement | null
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
    if (target?.isContentEditable) return

    const handler = handlers[event.key]
    if (!handler) return

    event.preventDefault()
    handler(event)
  }

  onMounted(() => window.addEventListener('keydown', listener))
  onBeforeUnmount(() => window.removeEventListener('keydown', listener))
}
