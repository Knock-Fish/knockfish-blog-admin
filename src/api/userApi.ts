import request from "@/utils/http"
export class UserService{
    // 获取所有用户
    static getUserListData(params: Record<string, any>){
        return request.get<Api.User.UserListData>({
            url: "/api/user/page",
            params
        })
    }

    static getUserInfo(params: Api.User.UserInfo){
        return request.get<Api.User.UserInfo>({
            url: "/api/user",
            params
        })
    }
    // 修改密码
    static passwordChange(data: Api.PasswordChange.Change){
        return request.put({
            url: "/api/user/password",
            data
        })
    }
    // 更新用户信息
    static updateUser(data: Api.User.UserInfo){
        return request.put<Api.User.UserInfo>({
            url: "/api/user",
            data
        })
    }
}