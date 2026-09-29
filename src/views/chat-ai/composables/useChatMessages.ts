import { ref } from 'vue'
import { createStreamRequest, type StreamError } from '@/utils/http/stream'
import { ChatAiApi } from '@/api/chatAiApi'
import type { MessageItem } from '../types'

/** 会话层在发送时需要向本 composable 注册「新会话 id 解析」回调 */
export type ThreadResolveHandler = (newThreadId: string, wasNewThread: boolean) => void

/** 本 composable 在发送时需要的会话上下文（仅读取 activeKey） */
export interface SessionContext {
    activeKey: { value: string }
}

/**
 * 聊天消息与流式发送：
 * - 维护 currentMessages / inputContent / isThinking 等视图状态
 * - 封装流式请求（createStreamRequest）的发送、中断、增量渲染
 * - 通过 bindSession 读取当前会话 id；通过 bindThreadResolver 把「新建会话」结果回传给会话层
 */
export function useChatMessages() {
    const chatApiUrl = ChatAiApi.streamUrl
    const streamRequest = createStreamRequest()

    const inputContent = ref('')
    const isThinking = ref(false)
    const currentMessages = ref<MessageItem[]>([])

    const bubbleListRef = ref()
    const senderRef = ref()

    let sessionCtx: SessionContext | null = null
    let threadResolver: ThreadResolveHandler | null = null

    /** 注入会话上下文（读取 activeKey） */
    function bindSession(ctx: SessionContext) {
        sessionCtx = ctx
    }

    /** 注入「新会话 id 解析」回调（由会话层提供） */
    function bindThreadResolver(fn: ThreadResolveHandler) {
        threadResolver = fn
    }

    /** 滚动到底部（等待 DOM 更新）：发消息 / 加载历史等「用户主动」场景，无条件到底 */
    function scrollToBottom() {
        setTimeout(() => {
            bubbleListRef.value?.scrollToBottom()
        }, 50)
    }

    /**
     * 流式输出期间的滚动跟随（等待 DOM 更新）。
     * 只在用户本来就贴在底部时才跟随；若用户已上翻查看历史，则不打扰，
     * 避免「流式输出时滚不动」——原先每次收到增量都无条件 scrollToBottom
     * 会把用户的上翻瞬间拽回底部。
     */
    function followBottom() {
        setTimeout(() => {
            bubbleListRef.value?.followBottom()
        }, 50)
    }

    /** 加载某会话的历史消息 */
    async function loadSessionMessages(sessionId: string) {
        if (!sessionId) return
        try {
            const list = await ChatAiApi.getThreadMessages(sessionId)
            currentMessages.value = (Array.isArray(list) ? list : []).map((m) => ({
                id: String(m.messageId),
                content: m.content || '',
                role: m.role === 'user' ? 'user' : 'assistant',
            }))
            scrollToBottom()
        } catch (e: any) {
            console.warn('加载消息历史失败:', e?.message || e)
            currentMessages.value = []
        }
    }

    /** 清空消息列表 */
    function clearMessages() {
        currentMessages.value = []
    }

    /** 清空输入框 */
    function resetInput() {
        inputContent.value = ''
    }

    /** 发送消息并处理流式响应 */
    const handleSend = async () => {
        const message = inputContent.value.trim()
        if (!message || isThinking.value) return

        // 添加用户消息
        const userMessage: MessageItem = {
            id: `user-${Date.now()}`,
            content: message,
            role: 'user',
        }
        currentMessages.value.push(userMessage)

        // 添加助手消息占位
        const assistantIndex = currentMessages.value.length
        currentMessages.value.push({
            id: `assistant-${Date.now()}`,
            content: '',
            role: 'assistant',
            isLoading: true,
        })

        // 清空输入框
        inputContent.value = ''
        isThinking.value = true
        scrollToBottom()

        const currentThreadId = sessionCtx?.activeKey.value ?? ''

        // 新会话的 threadId 由 done 事件回传（后端不设 X-Session-Id 头）
        let newThreadId = currentThreadId

        // 发送流式请求（请求体字段为 snake，匹配 Agent ChatRequest）
        await streamRequest.post(chatApiUrl, {
            data: {
                message,
                thread_id: currentThreadId || undefined,
            },
            timeout: 120000,
            onDone: (event) => {
                if (event.threadId) newThreadId = event.threadId
            },
            onContent: (content) => {
                const assistantMsg = currentMessages.value[assistantIndex]
                if (assistantMsg) {
                    assistantMsg.content += content
                    followBottom() // 粘性跟随：用户上翻时不强行拽回底部
                }
            },
            onError: (error: StreamError) => {
                const assistantMsg = currentMessages.value[assistantIndex]
                if (assistantMsg) {
                    assistantMsg.error = error.message
                    assistantMsg.isLoading = false
                }
                isThinking.value = false
            },
            onFinally: () => {
                const assistantMsg = currentMessages.value[assistantIndex]
                if (assistantMsg) assistantMsg.isLoading = false
                isThinking.value = false

                // 处理新会话创建 / 刷新会话列表，交给会话层统一处理
                threadResolver?.(newThreadId, !currentThreadId)
            },
        })
    }

    /** 中断当前请求 */
    const handleAbort = () => {
        streamRequest.abort()
        isThinking.value = false
        const lastMessage = currentMessages.value[currentMessages.value.length - 1]
        if (lastMessage && lastMessage.isLoading) {
            lastMessage.isLoading = false
            lastMessage.content += '\n\n[已中断]'
        }
    }

    return {
        inputContent,
        isThinking,
        currentMessages,
        bubbleListRef,
        senderRef,
        chatApiUrl,
        loadSessionMessages,
        clearMessages,
        resetInput,
        scrollToBottom,
        handleSend,
        handleAbort,
        bindSession,
        bindThreadResolver,
    }
}
