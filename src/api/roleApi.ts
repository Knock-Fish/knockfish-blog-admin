import request from "@/utils/http"
export class RoleService {
    static getRoleListData(params: Record<string, any>){
        return request.get<Api.Role.RoleListData>({
            url: "/api/role/with-permission",
            params
        })
    }
    static updateRolePermissions(data: Api.Role.RoleInfo){
        return request.put({
            url: "/api/role/permission",
            data
        })
    }
    static addpermission(data: Api.Role.RoleInfo){
        return request.post({
            url: "/api/role",
            data
        })
    }
    static updatePermission(data: Api.Role.RoleInfo){
        return request.put({
            url: "/api/role",
            data
        })
    }
    static delRole(params: number){
        return request.del({
            url: `/api/role/${params}`
        })
    }
}