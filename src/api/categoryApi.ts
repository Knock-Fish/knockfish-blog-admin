import { springBootClient } from "@/utils/http"
export class CategoryService {
    static getCategoryListData(params: Record<string, any>){
        return springBootClient.get<Api.Category.CategoryListData>({
            url: "/api/category/with-site-count",
            params
        })
    }
    // 获取分类选项
    static getCategoryOptions(){
        return springBootClient.get<Api.Category.CategoryInfo[]>({
            url: "/api/category/options"
        })
    }
    static addCategory(data: Api.Category.CategoryInfo){
        return springBootClient.post({
            url: "/api/category",
            data
        })
    }
    static updateCategory(data: Api.Category.CategoryInfo){
        return springBootClient.put({
            url: "/api/category",
            data
        })
    }
    static delCategory(params: number){
        return springBootClient.del({
            url: `/api/category/${params}`
        })
    }
}