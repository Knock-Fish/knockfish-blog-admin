# knockfish-blog-admin

![Vue](https://img.shields.io/badge/Vue-3.5-42b883)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.13-409EFF)
![Pinia](https://img.shields.io/badge/Pinia-3-yellow)
![ECharts](https://img.shields.io/badge/ECharts-6-AA344D)
![License](https://img.shields.io/badge/license-MIT-blue)

## 相关项目

| 项目 | 说明 |
| --- | --- |
| [knockfish-blog-backend](https://github.com/Knock-Fish/knockfish-blog-backend) | Spring Boot 后端服务 |
| [knockfish-blog-frontend](https://github.com/Knock-Fish/knockfish-blog-frontend) | Vue 3 前台展示端 |
| **knockfish-blog-admin** | **Vue 3 后台管理端（当前仓库）** |
| [knockfish-blog-agent](https://github.com/Knock-Fish/knockfish-blog-agent) | FastAPI + LangGraph AI Agent |

KnockFish 博客系统的后台管理端，面向管理员提供文章发布、分类标签、笔记、友链、站点、文件存储、用户权限等完整运营能力。

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Vue 3.5 + TypeScript |
| 构建 | Vite 8 |
| UI | Element Plus 2.13 |
| 状态管理 | Pinia 3 + pinia-plugin-persistedstate |
| 路由 | Vue Router 5 |
| HTTP | axios（含流式 stream 封装） |
| Markdown 编辑器 | md-editor-v3 + @vavt/v3-extension + @vavt/cm-extension |
| 数学公式 | katex |
| 图表 | ECharts 6 + vue-echarts |
| 表格 | 自封装 PageTable 组件（含列设置、刷新、全屏、Excel 导出） |
| Excel | xlsx + file-saver |
| 拖拽 | vue-draggable-next |
| 词云 | vue3-word-cloud |
| JWT | jwt-decode |
| 工具库 | @vueuse/core、dayjs、lodash、nprogress |
| 图标 | @iconify/vue + unplugin-icons（@iconify-json/mdi + @iconify-json/ri） |
| 自动导入 | unplugin-auto-import + unplugin-vue-components |
| 压缩 | vite-plugin-compression（gzip + brotli） |

## 功能模块

- 登录：JWT 鉴权，前端解码 token 获取权限码
- 工作台：统计卡片、文章趋势图、活动列表、快捷操作、待办、饼图
- 仪表盘：文章概览、最新文章、标签云
- 文章管理：列表、搜索、草稿 / 发布状态切换
- 文章编辑器：md-editor-v3 富文本，支持图片上传至 R2 并绑定 fileIds
- 文章详情：锚点导航
- 分类 / 标签：CRUD
- 代码片段：按代码分类归档
- 笔记：CRUD
- 友链：CRUD
- 站点导航：CRUD（含分类）
- 文件管理：
  - 文件存储：R2 文件列表与查看
  - 文件引用：file_reference 绑定关系管理
- 账户：
  - 用户管理：CRUD、角色分配
  - 角色管理：CRUD、权限分配
  - 权限管理：权限树
- 设置：个人信息、修改密码、博客设置
- AI 聊天：内嵌 chat-ai 组件，与 Agent 服务流式对话
- 异常页：403 / 404 / 500

## 目录结构

```
src/
├── api/                # 接口请求封装（15 个模块）
├── assets/
│   ├── imgs/           # 静态图片
│   ├── style/          # 全局样式（变量、mixin、暗色、markdown、reset）
│   └── svg/            # 社交图标、logo
├── components/
│   ├── base-vchart/    # ECharts 基础封装
│   ├── chat-ai/        # AI 聊天组件（Bubble、Sender、Thinking、Prompts 等）
│   ├── page-table/     # 通用表格组件（列设置、刷新、全屏、Excel 导出）
│   ├── search-bar/     # 通用搜索栏（input/select/radio/date）
│   ├── upload/         # 文件上传
│   ├── md-editor/      # Markdown 编辑器封装
│   ├── dynamic-form/   # 动态表单
│   ├── drag-verify/    # 拖拽验证
│   ├── sakura-background/
│   └── exception/      # 异常占位
├── composables/        # 表格列权限组合式函数
├── constants/          # 常量与权限编码
├── directives/         # 自定义指令（v-permission 权限控制）
├── layouts/
│   ├── header-bar/     # 顶栏（面包屑、搜索、头像）
│   ├── sidebar-menu/   # 侧边菜单（树形）
│   ├── page-content/   # 内容区
│   └── work-tab/       # 多页签（含右键菜单）
├── mock/               # mock 数据
├── router/
│   ├── guards/         # 路由守卫（before / after）
│   ├── routes/         # 静态路由 + 动态路由
│   └── utils/          # 菜单转路由、动态注册
├── store/              # Pinia（menu、user、worktab）
├── types/              # 自动生成的类型声明
├── typings/            # api.d.ts 业务类型
├── utils/
│   ├── http/           # axios 封装（含 stream 流式）
│   ├── jwt-verify/     # JWT 解码
│   ├── navigation/
│   ├── tree/           # 权限树、菜单树、路由辅助
│   └── icon-registry.ts # 图标注册
├── views/
│   ├── login/          # 登录
│   ├── dashboard/      # 仪表盘 + 工作台
│   ├── article/        # 文章管理
│   ├── editor/         # 文章编辑器
│   ├── detail/         # 文章详情
│   ├── category/       # 分类
│   ├── tag/            # 标签
│   ├── archive/        # 归档（代码分类 / 代码片段 / 笔记）
│   ├── link/           # 友链
│   ├── site/           # 站点导航
│   ├── file/           # 文件存储 / 文件引用
│   ├── file-detail/    # 文件详情
│   ├── account/        # 用户 / 角色 / 权限
│   ├── setting/        # 设置（个人信息 / 修改密码 / 博客设置）
│   ├── chat-ai/        # AI 聊天
│   ├── md-editor/      # Markdown 编辑器
│   └── exception/      # 403 / 404 / 500
├── App.vue
└── main.ts
```

## 快速开始

### 环境要求

- Node.js 20.19+ 或 22.12+
- npm（项目使用 package-lock.json）

### 配置

环境变量位于根目录：

- `.env`：通用配置（版本号、端口 5174、base 路径 `/knockfish-blog-admin/`）
- `.env.development`：开发环境（`VITE_API_URL = http://localhost:8081`）
- `.env.production`：生产环境（`VITE_API_URL = `，同源部署）

### 安装与运行

```sh
# 安装依赖
npm install

# 开发模式（默认端口 5174）
npm run dev

# 类型检查 + 生产构建
npm run build

# 仅类型检查
npm run type-check

# 预览生产构建
npm run preview
```

开发服务器已配置代理：`/api` → `http://localhost:8081`。

## 路径别名

```
@         → src
@views    → src/views
@comps    → src/components
@imgs     → src/assets/imgs
@style    → src/assets/style
@utils    → src/utils
@api      → src/api
```

## 权限控制

- 路由级：根据用户权限码动态注册路由（asyncRoutes + registerRoutes）
- 按钮级：`v-permission` 指令，传入权限编码控制元素显隐
- 菜单级：根据权限树渲染侧边菜单
- 表格列级：`useTableColumnPermission` 组合式函数控制列显隐

## 构建特性

- 生产环境使用 terser 压缩，自动移除 `console` 与 `debugger`
- 分包策略：vue 全家桶、element-plus、echarts、xlsx、lodash 各自独立 chunk
- 资源内联：小于 4KB 的资源自动转 base64
- 输出 gzip + brotli 双压缩
- CSS 按路由代码分割
