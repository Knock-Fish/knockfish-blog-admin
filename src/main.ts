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