import request from "@/utils/http"
export class FileReferenceService {
    static addFileReference(data: Api.FileReference.FileReferenceInfo){
        return request.post<number>({
            url: "/api/file-reference",
            data
        })
    }

    static getAllFileReferences(){
        return request.get<Api.FileReference.FileReferenceInfo[]>({
            url: "/api/file-reference/all"
        })
    }

    static getReferencedPaths(){
        return request.get<string[]>({
            url: "/api/file-reference/referenced-paths"
        })
    }

    static getFileReferenceById(fileId: number){
        return request.get<Api.FileReference.FileReferenceInfo>({
            url: `/api/file-reference/${fileId}`
        })
    }

    static deleteFileReferenceById(fileId: number){
        return request.del<void>({
            url: `/api/file-reference/${fileId}`
        })
    }

    static batchDeleteFileReferences(ids: number[]){
        return request.del<void>({
            url: "/api/file-reference/batch-delete",
            data: ids
        })
    }

    static cleanupOrphanFiles(){
        return request.post<string>({
            url: "/api/file-reference/cleanup"
        })
    }
}