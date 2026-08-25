<template>
    <div class="chat-container">
        <!-- 左侧会话列表 - 大屏幕显示 -->
        <transition name="slide">
            <div v-show="showConversations && !isSmallScreen" class="conversations-wrapper">
                <Conversations
                    class="conversations"
                    v-model="activeKey"
                    :items="timeBasedItems"
                    groupable
                    :label-max-width="200"
                    :show-tooltip="false"
                    row-key="id"
                    show-built-in-menu
                    @select="handleSelectConversation"
                    @edit="handleEditConversation"
                    @delete="handleDeleteConversation">
                    <template #header>
                        <div class="conversations-header">
                            <ElButton type="primary" size="small" @click="handleNewConversation">新对话</ElButton>
                            <ElButton class="toggle-btn" :class="{ 'expanded': showConversations }" @click="toggleConversations">
                                <SvgIcon icon="mdi:dock-left"></SvgIcon>
                            </ElButton>
                        </div>
                    </template>
                </Conversations>
            </div>
        </transition>

        <!-- 左侧会话列表 - 小屏幕抽屉 -->
        <ElDrawer
            v-model="drawerVisible"
            title="会话列表"
            direction="ltr"
            size="280px"
            :with-header="true"
            class="conversations-drawer">
            <Conversations
                v-model="activeKey"
                :items="timeBasedItems"
                groupable
                :label-max-width="200"
                :show-tooltip="false"
                row-key="id"
                show-built-in-menu
                @select="handleSelectConversation"
                @edit="handleEditConversation"
                @delete="handleDeleteConversation">
                <template #header>
                    <div class="drawer-conversations-header">
                        <ElButton type="primary" size="small" @click="handleNewConversation">新对话</ElButton>
                    </div>
                </template>
            </Conversations>
        </ElDrawer>

        <!-- 右侧主内容区 -->
        <div class="main-content" :class="{ 'full-width': !showConversations || isSmallScreen }">
            <!-- 隐藏时的快捷按钮 -->
            <div class="btn-list" v-show="!showConversations">
                <ElButton class="toggle-btn" @click="toggleConversations">
                    <SvgIcon :icon="'mdi:dock-left'"></SvgIcon>
                </ElButton>
                <ElButton class="toggle-btn" @click="handleNewConversation">
                    <SvgIcon icon="mdi:chat-plus-outline"></SvgIcon>
                </ElButton>
            </div>

            <!-- 对话区域 -->
            <div v-if="currentMessages.length > 0" class="chat-area">
                <div>
                    <BubbleList ref="bubbleListRef" class="bubble-list">
                        <template v-for="msg in currentMessages" :key="msg.id">
                            <!-- 用户消息 -->
                            <Bubble v-if="msg.role === 'user'" placement="end" :content="msg.content" />

                            <!-- AI思考状态 -->
                            <Thinking v-else-if="msg.role === 'assistant' && msg.isLoading && !msg.content" />

                            <!-- AI回复消息 -->
                            <Bubble
                                v-else-if="msg.role === 'assistant' && !msg.error"
                                placement="start"
                                :content="msg.content"
                                :is-markdown="true" />

                            <!-- 错误消息 -->
                            <Bubble v-if="msg.error" placement="start" :content="`${msg.error}`" />
                        </template>
                    </BubbleList>

                    <div class="sender">
                        <Sender
                            ref="senderRef"
                            v-model="inputContent"
                            :loading="isThinking"
                            variant="updown"
                            placeholder="输入您的问题..."
                            clearable
                            :auto-size="{ minRows: 2, maxRows: 5 }"
                            @submit="handleSend"
                            @abort="handleAbort" />
                    </div>
                </div>
            </div>

            <!-- 欢迎页面 -->
            <div v-else class="welcome-wrapper">
                <div class="welcome-title">你好，我是AI小助手</div>
                <div class="welcome-subtitle">有什么我可以帮助您的吗？</div>
                <!-- 输入框 -->
                <Sender
                    ref="senderRef"
                    v-model="inputContent"
                    :loading="isThinking"
                    variant="updown"
                    placeholder="输入您的问题..."
                    clearable
                    :auto-size="{ minRows: 2, maxRows: 5 }"
                    @submit="handleSend" />
            </div>
        </div>

        <!-- 编辑会话标题对话框 -->
        <ElDialog v-model="editDialogVisible" title="编辑会话标题" width="420px">
            <ElForm label-width="80px">
                <ElFormItem label="标题">
                    <ElInput
                        v-model="editingTitle"
                        maxlength="50"
                        show-word-limit
                        placeholder="请输入会话标题" />
                </ElFormItem>
            </ElForm>
            <template #footer>
                <ElButton @click="editDialogVisible = false">取消</ElButton>
                <ElButton type="primary" :loading="editSubmitting" @click="submitEditTitle">确认</ElButton>
            </template>
        </ElDialog>
    </div>
