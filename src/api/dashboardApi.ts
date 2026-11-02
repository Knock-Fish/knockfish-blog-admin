import { springBootClient } from "@/utils/http";

export interface DashboardOverview {
    totalVisits: number;
    totalArticles: number;
    totalTags: number;
    totalSites: number;
    totalNotes: number;
    totalCodeSnippets: number;
    draftCount: number;
    articleChange: string;
    tagChange: string;
    siteChange: string;
    visitChange: string;
}

export interface ArticleTrend {
    labels: string[];
    values: number[];
    period: string;
    year: number;
}

export interface ArticleLatest {
    articleId: number;
    title: string;
    cover: string;
    publishTime: string;
}

export interface TagCloudItem {
    tagId: number;
    tagName: string;
    color: string;
    articleCount: number;
}

export interface ActivityItem {
    id: number;
    type: string;
    title: string;
    content: string;
    time: string;
    link: string;
}

export class DashboardService {
    static getOverview() {
        return springBootClient.get<DashboardOverview>({
            url: "/api/admin/dashboard/overview"
        });
    }

    static getArticleTrend(params?: { period?: string; year?: number }) {
        return springBootClient.get<ArticleTrend>({
            url: "/api/admin/dashboard/article-trend",
            params
        });
    }

    static getLatestArticles(params?: { limit?: number }) {
        return springBootClient.get<ArticleLatest[]>({
            url: "/api/admin/dashboard/latest-articles",
            params
        });
    }

    static getTagCloud() {
        return springBootClient.get<TagCloudItem[]>({
            url: "/api/admin/dashboard/tag-cloud"
        });
    }

    static getCategoryStats() {
        return springBootClient.get<TagCloudItem[]>({
            url: "/api/admin/dashboard/category-stats"
        });
    }

    static getActivities(params?: { limit?: number }) {
        return springBootClient.get<ActivityItem[]>({
            url: "/api/admin/dashboard/activities",
            params
        });
    }
}