import { springBootClient } from "@/utils/http"
export class RoleService {
    static getRoleListData(params: Record<string, any>){
        return springBootClient.get<Api.Role.RoleListData>({
            url: "/api/role/with-permission",
            params
        })
    }
    static updateRolePermissions(data: Api.Role.RoleInfo){
        return springBootClient.put({
            url: "/api/role/permission",
            data
        })
    }
    static addpermission(data: Api.Role.RoleInfo){
        return springBootClient.post({
            url: "/api/role",
            data
        })
    }
    static updatePermission(data: Api.Role.RoleInfo){
        return springBootClient.put({
            url: "/api/role",
            data
        })
    }
    static delRole(params: number){
        return springBootClient.del({
            url: `/api/role/${params}`
        })
    }
}