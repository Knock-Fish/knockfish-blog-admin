import request from "@/utils/http"
export class ArticleService{
    // 获取文章列表
    static getArticleListData(params: Record<string, any>){
        return request.get<Api.Article.ArticleListData>({
            url: "/api/article/list",
            params
        })
    }
    // 添加文章
    static addArticle(data:Api.Article.ArticleInfo){
        return request.post<number>({
            url:`/api/article`,
            data
        })
    }
    // 更新文章
    static updateArticle(data:Api.Article.ArticleInfo){
        return request.put({
            url:"/api/article",
            data
        })
    }
    // 删除文章
    static delArticle(params:number){
        return request.del({
            url:`/api/article/${params}`
        })
    }
    // 获取指定文章和相关联标签
    static getArticleWithTagById(params: number){
        return request.get<Api.Article.ArticleDetailInfo>({
            url: `/api/article/with-tag/${params}`
        })
    }
    // 获取指定文章
    static getArticleInfoById(params: number){
        return request.get<Api.Article.ArticleDetailInfo>({
            url: `/api/article/${params}`
        })
    }
    // 获取草稿数量
    static getDraftCount(){
        return request.get<number>({
            url: '/api/article/draft-count'
        })
    }
    // 获取10条最近发布/草稿的文章
    static getTop10List(params: {status: 'PUBLISH' | 'DRAFT'}){
        return request.get<Api.Article.ArticleInfo[]>({
            url: '/api/article/top10',
            params
        })
    }
}