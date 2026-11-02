import { springBootClient } from "@/utils/http"
export class UserService{
    static getUserListData(params: Record<string, any>){
        return springBootClient.get<Api.User.UserListData>({
            url: "/api/admin/user/page",
            params
        })
    }

    static getUserInfo(params: Api.User.UserInfo){
        return springBootClient.get<Api.User.UserInfo>({
            url: "/api/front/user",
            params
        })
    }

    /** 新增用户（对应后端 POST /api/user，createUser） */
    static addUser(data: Api.User.UserCreate){
        return springBootClient.post({
            url: "/api/admin/user",
            data
        })
    }

    /** 删除用户（对应后端 DELETE /api/user/{id}）
     *  注意：当前 UserController 还没有 @DeleteMapping 端点，调用会 404，
     *  需在后端补一个删除映射后才能生效（见对话说明）。 */
    static delUser(userId: number){
        return springBootClient.del({
            url: `/api/admin/user/${userId}`
        })
    }

    static passwordChange(data: Api.PasswordChange.Change){
        return springBootClient.put({
            url: "/api/admin/user/password",
            data
        })
    }

    static updateUser(data: Api.User.UserInfo){
        return springBootClient.put<Api.User.UserInfo>({
            url: "/api/admin/user",
            data
        })
    }

    static updateUserRoles(data: Api.User.UserRoleUpdate){
        return springBootClient.put({
            url: "/api/admin/user/role",
            data
        })
    }

    static getUserRoles(userId: number){
        return springBootClient.get<Api.User.UserRole[]>({
            url: `/api/admin/user/${userId}/roles`
        })
    }
}