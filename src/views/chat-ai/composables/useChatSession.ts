import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ChatAiApi } from '@/api/chatAiApi'
import type { ConversationItem } from '../types'
import type { ThreadResolveHandler } from './useChatMessages'

/** 本 composable 需要的布局上下文 */
export interface LayoutContext {
    isSmallScreen: { value: boolean }
    drawerVisible: { value: boolean }
}

/** 本 composable 需要的消息层控制器 */
export interface ChatController {
    loadSessionMessages: (sid: string) => Promise<void>
    clearMessages: () => void
    resetInput: () => void
    bindThreadResolver: (fn: ThreadResolveHandler) => void
}

/**
 * 会话领域：会话列表、路由 <-> activeKey 双向同步、会话选择/新建/编辑/删除。
 * 单一数据源为 activeKey（空字符串代表新会话），所有加载/URL 同步围绕它展开。
 */
export function useChatSession(layout: LayoutContext, chat: ChatController) {
    const route = useRoute()
    const router = useRouter()

    // 当前活跃会话 (threadId)，空代表新会话（单一数据源）
    const activeKey = ref('')
    // 防止重复加载的标记
    const lastLoadedSessionId = ref('')
    // 原始会话列表(后端返回)
    const rawSessions = ref<Api.Agent.Thread[]>([])

    // 编辑标题
    const editDialogVisible = ref(false)
    const editingSessionId = ref('')
    const editingTitle = ref('')
    const editSubmitting = ref(false)

    // ================= 路由 <-> activeKey 工具 =================

    /** 从路由中读取 sessionId（params 优先，兼容 query 兜底） */
    function getRouteSessionId(): string {
        return (
            (route.params?.sessionId as string) ||
            (route.params?.session_id as string) ||
            (route.query?.sessionId as string) ||
            (route.query?.session_id as string) ||
            ''
        )
    }

    /** 使用 params 风格跳转到 /chat-ai/:sessionId? （避免循环：仅在与当前不同时才 replace） */
    function navigateToSessionId(sid: string) {
        const currentRouteSid = getRouteSessionId()
        if ((currentRouteSid || '') === (sid || '')) return
        // 保留当前路径其他 query
        const { sessionId, session_id, ...restQuery } = route.query || {}
        if (sid) {
            router.replace({
                name: 'ChatAi',
                params: { sessionId: sid },
                query: restQuery,
            })
        } else {
            router.replace({
                name: 'ChatAi',
                params: {},
                query: restQuery,
            })
        }
    }

    /** 按时间对会话进行分组（今天/昨天/7天内/30天内/更早） */
    function getTimeGroupLabel(dateStr: string): string {
        try {
            let ts: number
            if (/^\d+$/.test(dateStr)) {
                ts = parseInt(dateStr) * 1000
            } else {
                ts = new Date(dateStr).getTime()
            }
            if (!ts || isNaN(ts)) return '更早'
            const now = new Date()
            const d = new Date(ts)
            const ymd = (t: Date) => `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`
            if (ymd(now) === ymd(d)) return '今天'
            const yesterday = new Date(now.getTime() - 86400000)
            if (ymd(yesterday) === ymd(d)) return '昨天'
            const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
            if (diffDays <= 7) return '7天内'
            if (diffDays <= 30) return '30天内'
            return '更早'
        } catch (_) {
            return '更早'
        }
    }

    // 分组后的会话项
    const timeBasedItems = computed<ConversationItem[]>(() => {
        return rawSessions.value.map((s) => {
            const label = s.title?.trim() || `会话 (${s.threadId.slice(0, 8)}...)`
            return {
                id: s.threadId,
                label,
                group: getTimeGroupLabel(s.updatedAt || s.createdAt),
                session: s,
            }
        })
    })

    // ================= 核心：路由 <-> activeKey 双向同步 + 消息加载 =================

    /**
     * 单一数据流：任何"会话切换"行为都只改 activeKey，
     * watch(activeKey) 负责：1) 同步 URL  2) 加载消息 / 清空消息
     */
    watch(
        activeKey,
        async (sid) => {
            const nextSid = sid || ''
            // 同步 URL（params 风格），仅当 URL 与目标不一致时更新，避免循环
            navigateToSessionId(nextSid)

            if (nextSid && nextSid !== lastLoadedSessionId.value) {
                lastLoadedSessionId.value = nextSid
                await chat.loadSessionMessages(nextSid)
            } else if (!nextSid) {
                // 切换到新会话：清空消息
                lastLoadedSessionId.value = ''
                chat.clearMessages()
            }
        },
        { flush: 'pre' }
    )

    /**
     * URL 变化 -> 同步 activeKey（浏览器前进/后退、外部链接进入、用户直接改地址栏）
     * 只有当 route 中的 sessionId 与当前 activeKey 不一致时才更新，避免与上面的 watch 循环
     */
    watch(
        () => [route.params?.sessionId, route.params?.session_id, route.query?.sessionId, route.query?.session_id] as const,
        () => {
            const routeSid = getRouteSessionId()
            if (routeSid !== activeKey.value) {
                activeKey.value = routeSid
            }
        }
    )

    // ================= 初始化 =================

    onMounted(async () => {
        await loadSessionList()
        // 从 URL 读取初始会话（watch(activeKey) 会接管后续加载 + URL 规范化）
        const routeSid = getRouteSessionId()
        if (routeSid) {
            activeKey.value = routeSid
            // 把 query 风格的 URL 在第一次进入时就规范化成 params 风格
            if (route.query?.sessionId || route.query?.session_id) {
                navigateToSessionId(routeSid)
            }
        }
    })

    // ================= 会话列表加载 =================

    async function loadSessionList() {
        try {
            const res = await ChatAiApi.listThreads({ limit: 200 })
            rawSessions.value = Array.isArray(res) ? res : []
        } catch (e: any) {
            console.warn('加载会话列表失败:', e?.message || e)
            rawSessions.value = []
        }
    }

    // ================= 会话选择 / 新建 / 编辑 / 删除 =================

    /**
     * 点击会话项：v-model 已同步 activeKey，watch 会负责加载 + 改 URL
     * 这里只做副作用：关闭抽屉 / 忽略空 id
     */
    function handleSelectConversation(item: ConversationItem) {
        const sid = item?.id
        if (!sid) return
        if (layout.isSmallScreen.value) layout.drawerVisible.value = false
    }

    /** 新建对话：只改 activeKey + 清空输入，watch 包办清空消息 + 更新 URL */
    function handleNewConversation() {
        activeKey.value = ''
        chat.resetInput()
        if (layout.isSmallScreen.value) layout.drawerVisible.value = false
    }

    function handleEditConversation(item: ConversationItem) {
        const sid = item?.id
        if (!sid) return
        const session = rawSessions.value.find((s) => s.threadId === sid)
        editingSessionId.value = sid
        editingTitle.value = session?.title || item.label || ''
        editDialogVisible.value = true
    }

    async function submitEditTitle() {
        const sid = editingSessionId.value
        if (!sid) return
        editSubmitting.value = true
        try {
            await ChatAiApi.updateThreadTitle(sid, editingTitle.value.trim())
            const target = rawSessions.value.find((s) => s.threadId === sid)
            if (target) target.title = editingTitle.value.trim()
            ElMessage.success('已更新会话标题')
            editDialogVisible.value = false
        } catch (e: any) {
            ElMessage.error(e?.message || '更新标题失败')
        } finally {
            editSubmitting.value = false
        }
    }

    async function handleDeleteConversation(item: ConversationItem) {
        const sid = item?.id
        if (!sid) return
        try {
            await ElMessageBox.confirm(`确定删除会话"${item.label}"？删除后无法恢复。`, '删除会话', {
                type: 'warning',
                confirmButtonText: '删除',
                cancelButtonText: '取消',
            })
        } catch (_) {
            return
        }
        try {
            await ChatAiApi.delThread(sid)
            rawSessions.value = rawSessions.value.filter((s) => s.threadId !== sid)
            if (activeKey.value === sid) {
                handleNewConversation()
            }
            ElMessage.success('会话已删除')
        } catch (e: any) {
            ElMessage.error(e?.message || '删除会话失败')
        }
    }

    // ================= 发送完成后：回写新会话 id + 刷新列表 =================

    chat.bindThreadResolver((newThreadId, wasNewThread) => {
        if (wasNewThread && newThreadId) {
            // 新会话：更新 activeKey，watch 会自动同步 URL + 加载消息
            activeKey.value = newThreadId
        } else if (!wasNewThread && !lastLoadedSessionId.value) {
            // 已有会话首条消息：补齐加载标记
            lastLoadedSessionId.value = activeKey.value
        }
        // 刷新会话列表（新增了会话或标题被自动更新）
        loadSessionList().catch(() => {
            /* ignore */
        })
    })

    return {
        activeKey,
        rawSessions,
        timeBasedItems,
        editDialogVisible,
        editingTitle,
        editSubmitting,
        handleSelectConversation,
        handleNewConversation,
        handleEditConversation,
        submitEditTitle,
        handleDeleteConversation,
    }
}