</template>

<script setup lang='ts'>
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Conversations, Sender, BubbleList, Bubble, Thinking } from '@/components/chat-ai'
import { createStreamRequest, type StreamError } from '@/utils/http/stream'
import { ChatAiApi, type ChatSession, type ChatMessage as ApiChatMessage } from '@/api/chatAiApi'

interface ConversationItem {
    id: string
    label: string
    group?: string
    session?: ChatSession
}

interface MessageItem {
    id: string
    content: string
    role: 'user' | 'assistant'
    isLoading?: boolean
    error?: string
}

const route = useRoute()
const router = useRouter()

// 响应式断点
const SMALL_SCREEN_BREAKPOINT = 900
const { width } = useWindowSize()
const isSmallScreen = computed(() => width.value < SMALL_SCREEN_BREAKPOINT)

// 控制会话列表显示/隐藏
const showConversations = ref(true)
// 抽屉显示状态
const drawerVisible = ref(false)
// 输入框内容
const inputContent = ref('')
// 当前活跃会话 (session_id)，空代表新会话（单一数据源：所有加载/URL同步都围绕它）
const activeKey = ref('')
// 防止重复加载的标记
const lastLoadedSessionId = ref('')
// 组件引用
const bubbleListRef = ref()
const senderRef = ref()
// 是否正在思考
const isThinking = ref(false)
// 当前消息列表
const currentMessages = ref<MessageItem[]>([])
// 流式请求实例
const streamRequest = createStreamRequest()
// 原始会话列表(后端返回)
const rawSessions = ref<ChatSession[]>([])
// 编辑标题
const editDialogVisible = ref(false)
const editingSessionId = ref('')
const editingTitle = ref('')
const editSubmitting = ref(false)

const chatApiUrl = `${import.meta.env.VITE_AGENT_BASE_URL || 'http://127.0.0.1:8000'}/api/v1/chat`

