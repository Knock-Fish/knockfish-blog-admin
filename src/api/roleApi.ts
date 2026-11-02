import { springBootClient } from "@/utils/http"
export class RoleService {
    static getRoleListData(params: Record<string, any>){
        return springBootClient.get<Api.Role.RoleListData>({
            url: "/api/admin/role/with-permission",
            params
        })
    }
    static updateRolePermissions(data: Api.Role.RoleInfo){
        return springBootClient.put({
            url: "/api/admin/role/permission",
            data
        })
    }
    static addpermission(data: Api.Role.RoleInfo){
        return springBootClient.post({
            url: "/api/admin/role",
            data
        })
    }
    static updatePermission(data: Api.Role.RoleInfo){
        return springBootClient.put({
            url: "/api/admin/role",
            data
        })
    }
    static delRole(params: number){
        return springBootClient.del({
            url: `/api/admin/role/${params}`
        })
    }
}