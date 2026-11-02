import { springBootClient } from "@/utils/http"
export class LinkService {
    static getLinkListData(params: Record<string, any>) {
        return springBootClient.get<Api.Common.PaginatingParams<Api.Link.LinkInfo>>({
            url: "/api/admin/link/page",
            params
        })
    }
    static addLink(data: Api.Link.LinkInfo){
        return springBootClient.post({
            url:"/api/admin/link",
            data
        })
    }
    static updateLink(data: Api.Link.LinkInfo){
        return springBootClient.put({
            url:"/api/admin/link",
            data
        })
    }
    static delLink(params: number){
        return springBootClient.del({
            url: `/api/admin/link/${params}`
        })
    }
}