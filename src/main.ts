import { createApp } from 'vue'
import { initStore } from "@/store/index"
import { initRouter } from "@/router/index"
import { addCollection } from '@iconify/vue'   // 使用iconify
import { setupGlobDirectives } from "@/directives/index"
import mdi from '@iconify-json/mdi/icons.json'
import ElementPlus from 'element-plus'              // element-plus组件库
import SvgIcon from "@/components/svg-icon/index.vue"
import App from './App.vue'
import "animate.css"    
import 'element-plus/dist/index.css'
import "@style/reset.scss"                         // 重置HTML样式
import "@style/el-ui.scss"                         // 覆盖组件库默认样式
import '@style/el-dark.scss'                       // Element 自定义主题（暗色）

const app = createApp(App)
addCollection(mdi)
initStore(app)
initRouter(app)
setupGlobDirectives(app)    // 自定义指令
app.use(ElementPlus)    // 使用组件库
// 注册全局组件
app.component("SvgIcon", SvgIcon)

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
