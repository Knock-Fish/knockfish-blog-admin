import request from "@/utils/http"
export class SiteService {
    // 获取站点信息
    static getSiteListData(params: Record<string, any>) {
        return request.get<Api.Site.SiteListData>({
            url: "/api/site/with-category",
            params
        })
    }
    // 添加站点
    static addSite(data:Api.Site.SiteInfo){
        return request.post({
            url:"/api/site",
            data
        })
    }
    // 编辑站点
    static updateSite(data: Api.Site.SiteInfo){
        return request.put({
            url: "/api/site",
            data
        })
    }
    // 删除站点
    static delSite(params: number){
        return request.del({
            url: `/api/site/${params}`
        })
    }
}