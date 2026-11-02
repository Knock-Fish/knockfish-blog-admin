import { springBootClient } from "@/utils/http"
export class ArticleService{
    // 获取文章列表
    static getArticleListData(params: Record<string, any>){
        return springBootClient.get<Api.Article.ArticleListData>({
            url: "/api/admin/article/list",
            params
        })
    }
    // 添加文章
    static addArticle(data:Api.Article.ArticleInfo){
        return springBootClient.post<number>({
            url:'/api/admin/article',
            data
        })
    }
    // 更新文章
    static updateArticle(data:Api.Article.ArticleInfo){
        return springBootClient.put({
            url:"/api/admin/article",
            data
        })
    }
    // 删除文章
    static delArticle(params:number){
        return springBootClient.del({
            url:`/api/admin/article/${params}`
        })
    }
    // 解绑文章未使用的图片（发布/编辑后离开页面时调用）
    static unbindUnusedFiles(articleId:number){
        return springBootClient.post({
            url:`/api/admin/article/unbindUnused/${articleId}`
        })
    }
    // 获取指定文章和相关联标签
    static getArticleWithTagById(params: number){
        return springBootClient.get<Api.Article.ArticleDetailInfo>({
            url: `/api/admin/article/with-tag/${params}`
        })
    }
    // 获取指定文章
    static getArticleInfoById(params: number){
        return springBootClient.get<Api.Article.ArticleDetailInfo>({
            url: `/api/front/article/${params}`
        })
    }
    // 获取草稿数量
    static getDraftCount(){
        return springBootClient.get<number>({
            url: '/api/admin/article/draft-count'
        })
    }
    // 获取10条草稿的文章
    static getDraftList(){
        return springBootClient.get<Api.Article.ArticleInfo[]>({
            url: '/api/admin/article/draft'
        })
    }
}