import { springBootClient } from "@/utils/http"
export class SiteService {
    // 获取站点信息
    static getSiteListData(params: Record<string, any>) {
        return springBootClient.get<Api.Site.SiteListData>({
            url: "/api/admin/site/with-category",
            params
        })
    }
    // 添加站点
    static addSite(data:Api.Site.SiteInfo){
        return springBootClient.post({
            url:"/api/admin/site",
            data
        })
    }
    // 编辑站点
    static updateSite(data: Api.Site.SiteInfo){
        return springBootClient.put({
            url: "/api/admin/site",
            data
        })
    }
    // 删除站点
    static delSite(params: number){
        return springBootClient.del({
            url: `/api/admin/site/${params}`
        })
    }
}