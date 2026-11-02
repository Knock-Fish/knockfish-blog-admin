import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface MasonryItem {
  id: string
  /** 宽 / 高 */
  ratio: number
}

export interface MasonryBox {
  x: number
  y: number
  width: number
  height: number
}

export interface MasonryOptions {
  minColumnWidth?: number
  gap?: number
  maxColumns?: number
}

/**
 * 瀑布流布局：按“最短列优先”把每一项放进容器，纯计算、不测量 DOM。
 * 容器宽度变化（侧边栏折叠、窗口缩放）时自动重排。
 */
export function useMasonry(
  container: Ref<HTMLElement | null>,
  items: () => MasonryItem[],
  options: MasonryOptions = {},
) {
  const { minColumnWidth = 240, gap = 16, maxColumns = 6 } = options

  const containerWidth = ref(0)
  let observer: ResizeObserver | null = null

  onMounted(() => {
    if (!container.value) return
    containerWidth.value = container.value.clientWidth
    observer = new ResizeObserver((entries) => {
      containerWidth.value = entries[0]?.contentRect.width ?? containerWidth.value
    })
    observer.observe(container.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return computed(() => {
    const total = containerWidth.value
    const list = items()
    const boxes: Record<string, MasonryBox> = {}

    if (!total || !list.length) {
      return { boxes, height: 0, columns: 1 }
    }

    const columns = Math.max(1, Math.min(maxColumns, Math.floor((total + gap) / (minColumnWidth + gap))))
    const columnWidth = (total - gap * (columns - 1)) / columns
    const columnHeights = new Array<number>(columns).fill(0)

    for (const item of list) {
      let target = 0
      for (let index = 1; index < columns; index += 1) {
        if ((columnHeights[index] ?? 0) < (columnHeights[target] ?? 0)) target = index
      }

      const height = Math.round(columnWidth / (item.ratio > 0 ? item.ratio : 4 / 3))
      boxes[item.id] = {
        x: Math.round(target * (columnWidth + gap)),
        y: Math.round(columnHeights[target] ?? 0),
        width: columnWidth,
        height,
      }
      columnHeights[target] = (columnHeights[target] ?? 0) + height + gap
    }

    return { boxes, height: Math.round(Math.max(...columnHeights) - gap), columns }
  })
}
