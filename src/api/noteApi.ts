import request from "@/utils/http"
export class NoteService {
    // 获取笔记列表
    static getNoteList(params: Record<string, any>) {
        return request.get<Api.Note.NoteListData>({
            url: "/api/note",
            params
        })
    }
    // 添加笔记
    static addNote(data: Api.Note.NoteInfo) {
        return request.post({
            url: "/api/note",
            data
        })
    }
    // 编辑笔记
    static updateNote(data: Api.Note.NoteInfo) {
        return request.put({
            url: "/api/note",
            data
        })
    }
    // 删除笔记
    static delNote(params: number) {
        return request.del({
            url: `/api/note/${params}`
        })
    }
    // 获取笔记详情
    static getNoteDetail(params: number) {
        return request.get<Api.Note.NoteInfo>({
            url: `/api/note/${params}`
        })
    }
}
