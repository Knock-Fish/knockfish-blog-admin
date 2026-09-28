import { fastApiClient } from '@/utils/http'

export class ChatAiApi {
    /** 会话列表（分页，后端按更新时间倒序返回） */
    static listThreads(params?: { limit?: number; offset?: number }) {
        return fastApiClient.get<Api.Agent.Thread[]>({
            url: '/api/v1/memory/threads',
            params,
        })
    }

    /** 创建会话（写入首条消息），返回新建会话 */
    static createThread(data: { title?: string; first_message: string }) {
        return fastApiClient.post<Api.Agent.Thread>({
            url: '/api/v1/memory/threads',
            data,
        })
    }

    /** 某会话的消息列表（按时间正序） */
    static getThreadMessages(threadId: string) {
        return fastApiClient.get<Api.Agent.Message[]>({
            url: `/api/v1/memory/threads/${threadId}/messages`,
        })
    }

    /** 更新会话标题（PATCH 部分更新），返回刷新后的会话（含新 title / updatedAt） */
    static updateThreadTitle(threadId: string, title: string) {
        return fastApiClient.patch<Api.Agent.Thread>({
            url: `/api/v1/memory/threads/${threadId}`,
            data: { title },
        })
    }

    /** 删除会话（后端由外键 ON DELETE CASCADE 级联清理其消息） */
    static delThread(threadId: string) {
        return fastApiClient.del<{ threadId: string; deleted: boolean }>({
            url: `/api/v1/memory/threads/${threadId}`,
        })
    }

    /** 非流式对话：发送一条消息，直接拿到完整回复（LLM 可能较慢，单独放宽超时） */
    static chatOnce(data: { message: string; thread_id?: string }) {
        return fastApiClient.post<Api.Agent.ChatReply>({
            url: '/api/v1/chat/',
            data,
            timeout: 120000,
        })
    }

    /** 流式对话地址（相对 Agent 基础地址的裸路径；前缀由 stream.ts 按 services.fastApi.baseURL 拼接，避免重复） */
    static get streamUrl() {
        return '/api/v1/chat/stream'
    }
}

export default ChatAiApi
