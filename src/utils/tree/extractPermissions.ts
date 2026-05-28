type Permission = Api.Permission.PermissionInfo
export function extractPermissions(permissions: Permission[]){
    return permissions.map(p => p.permissionCode)
}