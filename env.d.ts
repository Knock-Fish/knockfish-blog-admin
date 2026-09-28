/// <reference types="vite/client" />
// .env ts 智能提示
interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_API_URL: string
    /** Agent（FastAPI 博客问答服务）基础地址，开发用 http://localhost:8000，生产用 /agent（Nginx 反代） */
    readonly VITE_AGENT_URL: string
    VITE_REQUEST_BASE_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}