// ================= 工具函数 =================

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
        const label = s.title?.trim() || `会话 (${s.session_id.slice(0, 8)}...)`
        return {
            id: s.session_id,
            label,
            group: getTimeGroupLabel(s.last_active_at || s.created_at),
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
    async (sid, prevSid) => {
        const nextSid = sid || ''
        const prev = prevSid || ''
        // 同步 URL（params 风格），仅当 URL 与目标不一致时更新，避免循环
        navigateToSessionId(nextSid)

        if (nextSid === lastLoadedSessionId.value && nextSid !== prev) {
            // 会话相同但之前被清空过（极少），也应重新加载
        }
        if (nextSid && nextSid !== lastLoadedSessionId.value) {
            lastLoadedSessionId.value = nextSid
            await loadSessionMessages(nextSid)
        } else if (!nextSid) {
            // 切换到新会话：清空消息
            lastLoadedSessionId.value = ''
            currentMessages.value = []
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

// 监听窗口宽度变化
watch(isSmallScreen, (small) => {
    if (!small && !showConversations.value) showConversations.value = true
    if (!small && drawerVisible.value) drawerVisible.value = false
    if (small && showConversations.value) showConversations.value = false
})

// ================= 会话列表 / 详情加载 =================

async function loadSessionList() {
    try {
        const res = (await ChatAiApi.listSessions({ limit: 200 })) as unknown as ChatSession[]
        rawSessions.value = Array.isArray(res) ? res : []
    } catch (e: any) {
        console.warn('加载会话列表失败:', e?.message || e)
        rawSessions.value = []
    }
}

async function loadSessionMessages(sessionId: string) {
    if (!sessionId) return
    try {
        const list = (await ChatAiApi.getSessionMessages(sessionId, 300)) as unknown as ApiChatMessage[]
        currentMessages.value = (Array.isArray(list) ? list : []).map((m) => ({
            id: m.id,
            content: m.content || '',
            role: m.role === 'user' ? 'user' : 'assistant',
        }))
        scrollToBottom()
    } catch (e: any) {
        console.warn('加载消息历史失败:', e?.message || e)
        currentMessages.value = []
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
    if (isSmallScreen.value) drawerVisible.value = false
}

/** 新建对话：只改 activeKey，watch 包办清空消息 + 更新 URL */
function handleNewConversation() {
    activeKey.value = ''
    inputContent.value = ''
    if (isSmallScreen.value) drawerVisible.value = false
}

function handleEditConversation(item: ConversationItem) {
    const sid = item?.id
    if (!sid) return
    const session = rawSessions.value.find((s) => s.session_id === sid)
    editingSessionId.value = sid
    editingTitle.value = session?.title || item.label || ''
    editDialogVisible.value = true
}

async function submitEditTitle() {
    const sid = editingSessionId.value
    if (!sid) return
    editSubmitting.value = true
    try {
        await ChatAiApi.updateSessionTitle(sid, editingTitle.value.trim())
        const target = rawSessions.value.find((s) => s.session_id === sid)
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
        await ChatAiApi.deleteSession(sid)
        rawSessions.value = rawSessions.value.filter((s) => s.session_id !== sid)
        if (activeKey.value === sid) {
            handleNewConversation()
        }
        ElMessage.success('会话已删除')
    } catch (e: any) {
        ElMessage.error(e?.message || '删除会话失败')
    }
}

// ================= 切换侧边栏 =================

function toggleConversations() {
    if (isSmallScreen.value) {
        drawerVisible.value = !drawerVisible.value
    } else {
        showConversations.value = !showConversations.value
    }
}

// ================= 发送消息 =================

/**
 * 发送消息并处理流式响应
 */
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

    const currentSessionId = activeKey.value

    // 响应头中可能返回新 session_id
    let newSessionId = currentSessionId

    // 发送流式请求
    await streamRequest.post(chatApiUrl, {
        data: {
            message,
            session_id: currentSessionId || undefined,
        },
        timeout: 120000,
        onHeaders: (headers: Headers) => {
            const sid = headers?.get?.('X-Session-Id')
            if (sid) newSessionId = sid
        },
        onContent: (content) => {
            const assistantMsg = currentMessages.value[assistantIndex]
            if (assistantMsg) {
                assistantMsg.content += content
                scrollToBottom()
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

            // 处理新会话创建：只需要更新 activeKey，watch 会包办 URL 同步
            ;(async () => {
                try {
                    if (!currentSessionId && newSessionId) {
                        activeKey.value = newSessionId
                    } else if (currentSessionId && !lastLoadedSessionId.value) {
                        lastLoadedSessionId.value = currentSessionId
                    }
                    // 刷新会话列表（新增了会话或标题被自动更新）
                    await loadSessionList()
                } catch (_) {
                    /* ignore */
                }
            })()
        },
    })
}

/**
 * 中断当前请求
 */
const handleAbort = () => {
    streamRequest.abort()
    isThinking.value = false
    const lastMessage = currentMessages.value[currentMessages.value.length - 1]
    if (lastMessage && lastMessage.isLoading) {
        lastMessage.isLoading = false
        lastMessage.content += '\n\n[已中断]'
    }
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
    setTimeout(() => {
        bubbleListRef.value?.scrollToBottom()
    }, 50)
}
</script>

<style lang="scss" scoped>
.chat-container {
    display: flex;
    width: 100%;
    height: calc(100vh - 100px);
    background-color: var(--card-color);
    box-sizing: border-box;
    overflow: hidden;

    .chat-area {
        width: 80%;
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        scrollbar-width: none;

        >div {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .bubble-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 20px 0 160px 0;
            overflow-y: auto;
            scrollbar-width: none;
        }

        .sender {
            width: 100%;
            position: absolute;
            left: 0;
            bottom: 0;
            z-index: 100;
            background-color: var(--card-color);
            padding: 10px 0;
        }
    }
}

.conversations-wrapper {
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-right: 1px solid var(--border-color);
    flex-shrink: 0;
    overflow: hidden;
}

.conversations-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 10px 0 10px;
}

.drawer-conversations-header {
    padding: 0 0 12px 0;
    border-bottom: 1px solid var(--border-color);

    :deep(.el-button) {
        width: 100%;
    }
}

.conversations-drawer {
    :deep(.el-drawer__header) {
        margin-bottom: 0;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color);
    }

    :deep(.el-drawer__body) {
        padding: 16px 12px;
    }
}

.toggle-btn {
    width: 32px;
    font-size: 20px;
    border: none !important;
    background-color: var(--card-color);
    border-left: none;
    color: var(--icon-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-left: 3px;

    &:hover {
        background-color: var(--hover-bg-color);
        color: var(--text-color);
    }

    &.expanded {
        border-radius: 50%;
    }
}

.main-content {
    width: 100%;
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: width 0.3s ease;
    padding: 0 0 20px 0;
    overflow: hidden;

    .welcome-wrapper {
        width: 80%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 120px;
    }

    &.full-width {
        width: 100%;
    }

    .btn-list {
        display: flex;
        box-sizing: border-box;
        padding: 2px;
        background-color: var(--card-color);
        border: 1px solid var(--border-color);
        border-radius: 100px;
        position: absolute;
        left: 10px;
        top: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, .04);
        z-index: 1000;
    }
}

.welcome-title {
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--text-color);
}

.welcome-subtitle {
    text-align: center;
    font-size: 14px;
    color: #999;
    margin-bottom: 40px;
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    width: 0;
    opacity: 0;
    overflow: hidden;
}

.slide-enter-to,
.slide-leave-from {
    width: 280px;
    opacity: 1;
}
</style>
