import type { Directive, App } from 'vue'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.min.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import 'prismjs/plugins/command-line/prism-command-line.js'
// 根据需要导入更多语言支持
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-yaml'

interface EnhanceCodeOptions {
  addLineNumbers?: boolean      // 是否添加行号，默认 true
  addVPre?: boolean             // 是否添加 v-pre 属性，默认 true
  highlightOnUpdate?: boolean   // 更新时是否重新高亮，默认 true
  commandLinePrompt?: string    // 命令行提示符，默认 '$'
  batchSize?: number            // 每批处理的代码块数量，默认 10
}

const defaultOptions: EnhanceCodeOptions = {
  addLineNumbers: true,
  addVPre: true,
  highlightOnUpdate: true,
  commandLinePrompt: '$',
  batchSize: 10
}

/**
 * 判断是否为命令行代码块
 * 通过 language 类名判断，如 language-command-line、language-bash、language-shell
 */
function isCommandLineBlock(codeElement: HTMLElement): boolean {
  const classNames = codeElement.className || ''
  return classNames.includes('language-command-line') ||
         classNames.includes('language-bash') ||
         classNames.includes('language-shell')
}

/**
 * 增强命令行代码块
 */
function enhanceCommandLineBlock(preElement: HTMLPreElement, prompt: string) {
  // 如果已经有 command-line 类，跳过重复添加
  if (preElement.classList.contains('command-line')) return
  
  // 添加 command-line 类
  preElement.classList.add('command-line')
  
  // 设置提示符
  if (!preElement.hasAttribute('data-prompt')) {
    preElement.setAttribute('data-prompt', prompt)
  }
}

/**
 * 增强普通代码块（添加行号）
 */
function enhanceNormalCodeBlock(preElement: HTMLPreElement, addLineNumbers: boolean) {
  if (addLineNumbers && !preElement.classList.contains('line-numbers')) {
    preElement.classList.add('line-numbers')
  }
}

/**
 * 检查代码块是否已经被处理过
 */
function isBlockProcessed(preElement: HTMLPreElement): boolean {
  // 检查是否已经有相关的标记或类
  if (preElement.hasAttribute('data-enhanced')) return true
  
  // 命令行代码块检查
  if (preElement.classList.contains('command-line')) return true
  
  // 行号代码块检查
  if (preElement.classList.contains('line-numbers')) return true
  
  return false
}

/**
 * 标记代码块为已处理
 */
function markBlockAsProcessed(preElement: HTMLPreElement) {
  preElement.setAttribute('data-enhanced', 'true')
}

/**
 * 处理单个代码块
 */
function processSingleCodeBlock(pre: HTMLPreElement, options: EnhanceCodeOptions) {
  // 如果已经处理过，跳过
  if (isBlockProcessed(pre)) return
  
  // 确保 pre 内有 code 元素
  let codeElement = pre.querySelector('code')
  if (!codeElement) {
    codeElement = document.createElement('code')
    codeElement.textContent = pre.textContent || ''
    pre.innerHTML = ''
    pre.appendChild(codeElement)
  }
  
  // 判断是否为命令行代码块
  if (isCommandLineBlock(codeElement)) {
    enhanceCommandLineBlock(pre, options.commandLinePrompt || '$')
  } else {
    enhanceNormalCodeBlock(pre, options.addLineNumbers !== false)
  }
  
  // 添加 v-pre 属性
  if (options.addVPre !== false && !pre.hasAttribute('v-pre')) {
    pre.setAttribute('v-pre', 'true')
  }
  
  // 标记为已处理
  markBlockAsProcessed(pre)
  
  // 触发 Prism 高亮
  if (options.highlightOnUpdate !== false) {
    Prism.highlightElement(codeElement)
  }
}

/**
 * 分批处理代码块
 */
function processCodeBlocksInBatches(
  preElements: HTMLPreElement[], 
  options: EnhanceCodeOptions,
  onComplete?: () => void
) {
  const batchSize = options.batchSize || 10
  const totalCount = preElements.length
  
  if (totalCount === 0) {
    onComplete?.()
    return
  }
  
  let currentIndex = 0
  
  const processBatch = () => {
    const endIndex = Math.min(currentIndex + batchSize, totalCount)
    const batch = preElements.slice(currentIndex, endIndex)
    
    // 处理当前批次的代码块
    batch.forEach(pre => {
      processSingleCodeBlock(pre, options)
    })
    
    // 更新索引
    currentIndex = endIndex
    
    // 继续处理下一批
    if (currentIndex < totalCount) {
      requestAnimationFrame(processBatch)
    } else {
      onComplete?.()
    }
  }
  
  // 开始处理第一批
  processBatch()
}

/**
 * 处理容器内的所有代码块
 */
function processCodeBlocks(container: HTMLElement, options: EnhanceCodeOptions) {
  const preElements = Array.from(container.querySelectorAll('pre')) as HTMLPreElement[]
  
  // 过滤出未处理的代码块
  const unprocessedPreElements = preElements.filter(pre => !isBlockProcessed(pre))
  
  if (unprocessedPreElements.length === 0) return
  
  // 使用分批处理
  processCodeBlocksInBatches(unprocessedPreElements, options)
}

/**
 * 重试处理未完成的代码块
 */
function retryProcessing(container: HTMLElement, options: EnhanceCodeOptions, maxRetries: number = 3, delay: number = 200) {
  let retryCount = 0
  
  const tryProcess = () => {
    const preElements = Array.from(container.querySelectorAll('pre')) as HTMLPreElement[]
    const unprocessedPreElements = preElements.filter(pre => !isBlockProcessed(pre))
    
    if (unprocessedPreElements.length > 0 && retryCount < maxRetries) {
      retryCount++
      setTimeout(() => {
        processCodeBlocks(container, options)
        tryProcess()
      }, delay * retryCount)
    }
  }
  
  tryProcess()
}

const enhanceCodeDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    const options = { ...defaultOptions, ...(binding.value as EnhanceCodeOptions || {}) }
    
    // 立即尝试处理一次
    setTimeout(() => {
      processCodeBlocks(el, options)
      
      // 延迟重试，确保动态内容也被处理
      setTimeout(() => {
        retryProcessing(el, options)
      }, 100)
    }, 0)
    
    // 使用 MutationObserver 监听动态添加的代码块
    const observer = new MutationObserver((mutations) => {
      let hasNewCodeBlocks = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              // 检查新添加的节点是否包含代码块
              if (element.tagName === 'PRE' || element.querySelector('pre')) {
                hasNewCodeBlocks = true
              }
            }
          })
        }
      })
      
      if (hasNewCodeBlocks) {
        // 延迟处理新添加的代码块
        setTimeout(() => {
          processCodeBlocks(el, options)
        }, 50)
      }
    })
    
    // 开始观察 DOM 变化
    observer.observe(el, {
      childList: true,
      subtree: true
    })
    
    // 将 observer 存储到元素上
    ;(el as any)._enhanceCodeObserver = observer
  },
  
  updated(el: HTMLElement, binding) {
    const options = { ...defaultOptions, ...(binding.value as EnhanceCodeOptions || {}) }
    
    if (options.highlightOnUpdate) {
      setTimeout(() => {
        processCodeBlocks(el, options)
      }, 50)
    }
  },
  
  unmounted(el: HTMLElement) {
    // 清理 MutationObserver
    const observer = (el as any)._enhanceCodeObserver
    if (observer) {
      observer.disconnect()
      delete (el as any)._enhanceCodeObserver
    }
  }
}

export function setupEnhanceCodeDirective(app: App) {
  app.directive('enhance-code', enhanceCodeDirective)
}