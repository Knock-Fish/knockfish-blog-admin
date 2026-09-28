import { springBootClient } from "@/utils/http"
export class PermissionService {
    // 获取权限信息
    static getPermissionListData(){
        return springBootClient.get<Api.Permission.PermissionListData>({
            url: "/api/permission"
        })
    }
    // 获取用户的权限
    static getUserPermissions(params: number){
        return springBootClient.get<Api.Permission.PermissionListData>({
            url: `/api/permission/user/${params}`
        })
    }
    // 获取角色的权限
    static getRolePermissions(params: number){
        return springBootClient.get<Api.Permission.PermissionListData>({
            url: `/api/permission/role/${params}`
        })
    }
    // 获取角色的权限ids
    static getRolePermissionIds(params: number){
        return springBootClient.get<{list: number[]}>({
            url: `/api/permission/role/ids/${params}`
        })
    }
    // 添加权限信息
    static addPermission(data: Api.Permission.PermissionInfo){
        return springBootClient.post({
            url: "/api/permission",
            data
        })
    }
    // 删除权限信息
    static delPermission(params: number){
        return springBootClient.del({
            url: `/api/permission/${params}`
        })
    }
}