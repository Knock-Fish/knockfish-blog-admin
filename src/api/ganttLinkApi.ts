import { springBootClient } from "@/utils/http"
export class GanttLinkService {
    // 获取依赖连线列表
    static getLinkList() {
        return springBootClient.get<Api.GanttLink.LinkInfo[]>({
            url: "/api/gantt/link"
        })
    }
    // 新增依赖连线
    static addLink(data: Api.GanttLink.LinkInfo) {
        return springBootClient.post<number>({
            url: "/api/gantt/link",
            data
        })
    }
    // 删除依赖连线
    static delLink(linkId: number) {
        return springBootClient.del<void>({
            url: `/api/gantt/link/${linkId}`
        })
    }
}
