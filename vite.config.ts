import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { prismjsPlugin } from "vite-plugin-prismjs"
import vueDevTools from 'vite-plugin-vue-devtools'
// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  // 获取.env文件里定义的环境变量
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_VERSION, VITE_PORT, VITE_BASE_URL, VITE_API_URL } = env
  return defineConfig({
    plugins: [
      vue(),
      vueDevTools(),
      prismjsPlugin({
        languages: 'all',
        plugins: ['line-numbers', 'show-language', 'copy-to-clipboard', 'inline-color'],
        theme: 'tomorrow',
        css: true,
      }),
      // 自动导入 components 下面的组件，无需 import 引入
      Components({
        deep: true,
        extensions: ['vue'],
        dirs: ['src/components', 'src/layouts'], // 自动导入的组件目录
        resolvers: [
          ElementPlusResolver(),
          (name) => {
            if (name === 'Editor' || name === 'Toolbar') {
              return {
                name: name,
                from: '@wangeditor-next/editor-for-vue',
              }
            }
          },],
        dts: 'src/types/components.d.ts' // 指定类型声明文件的路径
      }),
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: {
          // 这里先设置成true然后pnpm dev 运行之后会生成 .auto-import.json 文件之后，在改为false
          enabled: true,
          filepath: './.auto-import.json',
          globalsPropValue: true
        }
      }),
    ],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://blog.fishbarn.cn:8081',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@style/variables.scss" as *; @use "@style/mixin.scss" as *;`
        }
      }
    },

    resolve: {
      alias: {
        "@": resolvePath("src"),
        "@views": resolvePath("src/views"),
        "@comps": resolvePath("src/components"),
        "@imgs": resolvePath("src/assets/imgs"),
        "@icons": resolvePath("src/assets/icons"),
        "@utils": resolvePath("src/utils"),
        "@plugins": resolvePath("src/plugins"),
        "@style": resolvePath("src/assets/style"),
        "@fonts": resolvePath("src/assets/fonts"),
        "@api": resolvePath("src/api")
      },
    },
  })
}
function resolvePath(paths: string) {
  return fileURLToPath(new URL(paths, import.meta.url))
}
