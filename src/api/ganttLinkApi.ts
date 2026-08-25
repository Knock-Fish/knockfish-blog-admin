import request from "@/utils/http"
export class GanttLinkService {
    // 获取依赖连线列表
    static getLinkList() {
        return request.get<Api.GanttLink.LinkInfo[]>({
            url: "/api/gantt/link"
        })
    }
    // 新增依赖连线
    static addLink(data: Api.GanttLink.LinkInfo) {
        return request.post<number>({
            url: "/api/gantt/link",
            data
        })
    }
    // 删除依赖连线
    static delLink(linkId: number) {
        return request.del<void>({
            url: `/api/gantt/link/${linkId}`
        })
    }
}
