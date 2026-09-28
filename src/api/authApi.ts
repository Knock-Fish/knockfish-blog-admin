import { springBootClient } from "@/utils/http"
export class AuthService{
    // 登录
    static login(data: Api.Auth.LoginParams){
        return springBootClient.post<Api.Auth.LoginResponse>({
            url: '/api/auth/login',
            data
        })
    }
}