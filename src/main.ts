import { createApp } from 'vue'
import { initStore } from "@/store/index"
import { initRouter } from "@/router/index"
import { setupGlobDirectives } from "@/directives/index"
import SvgIcon from "@/components/svg-icon/index.vue"
import App from './App.vue'
// import { addCollection } from '@iconify/vue'
// import mdi from '@iconify-json/mdi/icons.json'
// addCollection(mdi)
import 'element-plus/dist/index.css'
import "@style/reset.scss"
import "@style/el-ui.scss"
import '@style/el-dark.scss'

const app = createApp(App)

app.component("SvgIcon", SvgIcon)

initStore(app)
initRouter(app)
setupGlobDirectives(app)

app.mount('#app')

const hideLoading = () => {
  const loadingContainer = document.getElementById('loading-container')
  if (loadingContainer) {
    loadingContainer.classList.add('hidden')
    setTimeout(() => {
      loadingContainer.remove()
    }, 500)
  }
}

if (document.readyState === 'complete') {
  hideLoading()
} else {
  window.addEventListener('load', hideLoading)
}

// Service Worker 注册交由 vite-plugin-pwa 自动处理（其 injectRegister 默认 'auto'，
// 生产构建会注入注册、dev 模式不生成 sw.js）。这里不再手动 register('/sw.js')，
// 否则 dev 下请求 /sw.js 会被 dev server 回退为 index.html（text/html），
// 触发 "The script has an unsupported MIME type ('text/html')" 错误。