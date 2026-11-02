import { springBootClient } from "@/utils/http"
export class NoteService {
    // 获取笔记列表
    static getNoteList(params: Record<string, any>) {
        return springBootClient.get<Api.Note.NoteListData>({
            url: "/api/admin/note",
            params
        })
    }
    // 添加笔记
    static addNote(data: Api.Note.NoteData) {
        return springBootClient.post<number>({
            url: "/api/admin/note",
            data
        })
    }
    // 编辑笔记
    static updateNote(data: Api.Note.NoteData) {
        return springBootClient.put({
            url: "/api/admin/note",
            data
        })
    }
    // 删除笔记
    static delNote(params: number) {
        return springBootClient.del({
            url: `/api/admin/note/${params}`
        })
    }
    // 获取笔记详情
    static getNoteDetail(params: number) {
        return springBootClient.get<Api.Note.NoteInfo>({
            url: `/api/admin/note/${params}`
        })
    }
    // 解绑笔记未使用的图片（编辑后离开页面时调用）
    static unbindUnusedFiles(noteId: number) {
        return springBootClient.post({
            url: `/api/admin/note/unbindUnused/${noteId}`
        })
    }
    // 切换笔记显示/隐藏（只改状态，不覆盖正文）
    static updateNoteStatus(data: { noteId: number; status: Api.Note.NoteStatus }) {
        return springBootClient.put({
            url: "/api/admin/note/status",
            data
        })
    }
}
