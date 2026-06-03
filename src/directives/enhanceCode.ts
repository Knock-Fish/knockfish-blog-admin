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
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-yaml'


interface EnhanceCodeOptions {
  addLineNumbers?: boolean      // 是否添加行号，默认 true
  addVPre?: boolean             // 是否添加 v-pre 属性，默认 true
  highlightOnUpdate?: boolean   // 更新时是否重新高亮，默认 true
  commandLinePrompt?: string    // 命令行提示符，默认 '$'
}

const defaultOptions: EnhanceCodeOptions = {
  addLineNumbers: true,
  addVPre: true,
  highlightOnUpdate: true,
  commandLinePrompt: '$'
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
  
  // 可选：自动检测哪些行是输出（行首不是提示符的行）
  // 这个需要解析 code 内容，比较复杂，暂时让用户手动配置
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
 * 处理容器内的所有代码块
 */
function processCodeBlocks(container: HTMLElement, options: EnhanceCodeOptions) {
  const preElements = container.querySelectorAll('pre')
  
  preElements.forEach(pre => {
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
  })
  
  // 触发 Prism 高亮（Command Line 插件也会被正确激活）
  if (options.highlightOnUpdate !== false) {
    Prism.highlightAllUnder(container)
  }
}

const enhanceCodeDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    const options = { ...defaultOptions, ...(binding.value as EnhanceCodeOptions || {}) }
    
    // 使用 setTimeout 或 nextTick 确保 DOM 完全渲染
    setTimeout(() => {
      processCodeBlocks(el, options)
    }, 0)
  },
  
  updated(el: HTMLElement, binding) {
    const options = { ...defaultOptions, ...(binding.value as EnhanceCodeOptions || {}) }
    
    if (options.highlightOnUpdate) {
      setTimeout(() => {
        processCodeBlocks(el, options)
      }, 0)
    }
  }
}

export function setupEnhanceCodeDirective(app: App) {
  app.directive('enhance-code', enhanceCodeDirective)
}