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
    static addNote(data: Api.Note.NoteData) {
        return request.post<number>({
            url: "/api/note",
            data
        })
    }
    // 编辑笔记
    static updateNote(data: Api.Note.NoteData) {
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
    // 解绑笔记未使用的图片（编辑后离开页面时调用）
    static unbindUnusedFiles(noteId: number) {
        return request.post({
            url: `/api/note/unbindUnused/${noteId}`
        })
    }
}
