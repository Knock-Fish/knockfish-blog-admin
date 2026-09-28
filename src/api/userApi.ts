import { springBootClient } from "@/utils/http"
export class UserService{
    static getUserListData(params: Record<string, any>){
        return springBootClient.get<Api.User.UserListData>({
            url: "/api/user/page",
            params
        })
    }

    static getUserInfo(params: Api.User.UserInfo){
        return springBootClient.get<Api.User.UserInfo>({
            url: "/api/user",
            params
        })
    }

    static passwordChange(data: Api.PasswordChange.Change){
        return springBootClient.put({
            url: "/api/user/password",
            data
        })
    }

    static updateUser(data: Api.User.UserInfo){
        return springBootClient.put<Api.User.UserInfo>({
            url: "/api/user",
            data
        })
    }

    static updateUserRoles(data: Api.User.UserRoleUpdate){
        return springBootClient.put({
            url: "/api/user/role",
            data
        })
    }

    static getUserRoles(userId: number){
        return springBootClient.get<Api.User.UserRole[]>({
            url: `/api/user/${userId}/roles`
        })
    }
}