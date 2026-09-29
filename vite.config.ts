import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import viteCompression from 'vite-plugin-compression'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// ========== mermaid 相关的独占依赖（已确认项目其它依赖不共用）==========
// katex / dompurify / @braintree/sanitize-url 不可列入：前两者为项目或 md-editor 直接依赖，
// 后者被 marked 共用 —— 把它们排除出预缓存会影响其它功能离线可用。
const MERMAID_ONLY_DEPS = [
  'node_modules/mermaid',
  'node_modules/elkjs',
  'node_modules/cytoscape',
  'node_modules/dagre',
  'node_modules/@upsetjs/venn.js',
  'node_modules/chevrotain',
  'node_modules/langium',
  'node_modules/@mermaid-js/parser',
  'node_modules/roughjs',
  'node_modules/khroma',
  'node_modules/ts-dedent',
  'node_modules/d3',
]

const isMermaidId = (id: string) => MERMAID_ONLY_DEPS.some((dep) => id.includes(dep))

/**
 * 判断 chunk 是否属于 mermaid 图型代码。
 * 入口 mermaid.core.mjs 很小（约 50KB），真正昂贵的是它内部 37 个动态 import 的图型分片
 * （elk ~1.4MB、cytoscape ~419KB 等）；既看 facadeModuleId（有明确入口的分片），
 * 也看 moduleIds 全集（多个图型共用的共享分片）。
 */
const isMermaidChunk = (info: { facadeModuleId?: string | null; moduleIds?: string[] }) =>
  [info.facadeModuleId, ...(info.moduleIds ?? [])]
    .filter(Boolean)
    .some((id) => isMermaidId(id as string))

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
      }),
      // 渐进式应用
      VitePWA({
        registerType: 'autoUpdate', // 自动更新 Service Worker
        includeAssets: ['favicon.ico'],
        manifest: {
          id: '/',
          name: '鱼后台',       // 应用全名
          short_name: 'FishBarnApp',      // 应用短名
          description: '渐进式 Web 应用',
          theme_color: '#409EFF',
          background_color: '#ffffff',
          display: 'standalone',     // 隐藏浏览器UI
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
          ],
        },
      workbox: {
        // 缓存策略配置
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // mermaid 的图型分片（每种图一个动态 chunk，合计数 MB）不进预缓存清单：
        // 它们只在真正出现该图型时才需要，放进 precache 会让安装 SW 时一次性下载全部。
        globIgnores: ['assets/js/mermaid/**'],
        runtimeCaching: [
          {
            // 按需使用时再拉取并缓存，兼顾「不拖累首装」与「二次访问/离线可用」
            urlPattern: /\/assets\/js\/mermaid\/.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mermaid-chunks',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      }
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
        '@vueuse/core',
        // mermaid 很大且含大量动态图型分片；不预构建的话，
        // 首次 import('mermaid') 时才被发现 → 触发依赖重优化并整页 reload（表现为图表延迟出现）
        'mermaid'
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
          chunkFileNames: (chunkInfo) =>
            isMermaidChunk(chunkInfo)
              ? 'assets/js/mermaid/[name]-[hash].js' // 图型分片单独目录，便于 PWA globIgnores 排除
              : 'assets/js/[name]-[hash].js',
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