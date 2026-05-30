import request from "@/utils/http"
export class R2FileService {
    // 上传文件
    static uploadR2File(data: File) {
        return request.post<any>({
            url: `/api/r2-file`,
            data
        })
    }
    // 获取所有文件列表
    static getR2FileList() {
        return request.get<Api.R2File.R2FileInfo[]>({
            url: "/api/r2-file"
        })
    }
    // 根据前缀获取文件列表
    static getR2FilePrefixList(params: { prefix: string }) {
        return request.get<Api.R2File.R2FileInfo[]>({
            url: `/api/r2-file/prefix`,
            params
        })
    }
    // 获取指定文件信息
    static getFileInfo(params: { key: string }) {
        return request.get<Api.R2File.R2FileInfo>({
            url: "/api/r2-file/info",
            params
        })
    }
    // 删除R2文件信息
    static delR2File(params: { key: string }) {
        return request.del({
            url: '/api/r2-file',
            params
        })
    }
    // 批量删除图片
    static batchDelR2File(params: string[]) {
        return request.del({
            url: "/api/r2-file/batch-delete",
            params
        })
    }
}