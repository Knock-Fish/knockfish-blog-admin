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
            status?: 'hide' | 'display'
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
            status: 'publish' | 'draft'
            publishTime?: string
            updatedTime?: string
            userId?: number
        }
        interface ArticleData extends ArticleInfo {
            tags?: number[]
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
            githubUrl?: string
            bilibiliUrl?: string
            background?: string
            roles?: UserRole[]
            roleIds?: number[]
        }
        interface UserRole {
            roleId?: number
            roleName?: string
        }
        interface UserRoleUpdate {
            userId: number
            roleIds?: number[]
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
            type: "directory" | "menu" | "button" | "api"
            parentId: number
            routeName?: string
            path?: string | null
            hidden: number | boolean
            keepAlive: number | boolean
            icon?: string | null
            component?: string | null
            sortOrder: number
            createTime?: string
            status: "enable" | "disable"
            children?: PermissionInfo[]
        }
        type PermissionListData = { list: Api.Permission.PermissionInfo[] }
    }
    /** 角色类型 */
    namespace Role {
        interface RoleInfo {
            roleId: number
            roleName?: string
            description?: string
            createTime?: string
            permissionIds?: number[]
        }
        type RoleListData = Api.Common.PaginatingParams<RoleInfo>
    }
    /** 笔记类型 */
    namespace Note {
        interface NoteInfo {
            noteId?: number
            noteTitle?: string
            noteContent?: string
            sort?: number
            createTime?: string
        }
        interface NoteData extends NoteInfo {
        }
        type NoteListData = Api.Common.PaginatingParams<NoteInfo>
    }
    /** 代码片段类型 */
    namespace CodeSnippet {
        interface CodeSnippetInfo {
            codeSnippetId?: number
            title?: string
            codeCategoryId?: number
            codeCategoryName?: string
            codeContent?: string
            createTime?: string
        }
        type CodeSnippetListData = Api.Common.PaginatingParams<CodeSnippetInfo>
    }
    /** 代码分类类型 */
    namespace CodeCategory {
        interface CodeCategoryInfo {
            codeCategoryId?: number
            codeCategoryName?: string
            sort?: number
            snippetCount?: number
            createTime?: string
        }
        type CodeCategoryListData = Api.Common.PaginatingParams<CodeCategoryInfo>
    }
    /** 资源引用 */
    namespace FileReference {
        interface FileReferenceInfo {
            fileId?: number
            fileName: string
            filePath: string
            fileSize?: number
            mimeType?: string
            referenceId?: number | null
            referenceType?: string
            userId?: number
            createTime?: string
        }
    }
    /** 甘特图任务类型 */
    namespace GanttTask {
        type TaskType = 'task' | 'milestone' | 'project'
        type TaskStatus = 'todo' | 'doing' | 'done' | 'delay' | 'cancel'
        /** 任务信息 */
        interface TaskInfo {
            task_id?: number
            text?: string
            start?: string
            end?: string
            progress?: number
            type?: TaskType
            status?: TaskStatus
            owner?: string
            description?: string
            parent_id?: number | null
            insert_after_id?: number | null
            open?: number
            sort_order?: number
            create_time?: string
            update_time?: string
            children?: TaskInfo[]
        }
    }
    /** 甘特图依赖连线类型 */
    namespace GanttLink {
        /** 连线信息 */
        interface LinkInfo {
            link_id?: number
            source?: number
            target?: number
            type?: number
            create_time?: string
        }
    }
    /** Agent（FastAPI 博客问答服务）接口类型，对应 app/models/__init__.py 与 chat.py
     *  注：字段统一驼峰，且与后端一一对应——Agent 后端已通过 Pydantic alias_generator=to_camel
     *      直接序列化为驼峰（方案 B），前端无需再做 snake→camel 转换。
     *  约定：响应模型驼峰（见 Api.Agent.*，继承 CamelModel）；请求模型仍为 snake（见 Agent ChatRequest 等）。 */
    namespace Agent {
        /** 会话（对应 Agent ThreadOut） */
        interface Thread {
            threadId: string            // UUID 字符串
            userId: number              // 必填
            title: string | null        // 未命名时为 null
            lastMessage: string | null
            messageCount: number
            createdAt: string           // ISO
            updatedAt: string
        }
        /** 会话消息（对应 Agent MessageOut） */
        interface Message {
            messageId: number
            threadId: string
            role: "user" | "assistant" | "tool"
            content: string
            toolCalls: unknown[] | null
            toolCallId: string | null
            tokens: number | null
            createdAt: string
        }
        /** 一次性对话响应（对应 Agent ChatResponse） */
        interface ChatReply {
            reply: string
            threadId: string
        }
    }
}