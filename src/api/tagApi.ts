import { springBootClient } from "@/utils/http"
export class TagService {
    // 获取标签信息
    static getTagInfo() {
        return springBootClient.get<Api.Tag.TagInfo>({
            url: "/api/tag"
        })
    }
    // 获取标签列表
    static getTagList() {
        return springBootClient.get<Api.Tag.TagInfo[]>({
            url: "/api/tag/page"
        })
    }
    // 获取标签下的所有文章
    static getTagWithArticles(params:string){
        return springBootClient.get<Api.Tag.TagInfo>({
            url: `/api/tag/with-articles/${params}`
        })
    }
    // 分页查询
    static getTagListData(params: Record<string, any>){
        return springBootClient.get<Api.Tag.TagListData>({
            url: "/api/tag/page",
            params
        })
    }
    // 添加标签信息
    static addTag(data: Api.Tag.TagInfo) {
        return springBootClient.post<number>({
            url: "/api/tag",
            data
        })
    }
    // 更新标签
    static updateTag(data: Api.Tag.TagInfo){
        return springBootClient.put({
            url: "/api/tag",
            data
        })
    }
    // 删除标签
    static delTag(params:number){
        return springBootClient.del({
            url:`/api/tag/${params}`
        })
    }
}