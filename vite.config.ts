import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import viteCompression from 'vite-plugin-compression'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
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
      // 自动导入 components 下面的组件，无需 import 引入
      Components({
        deep: true,
        extensions: ['vue'],
        dirs: ['src/components', 'src/layouts'], // 自动导入的组件目录
        resolvers: [
          ElementPlusResolver()],
        dts: 'src/types/components.d.ts' // 指定类型声明文件的路径
      }),
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: {
          // 这里先设置成true然后pnpm dev 运行之后会生成 .auto-import.json 文件之后，在改为false
          enabled: false,
          filepath: './.auto-import.json',
          globalsPropValue: true
        }
      }),
      viteCompression({
        verbose: true, // 是否在控制台输出压缩结果
        disable: false, // 是否禁用
        algorithm: 'gzip', // 压缩算法,可选 [ 'gzip' , 'brotliCompress' ,'deflate' , 'deflateRaw']
        ext: '.gz', // 压缩后的文件名后缀
        threshold: 10240, // 只有大小大于该值的资源会被处理 10240B = 10KB
        deleteOriginFile: false // 压缩后是否删除原文件
      }),
    ],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: "http://blog.fishbarn.cn:8081",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        }
      },
    },
    // 预加载项目必需的组件
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        '@vueuse/core',
        'echarts',
        'element-plus/es/components/form/style/css',
        'element-plus/es/components/form-item/style/css',
        'element-plus/es/components/button/style/css',
        'element-plus/es/components/input/style/css',
        'element-plus/es/components/input-number/style/css',
        'element-plus/es/components/switch/style/css',
        'element-plus/es/components/upload/style/css',
        'element-plus/es/components/menu/style/css',
        'element-plus/es/components/col/style/css',
        'element-plus/es/components/icon/style/css',
        'element-plus/es/components/row/style/css',
        'element-plus/es/components/tag/style/css',
        'element-plus/es/components/dialog/style/css',
        'element-plus/es/components/loading/style/css',
        'element-plus/es/components/radio/style/css',
        'element-plus/es/components/radio-group/style/css',
        'element-plus/es/components/popover/style/css',
        'element-plus/es/components/scrollbar/style/css',
        'element-plus/es/components/tooltip/style/css',
        'element-plus/es/components/dropdown/style/css',
        'element-plus/es/components/dropdown-menu/style/css',
        'element-plus/es/components/dropdown-item/style/css',
        'element-plus/es/components/sub-menu/style/css',
        'element-plus/es/components/menu-item/style/css',
        'element-plus/es/components/divider/style/css',
        'element-plus/es/components/card/style/css',
        'element-plus/es/components/link/style/css',
        'element-plus/es/components/breadcrumb/style/css',
        'element-plus/es/components/breadcrumb-item/style/css',
        'element-plus/es/components/table/style/css',
        'element-plus/es/components/tree-select/style/css',
        'element-plus/es/components/table-column/style/css',
        'element-plus/es/components/select/style/css',
        'element-plus/es/components/option/style/css',
        'element-plus/es/components/pagination/style/css',
        'element-plus/es/components/tree/style/css',
        'element-plus/es/components/alert/style/css',
        'element-plus/es/components/radio-button/style/css',
        'element-plus/es/components/checkbox-group/style/css',
        'element-plus/es/components/checkbox/style/css',
        'element-plus/es/components/tabs/style/css',
        'element-plus/es/components/tab-pane/style/css',
        'element-plus/es/components/rate/style/css',
        'element-plus/es/components/date-picker/style/css',
        'element-plus/es/components/notification/style/css',
        'element-plus/es/components/image/style/css',
        'element-plus/es/components/statistic/style/css',
        'element-plus/es/components/watermark/style/css',
        'element-plus/es/components/config-provider/style/css',
        'element-plus/es/components/text/style/css',
        'element-plus/es/components/drawer/style/css',
        'element-plus/es/components/color-picker/style/css',
        'element-plus/es/components/backtop/style/css',
        'element-plus/es/components/message-box/style/css',
        'element-plus/es/components/skeleton/style/css',
        'element-plus/es/components/skeleton/style/css',
        'element-plus/es/components/skeleton-item/style/css',
        'element-plus/es/components/badge/style/css',
        'element-plus/es/components/steps/style/css',
        'element-plus/es/components/step/style/css',
        'element-plus/es/components/avatar/style/css',
        'element-plus/es/components/descriptions/style/css',
        'element-plus/es/components/descriptions-item/style/css',
        'element-plus/es/components/checkbox-group/style/css',
        'element-plus/es/components/progress/style/css',
        'element-plus/es/components/image-viewer/style/css',
        'element-plus/es/components/empty/style/css',
        'element-plus/es/components/segmented/style/css',
        'element-plus/es/components/calendar/style/css',
        'element-plus/es/components/message/style/css',
        'xlsx',
        'element-plus/es/components/timeline/style/css',
        'element-plus/es/components/timeline-item/style/css',
      ]
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
    }
  })
}
function resolvePath(paths: string) {
  return fileURLToPath(new URL(paths, import.meta.url))
}
