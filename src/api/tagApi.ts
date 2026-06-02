import request from "@/utils/http"
export class TagService {
    // 获取标签信息
    static getTagInfo() {
        return request.get<Api.Tag.TagInfo>({
            url: "/api/tag"
        })
    }
    // 获取标签列表
    static getTagList() {
        return request.get<Api.Tag.TagInfo[]>({
            url: "/api/tag/page"
        })
    }
    // 获取标签下的所有文章
    static getTagWithArticles(params:string){
        return request.get<Api.Tag.TagInfo>({
            url: `/api/tag/with-articles/${params}`
        })
    }
    // 分页查询
    static getTagListData(params: Record<string, any>){
        return request.get<Api.Tag.TagListData>({
            url: "/api/tag/page",
            params
        })
    }
    // 添加标签信息
    static addTag(data: Api.Tag.TagInfo) {
        return request.post<number>({
            url: "/api/tag",
            data
        })
    }
    // 更新标签
    static updataTag(data: Api.Tag.TagInfo){
        return request.put({
            url: "/api/tag",
            data
        })
    }
    // 删除标签
    static delTag(params:number){
        return request.del({
            url:`/api/tag/${params}`
        })
    }
}