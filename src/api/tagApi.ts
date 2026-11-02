import { springBootClient } from "@/utils/http"
export class TagService {
    // 获取标签信息
    static getTagInfo() {
        return springBootClient.get<Api.Tag.TagInfo>({
            url: "/api/front/tag"
        })
    }
    // 获取标签列表
    static getTagList() {
        return springBootClient.get<Api.Tag.TagInfo[]>({
            url: "/api/admin/tag/page"
        })
    }
    // 获取标签下的所有文章
    static getTagWithArticles(params:string){
        return springBootClient.get<Api.Tag.TagInfo>({
            url: `/api/front/tag/${params}/articles`
        })
    }
    // 分页查询
    static getTagListData(params: Record<string, any>){
        return springBootClient.get<Api.Tag.TagListData>({
            url: "/api/admin/tag/page",
            params
        })
    }
    // 添加标签信息
    static addTag(data: Api.Tag.TagInfo) {
        return springBootClient.post<number>({
            url: "/api/admin/tag",
            data
        })
    }
    // 更新标签
    static updateTag(data: Api.Tag.TagInfo){
        return springBootClient.put({
            url: "/api/admin/tag",
            data
        })
    }
    // 删除标签
    static delTag(params:number){
        return springBootClient.del({
            url:`/api/admin/tag/${params}`
        })
    }
}