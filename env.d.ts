/// <reference types="vite/client" />
// .env ts 智能提示
interface ImportMetaEnv {
    readonly VITE_APP_TITLE: stringreadonly
    VITE_REQUEST_BASE_UR: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}