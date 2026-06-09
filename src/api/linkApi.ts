import request from "@/utils/http"
export class LinkService {
    static getLinkListData(params: Record<string, any>) {
        return request.get<Api.Common.PaginatingParams<Api.Link.LinkInfo>>({
            url: "/api/link/page",
            params
        })
    }
    static addLink(data: Api.Link.LinkInfo){
        return request.post({
            url:"/api/link",
            data
        })
    }
    static updateLink(data: Api.Link.LinkInfo){
        return request.put({
            url:"/api/link",
            data
        })
    }
    static delLink(params: number){
        return request.del({
            url: `/api/link/${params}`
        })
    }
}