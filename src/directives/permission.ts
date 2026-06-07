import { useUserStore } from '@/store/modules/user'
import type { Directive, App } from 'vue'
// 权限指令：v-permission="'requiredPermission'"
const permissionDirective: Directive = {
  // 当指令绑定到元素时调用
  mounted(el:HTMLElement, binding: DirectiveBinding) {
    // 从 store 中获取用户权限列表
    const userStore = useUserStore()
    const userPermissions = userStore.permissions || []
    
    // 获取指令参数（所需权限）
    const requiredPermission = binding.value
    
    // 权限校验：无权限则移除元素
    if (!userPermissions.includes(requiredPermission)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}

// 全局注册指令
export function setupPermissionDirective(app: App){
    app.directive('permission', permissionDirective)
}
