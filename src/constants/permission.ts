// ========== 仪表盘模块 ==========
export const DashboardPerm = {
  VIEW: 'blog:dashboard:view',
  OVERVIEW: 'blog:overview:view',
  WORKBENCH: 'blog:workbench:view',
} as const

// ========== 文章模块 ==========
export const ArticlePerm = {
  MANAGE: 'blog:article:manage',
  ADD: 'blog:article:add',
  EDIT: 'blog:article:edit',
  DELETE: 'blog:article:delete',
  PUBLISH: 'blog:article:publish',
} as const

// ========== 标签模块 ==========
export const TagPerm = {
  MANAGE: 'blog:tag:manage',
  ADD: 'blog:tag:add',
  EDIT: 'blog:tag:edit',
  DELETE: 'blog:tag:delete',
} as const

// ========== 分类模块 ==========
export const CategoryPerm = {
  MANAGE: 'blog:category:manage',
  ADD: 'blog:category:add',
  EDIT: 'blog:category:edit',
  DELETE: 'blog:category:delete',
} as const

// ========== 站点模块 ==========
export const SitePerm = {
  MANAGE: 'blog:site:manage',
  ADD: 'blog:site:add',
  EDIT: 'blog:site:edit',
  DELETE: 'blog:site:delete',
} as const

// ========== AI小助手模块 ==========
export const ChatPerm = {
  VIEW: 'blog:chat:view',
} as const

// ========== 友链模块 ==========
export const LinkPerm = {
  MANAGE: 'blog:link:manage',
  ADD: 'blog:link:add',
  EDIT: 'blog:link:edit',
  DELETE: 'blog:link:delete',
} as const

// ========== 文件模块 ==========
export const FilePerm = {
  MANAGE: 'blog:file:manage',
  VIEW: 'blog:file:view',
} as const

// ========== 账户管理模块 ==========
export const AccountPerm = {
  MANAGE: 'blog:account:manage',
} as const

// ========== 用户模块 ==========
export const UserPerm = {
  MANAGE: 'blog:user:manage',
  ADD: 'blog:user:add',
  EDIT: 'blog:user:edit',
  DELETE: 'blog:user:delete',
  RESET_PWD: 'blog:user:resetPwd',
  ASSIGN_ROLE: 'blog:user:role',
} as const

// ========== 角色模块 ==========
export const RolePerm = {
  MANAGE: 'blog:role:manage',
  ADD: 'blog:role:add',
  EDIT: 'blog:role:edit',
  DELETE: 'blog:role:delete',
} as const

// ========== 权限管理模块 ==========
export const PermissionPerm = {
  MANAGE: 'blog:permission:manage',
  ADD: 'blog:permission:add',
  EDIT: 'blog:permission:edit',
  DELETE: 'blog:permission:delete',
  ASSIGN: 'blog:permission:assign',
} as const

// ========== 系统设置模块 ==========
export const SettingPerm = {
  MANAGE: 'blog:setting:manage',
} as const

// ========== 页面视图模块 ==========
export const PagePerm = {
  EDITOR: 'blog:editor:view',
  PUBLISH: 'blog:publish:view',
  DETAIL: 'blog:detail:view',
} as const

// ========== 笔记模块 ==========
export const NotePerm = {
  ADD: 'blog:note:add',
  EDIT: 'blog:note:edit',
  DELETE: 'blog:note:delete',
} as const

// ========== 代码分类模块 ==========
export const CodeCategoryPerm = {
  ADD: 'blog:code-category:add',
  EDIT: 'blog:code-category:edit',
  DELETE: 'blog:code-category:delete',
} as const

// ========== 代码片段模块 ==========
export const CodeSnippetPerm = {
  ADD: 'blog:code-snippet:add',
  EDIT: 'blog:code-snippet:edit',
  DELETE: 'blog:code-snippet:delete',
} as const

// 合并全部权限码，方便类型提取
export const PermCode = {
  ...DashboardPerm,
  ...ArticlePerm,
  ...TagPerm,
  ...CategoryPerm,
  ...SitePerm,
  ...ChatPerm,
  ...LinkPerm,
  ...FilePerm,
  ...AccountPerm,
  ...UserPerm,
  ...RolePerm,
  ...PermissionPerm,
  ...SettingPerm,
  ...PagePerm,
  ...NotePerm,
  ...CodeCategoryPerm,
  ...CodeSnippetPerm,
} as const

export type PermCodeType = typeof PermCode[keyof typeof PermCode]