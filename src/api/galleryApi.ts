import { springBootClient } from "@/utils/http"

/** 后端图库照片出参 */
export interface GalleryPhotoVO {
    photoId: number
    fileName: string
    title: string
    thumbUrl: string
    previewUrl: string
    originalUrl: string
    width: number
    height: number
    fileSize: number
    mimeType: string
    /** 0 普通 / 1 敏感（前台列表模糊） */
    nsfw: number
    uploaderId: number
    createTime: string
}

/** 图库分页结果 */
export interface GalleryPhotoPage {
    list: GalleryPhotoVO[]
    pageNum: number
    pageSize: number
    total: number
}

/** 图库统计 */
export interface GalleryStats {
    allCount: number
    landscape: number
    portrait: number
    square: number
    totalSize: number
    /** 回收站数量 */
    trashCount: number
    /** 隐藏数量 */
    hiddenCount: number
}

export interface GalleryPhotoPageParams {
    pageNum?: number
    pageSize?: number
    keyword?: string
    /** all / landscape / portrait / square，all 时不传 */
    orientation?: string
    status?: number
}

export interface GalleryBatchUploadResult {
    success: GalleryPhotoVO[]
    failed: { fileName: string; reason: string }[]
}

export class GalleryService {
    /** 分页查询图库 */
    static getPhotoPage(params: GalleryPhotoPageParams) {
        return springBootClient.get<GalleryPhotoPage>({
            url: "/api/admin/gallery",
            params,
        })
    }

    /** 图库统计（各朝向数量 + 原图总大小） */
    static getStats() {
        return springBootClient.get<GalleryStats>({
            url: "/api/admin/gallery/stats",
        })
    }

    /** 上传单张图片 */
    static uploadPhoto(file: File, title?: string) {
        const data = new FormData()
        data.append("file", file)
        if (title) data.append("title", title)
        return springBootClient.post<GalleryPhotoVO>({
            url: "/api/admin/gallery",
            data,
            headers: { "Content-Type": "multipart/form-data" },
        })
    }

    /**
     * 批量上传（一次最多 10 张，后端并发 4）
     * 单张失败不影响其它文件，返回成功列表与失败明细
     */
    static uploadPhotos(files: File[]) {
        const data = new FormData()
        files.forEach((file) => data.append("files", file))
        return springBootClient.post<GalleryBatchUploadResult>({
            url: "/api/admin/gallery/batch",
            data,
            headers: { "Content-Type": "multipart/form-data" },
        })
    }

    /** 修改标题 / 相册 */
    static updatePhoto(data: { photoId: number; title?: string; nsfw?: number }) {
        return springBootClient.put({ url: "/api/admin/gallery", data })
    }

    /** 隐藏 / 取消隐藏（隐藏后前台不展示，后台仍可管理） */
    static setHidden(photoId: number, hidden: boolean) {
        // 后端是 @RequestParam，http 封装会把 put 的 params 并进 body，所以直接拼 query
        return springBootClient.put({ url: `/api/admin/gallery/${photoId}/hidden?hidden=${hidden}` })
    }

    /** 从回收站恢复 */
    static restorePhoto(photoId: number) {
        return springBootClient.put({ url: `/api/admin/gallery/${photoId}/restore` })
    }

    /** 移入回收站（软删，保留对象） */
    static deletePhoto(photoId: number) {
        return springBootClient.del({ url: `/api/admin/gallery/${photoId}` })
    }

    /** 彻底删除（删原图/缩略图/预览图三个对象） */
    static purgePhoto(photoId: number) {
        return springBootClient.del({ url: `/api/admin/gallery/${photoId}/purge` })
    }
}
