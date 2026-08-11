import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import viteCompression from 'vite-plugin-compression'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'

export default ({ mode }: { mode: string }) => {
  // 获取当前工作目录
  const root = process.cwd()
  // 加载环境变量（从 .env 文件）
  const env = loadEnv(mode, root)
  // 解构获取环境变量
  const { VITE_VERSION, VITE_PORT, VITE_BASE_URL, VITE_API_URL } = env
  // 判断是否为生产环境
  const isProduction = mode === 'production'

  return defineConfig({
    // ========== 插件配置 ==========
    plugins: [
      vue(),
      Icons({
        compiler: 'vue3',
        autoInstall: true,
      }),
      !isProduction && vueDevTools(),
      Components({
        deep: true,                      // 深度扫描子目录
        extensions: ['vue'],             // 文件扩展名
        dirs: ['src/components', 'src/layouts'], // 组件目录
        resolvers: [ElementPlusResolver()], // Element Plus 按需加载
        dts: 'src/types/components.d.ts' // 生成类型声明文件
      }),

      // 自动导入 API 配置（无需手动 import）
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'], // 自动导入的库
        resolvers: [ElementPlusResolver()], // Element Plus 按需加载
        dts: 'src/types/auto-imports.d.ts', // 生成类型声明文件
        eslintrc: {
          enabled: false,                // 是否生成 ESLint 配置
          filepath: './.auto-import.json',
          globalsPropValue: true
        }
      }),

      // Gzip 压缩配置
      viteCompression({
        verbose: true,                  // 是否在控制台输出压缩结果
        disable: false,                 // 是否禁用
        algorithm: 'gzip',              // 压缩算法,可选 [ 'gzip' , 'brotliCompress' ,'deflate' , 'deflateRaw']
        ext: '.gz',                     // 压缩后的文件名后缀
        threshold: 10240,               // 只有大小大于该值的资源会被处理 10240B = 10KB
        deleteOriginFile: false        // 压缩后是否删除原文件
      }),

      // Brotli 压缩配置
      viteCompression({
        verbose: true,
        disable: false,
        algorithm: 'brotliCompress',    // 使用 brotli 算法
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false,
      })
    ],

    // ========== 开发服务器配置 ==========
    server: {
      host: true,                       // 监听所有网络接口（允许局域网访问）
      port: 5173,                       // 开发服务器端口
      proxy: {
        '/api': {                       // 代理 /api 请求
          target: "http://localhost:8081", // 后端服务地址
          changeOrigin: true,           // 修改请求头中的 origin
          rewrite: (path) => path.replace(/^\/api/, '/api'), // 路径重写（保持原样）
        }
      },
    },

    // ========== 依赖优化配置 ==========
    optimizeDeps: {
      include: [                        // 预构建的依赖（加快冷启动）
        'vue',
        'vue-router',
        'pinia',
        'axios',
        '@vueuse/core'
      ],
      exclude: ['echarts', 'xlsx'] // 排除预构建（这些库较大）
    },

    // ========== CSS 预处理器配置 ==========
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@style/variables.scss" as *; @use "@style/mixin.scss" as *;`
          // 全局注入 SCSS 变量和混合函数，无需在每个文件手动引入
        }
      }
    },

    // ========== 路径别名配置 ==========
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

    // ========== 构建配置 ==========
    build: {
      target: 'es2020',                 // 构建目标（ES2020，提升性能）
      outDir: 'dist',                   // 输出目录
      assetsDir: 'assets',              // 静态资源目录
      assetsInlineLimit: 4096,         // 小于 4KB 的资源内联为 base64
      cssCodeSplit: true,              // CSS 代码分割（按路由）
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'terser' : 'esbuild', // 生产用 terser，开发用 esbuild
      modulePreload: {
        polyfill: true                  // 启用 modulePreload polyfill
      },
      terserOptions: {
        compress: {
          drop_console: isProduction,   // 生产环境移除 console
          drop_debugger: isProduction,  // 生产环境移除 debugger
          join_vars: true, // 合并连续的变量声明，减少代码行数
          reduce_vars: true,  // 削减多余变量
          dead_code: true // 移除无法访问的代码（如 if(false)）
        }
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules/vue') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia') ||
              id.includes('node_modules/@vueuse')) {
              return 'vue'
            }
            if (id.includes('node_modules/element-plus')) {
              return 'elementPlus'
            }
            if (id.includes('node_modules/echarts') ||
              id.includes('node_modules/vue-echarts')) {
              return 'echarts'
            }
            if (id.includes('node_modules/xlsx')) {
              return 'xlsx'
            }
            if (id.includes('node_modules/lodash')) {
              return 'lodash'
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: true
    }
  })
}

// ========== 辅助函数：解析路径 ==========
function resolvePath(paths: string) {
  // 将相对路径转换为绝对路径（基于 import.meta.url）
  return fileURLToPath(new URL(paths, import.meta.url))
}