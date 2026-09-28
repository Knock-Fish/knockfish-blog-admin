import { springBootClient } from "@/utils/http"
export class R2FileService {
    // 上传文件
    static uploadR2File(data: { file: File, type: string, userId: number, referenceId?: number }) {
        return springBootClient.post<any>({
            url: `/api/r2-file`,
            data,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
    }
    // 获取所有文件列表
    static getR2FileList() {
        return springBootClient.get<Api.R2File.R2FileInfo[]>({
            url: "/api/r2-file"
        })
    }
    // 根据前缀获取文件列表
    static getR2FilePrefixList(params: { prefix: string }) {
        return springBootClient.get<Api.R2File.R2FileInfo[]>({
            url: `/api/r2-file/prefix`,
            params
        })
    }
    // 获取指定文件信息
    static getFileInfo(params: { key: string }) {
        return springBootClient.get<Api.R2File.R2FileInfo>({
            url: "/api/r2-file/info",
            params
        })
    }
    // 删除R2文件信息
    static delR2File(params: string) {
        return springBootClient.del({
            url: `/api/r2-file?key=${params}`
        })
    }
    // 批量删除图片
    static batchDelR2File(params: string[]) {
        return springBootClient.del({
            url: "/api/r2-file/batch-delete",
            params
        })
    }
}