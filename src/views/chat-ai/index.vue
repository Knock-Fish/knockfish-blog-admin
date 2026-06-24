<template>
    <div class="chat-container">
        <!-- 左侧会话列表 - 大屏幕显示 -->
        <transition name="slide">
            <div v-show="showConversations && !isSmallScreen" class="conversations-wrapper">
                <Conversations class="conversations" v-model:active="activeKey"
                    :items="timeBasedItems" groupable :label-max-width="200"
                    :show-tooltip="false" row-key="id" show-built-in-menu>
                    <template #header>
                        <div class="conversations-header">
                            <ElButton type="primary" size="small"
                                @click="handleNewConversation">新对话</ElButton>
                            <ElButton class="toggle-btn"
                                :class="{ 'expanded': showConversations }"
                                @click="toggleConversations">
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
                v-model:active="activeKey"
                :items="timeBasedItems" 
                groupable 
                :label-max-width="200"
                :show-tooltip="false" 
                row-key="id" 
                show-built-in-menu>
                <template #header>
                    <div class="drawer-conversations-header">
                        <ElButton type="primary" size="small" @click="handleNewConversation">
                            新对话
                        </ElButton>
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
                        <!-- 渲染消息列表 -->
                        <template v-for="msg in currentMessages" :key="msg.id">
                            <!-- 用户消息 -->
                            <Bubble v-if="msg.role === 'user'" placement="end"
                                :content="msg.content" />

                            <!-- AI思考状态 -->
                            <Thinking
                                v-else-if="msg.role === 'assistant' && msg.isLoading && !msg.content" />

                            <!-- AI回复消息 -->
                            <Bubble
                                v-else-if="msg.role === 'assistant' && !msg.error"
                                placement="start" :content="msg.content"
                                :is-markdown="true" />

                            <!-- 错误消息 -->
                            <Bubble v-if="msg.error" placement="start"
                                :content="`${msg.error}`" />
                        </template>
                    </BubbleList>

                    <div class="sender">
                        <Sender ref="senderRef" v-model="inputContent"
                            :loading="isThinking" variant="updown"
                            placeholder="输入您的问题..." clearable
                            :auto-size="{ minRows: 2, maxRows: 5 }"
                            @submit="handleSend" @abort="handleAbort">
                        </Sender>
                    </div>
                </div>
            </div>

            <!-- 欢迎页面 -->
            <div v-else class="welcome-wrapper">
                <div class="welcome-title">你好，我是AI小助手</div>
                <div class="welcome-subtitle">有什么我可以帮助您的吗？</div>
                <!-- 输入框 -->
                <Sender ref="senderRef" v-model="inputContent"
                    :loading="isThinking" variant="updown"
                    placeholder="输入您的问题..." clearable
                    :auto-size="{ minRows: 2, maxRows: 5 }"
                    @submit="handleSend" />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { Conversations, Sender, BubbleList, Bubble, Thinking, Prompts } from '@/components/chat-ai'
import { createStreamRequest, type StreamError, type SSEEvent } from '@/utils/http/stream'

interface ConversationItem<T = any> {
    id: string
    label: string
    group?: string
    [key: string]: any
}

// 消息类型
interface MessageItem {
    id: string
    content: string
    role: 'user' | 'assistant'
    isLoading?: boolean
    error?: string
}

// 响应式断点
const SMALL_SCREEN_BREAKPOINT = 900

// 使用 VueUse 获取窗口宽度
const { width } = useWindowSize()

// 是否为小屏幕
const isSmallScreen = computed(() => width.value < SMALL_SCREEN_BREAKPOINT)

// 控制会话列表显示/隐藏
const showConversations = ref(true)

// 抽屉显示状态
const drawerVisible = ref(false)

// 输入框内容
const inputContent = ref('')

// 当前活跃会话
const activeKey = ref('')

// 消息列表引用
const bubbleListRef = ref()

// Sender引用
const senderRef = ref()

// 是否正在思考
const isThinking = ref(false)

// 当前消息列表
const currentMessages = ref<MessageItem[]>([])

// 流式请求实例
const streamRequest = createStreamRequest()

const chatApiUrl = `http://127.0.0.1:8000/qa/stream`

// 会话列表数据
const timeBasedItems = ref<ConversationItem<{ id: string; label: string }>[]>([
    { id: '1', label: '今天的会话1', group: '今天' },
    { id: '2', label: '今天的会话2', group: '昨天' },
    { id: '3', label: '昨天的会话2' },
    { id: '4', label: '一周前的会话' },
    { id: '5', label: '一个月前的会话' },
    { id: '6', label: '很久以前的会话' }
])

// 监听窗口宽度变化，自动调整状态
watch(isSmallScreen, (small, oldSmall) => {
    // 从小屏幕切换到大屏幕时，恢复显示会话列表
    if (!small && !showConversations.value) {
        showConversations.value = true
    }
    // 切换到大屏幕时关闭抽屉
    if (!small && drawerVisible.value) {
        drawerVisible.value = false
    }
    // 切换到小屏幕时，关闭侧边栏显示（避免侧边栏和抽屉同时出现）
    if (small && showConversations.value) {
        showConversations.value = false
    }
})

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
        role: 'user'
    }
    currentMessages.value.push(userMessage)

    // 添加助手消息占位
    const assistantIndex = currentMessages.value.length
    currentMessages.value.push({
        id: `assistant-${Date.now()}`,
        content: '',
        role: 'assistant',
        isLoading: true
    })

    // 清空输入框
    inputContent.value = ''

    // 设置思考状态
    isThinking.value = true

    // 滚动到底部
    scrollToBottom()

    // 发送流式请求
    await streamRequest.post(chatApiUrl, {
        data: {
            question: message
        },
        timeout: 120000,
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
            if (assistantMsg) {
                assistantMsg.isLoading = false
            }
            isThinking.value = false
        }
    })
}

/**
 * 中断当前请求
 */
const handleAbort = () => {
    streamRequest.abort()
    isThinking.value = false

    // 标记最后一条助手消息
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

/**
 * 新建对话
 */
const handleNewConversation = () => {
    currentMessages.value = []
    activeKey.value = ''
    inputContent.value = ''
    
    // 小屏幕时关闭抽屉
    if (isSmallScreen.value) {
        drawerVisible.value = false
    }
}

/**
 * 切换会话列表显示/隐藏
 */
const toggleConversations = () => {
    if (isSmallScreen.value) {
        // 小屏幕：打开抽屉
        drawerVisible.value = !drawerVisible.value
    } else {
        // 大屏幕：切换侧边栏显示
        showConversations.value = !showConversations.value
    }
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
            flex: 1;
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

// 抽屉样式
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
    padding: 60px 0 20px 0;
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

.prompts-wrapper {
    width: 100%;
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