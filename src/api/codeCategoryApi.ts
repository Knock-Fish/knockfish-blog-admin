import { springBootClient } from "@/utils/http"
export class CodeCategoryService {
    // 获取代码分类列表
    static getCodeCategoryList(params: Record<string, any>) {
        return springBootClient.get<Api.CodeCategory.CodeCategoryListData>({
            url: "/api/code-category",
            params
        })
    }
    // 获取代码分类菜单
    static getCodeCategoryOptions() {
        return springBootClient.get<Api.CodeCategory.CodeCategoryInfo[]>({
            url: "/api/code-category/menu"
        })
    }
    // 添加代码分类
    static addCodeCategory(data: Api.CodeCategory.CodeCategoryInfo) {
        return springBootClient.post({
            url: "/api/code-category",
            data
        })
    }
    // 编辑代码分类
    static updateCodeCategory(data: Api.CodeCategory.CodeCategoryInfo) {
        return springBootClient.put({
            url: "/api/code-category",
            data
        })
    }
    // 删除代码分类
    static delCodeCategory(params: number) {
        return springBootClient.del({
            url: `/api/code-category/${params}`
        })
    }
}
