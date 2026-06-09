/**
 * namespace: Api
 * 所有接口相关类型定义
 */
declare namespace Api {
    /** 基础类型 */
    namespace Http {
        /** 基础响应 */
        interface BaseResponse<T = any> {
            // 状态码
            code: number
            // 消息
            msg: string
            // 数据
            data: T
        }
    }
    /** 通用类型 */
    namespace Common {
        /** 分页参数 */
        interface PaginatingParams<T> {
            list: T[]
            /** 当前页码 */
            pageNum: number
            /** 每页条数 */
            pageSize: number
            /** 总条数 */
            total: number
        }
    }
    /** 认证类型 */
    namespace Auth {
        /** 登录参数 */
        interface LoginParams {
            username: string
            password: string
        }
        /** 登录响应 */
        interface LoginResponse extends Api.User.UserInfo {
            token: string
        }
    }
    /** 修改密码接口 */
    namespace PasswordChange {
        interface Change {
            oldPassword: string
            password: string
            confirmPassword: string
        }
    }
    /** 网站类别类型 */
    namespace Category {
        /** 类别信息 */
        interface CategoryInfo {
            categoryId?: number
            categoryName?: string
            createTime?: string
            siteCount?: number
            sites?: Api.Site.SiteInfo[]
        }
        type CategoryListData = Api.Common.PaginatingParams<CategoryInfo>
    }
    /** 友链类型 */
    namespace Link {
        interface LinkInfo {
            linkId?: number
            linkName?: string
            linkUrl?: string
            description?: string
            avatar?: string
            status?: 'HIDE' | 'DISPLAY'
            createTime?: string
        }
        type LinkListData = Api.Common.PaginatingParams<LinkInfo>
    }
    /** 网站类型 */
    namespace Site {
        interface SiteInfo {
            siteId?: number
            siteName?: string
            description?: string
            ico?: string
            siteUrl?: string
            createTime?: string
            categoryId?: number
            categoryName?: string
        }
        type SiteListData = Api.Common.PaginatingParams<SiteInfo>
    }
    /** 标签类型 */
    namespace Tag {
        interface TagInfo {
            tagId?: number
            tagName?: string
            color?: string
            createTime?: string
        }
        type TagListData = Api.Common.PaginatingParams<TagInfo>
    }
    /** 文章类型 */
    namespace Article {
        interface ArticleInfo {
            articleId?: number
            title?: string
            cover: string
            description?: string
            content: string
            status: 'PUBLISH' | 'DRAFT'
            publishTime?: string
            updatedTime?: string
            tags?: number[]
            userId?: number
            username?: string
        }
        interface ArticleDetailInfo extends ArticleInfo {
            tagIds: string
            tagNames: string
            tagColors: string
            username: string
        }
        type ArticleListData = Api.Common.PaginatingParams<ArticleInfo>
    }
    /** 用户类型 */
    namespace User {
        interface UserInfo {
            userId?: number
            username?: string
            email?: string
            avatar?: string
            nickname?: string
            description?: string
        }
        type UserListData = Api.Common.PaginatingParams<UserInfo>
    }
    /** R2文件类型 */
    namespace R2File {
        /** 详细文件类型 */
        interface R2FileInfo {
            key: string,
            url: string,
            size: string,
            sizeFormat: string,
            lastModified: string
        }
    }
    /** 权限类型 */
    namespace Permission {
        interface PermissionInfo {
            permissionId: number
            permissionName: string
            permissionCode: string
            type: "DIRECTORY" | "MENU" | "BUTTON" | "API"
            parentId: number
            routeName?: string
            path?: string | null
            hidden: number | boolean
            keepAlive: number | boolean
            icon?: string  | null
            component?: string | null
            sortOrder: number
            createTime?: string
            status: "ENABLE" | "DISABLE"
            children?: PermissionInfo[]
        }
        type PermissionListData = { list: Api.Permission.PermissionInfo[] }
    }
    /** 角色类型 */
    namespace Role{
        interface RoleInfo{
            roleId: number
            roleName?: string
            description?: string
            createTime?: string
            permissionIds?: number[]
        }
        type RoleListData = Api.Common.PaginatingParams<RoleInfo>
    }
}