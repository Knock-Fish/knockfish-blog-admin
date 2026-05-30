/**
 * 路由别名，方便快速找到页面，同时可以用作路由跳转
 */

/** 路由别名 */
export const RoutesAlias = {
    Layout : '/', // 布局容器
    Login : '/login',   // 登录
    Setting: '/setting',   // 系统设置
    Workbench : '/dashboard/workbench',   // 工作台
    Overview: '/dashboard/overview',    // 分析页
    Article : '/article',
    Editor : '/editor/:id', // 编辑
    Publish : '/publish',   // 发布
    Detail: '/detail/:id',  // 文章详情
    Tag : '/tag',   // 标签
    Category : '/category', // 分类
    Site : '/site',  // 站点
    Archive : '/archive',    // 归档
    Link : '/link',  // 友链
    FileList: '/file-list', // 文件
    FileDetail: '/file-detail', // 文件详情
    User: '/account/user',  // 用户
    Role: '/account/role',  // 角色
    Permission: '/account/permission',   // 权限
    Exception404 : '/404',   // 404
} as const

// 自动从对象推导出类型
export type RoutesAlias = (typeof RoutesAlias)[keyof typeof RoutesAlias]