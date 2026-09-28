import { springBootClient } from "@/utils/http"
export class FileReferenceService {
    static addFileReference(data: Api.FileReference.FileReferenceInfo){
        return springBootClient.post<number>({
            url: "/api/file-reference",
            data
        })
    }

    static getAllFileReferences(){
        return springBootClient.get<Api.FileReference.FileReferenceInfo[]>({
            url: "/api/file-reference/all"
        })
    }

    static getReferencedPaths(){
        return springBootClient.get<string[]>({
            url: "/api/file-reference/referenced-paths"
        })
    }

    static getFileReferenceById(fileId: number){
        return springBootClient.get<Api.FileReference.FileReferenceInfo>({
            url: `/api/file-reference/${fileId}`
        })
    }

    static deleteFileReferenceById(fileId: number){
        return springBootClient.del<void>({
            url: `/api/file-reference/${fileId}`
        })
    }

    static batchDeleteFileReferences(ids: number[]){
        return springBootClient.del<void>({
            url: "/api/file-reference/batch-delete",
            data: ids
        })
    }

    static cleanupOrphanFiles(){
        return springBootClient.post<string>({
            url: "/api/file-reference/cleanup"
        })
    }
}