import { springBootClient } from "@/utils/http"
export class CodeSnippetService {
    // 获取代码片段列表
    static getCodeSnippetList(params: Record<string, any>) {
        const { categoryId, ...otherParams } = params
        const id = categoryId === null || categoryId === undefined ? 0 : categoryId
        return springBootClient.get<Api.CodeSnippet.CodeSnippetListData>({
            url: `/api/code-snippet/list/${id}`,
            params: otherParams
        })
    }
    // 添加代码片段
    static addCodeSnippet(data: Api.CodeSnippet.CodeSnippetInfo) {
        return springBootClient.post({
            url: "/api/code-snippet",
            data
        })
    }
    // 编辑代码片段
    static updateCodeSnippet(data: Api.CodeSnippet.CodeSnippetInfo) {
        return springBootClient.put({
            url: "/api/code-snippet",
            data
        })
    }
    // 删除代码片段
    static delCodeSnippet(params: number) {
        return springBootClient.del({
            url: `/api/code-snippet/${params}`
        })
    }
    // 获取代码片段详情
    static getCodeSnippetDetail(params: number) {
        return springBootClient.get<Api.CodeSnippet.CodeSnippetInfo>({
            url: `/api/code-snippet/${params}`
        })
    }
}
