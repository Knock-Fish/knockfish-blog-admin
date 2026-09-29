<template>
    <div class="chat-container">
        <!-- 左侧会话列表 - 大屏幕显示 -->
        <transition name="slide">
            <div v-show="showConversations && !isSmallScreen" class="conversations-wrapper">
                <ChatSessionList
                    class="conversations"
                    v-model="activeKey"
                    :items="timeBasedItems"
                    header-class="conversations-header"
                    :show-toggle="true"
                    :expanded="showConversations"
                    @select="handleSelectConversation"
                    @edit="handleEditConversation"
                    @delete="handleDeleteConversation"
                    @new="handleNewConversation"
                    @toggle="toggleConversations" />
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
            <ChatSessionList
                v-model="activeKey"
                :items="timeBasedItems"
                header-class="drawer-conversations-header"
                @select="handleSelectConversation"
                @edit="handleEditConversation"
                @delete="handleDeleteConversation"
                @new="handleNewConversation" />
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
                                :is-markdown="true"
                                :is-streaming="!!msg.isLoading" />

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
import { BubbleList, Bubble, Thinking, Sender } from '@/components/chat-ai'
import { preloadMermaid } from '@/components/chat-ai/composables/useMermaid'
import { useChatLayout } from './composables/useChatLayout'
import { useChatSession } from './composables/useChatSession'
import { useChatMessages } from './composables/useChatMessages'
import ChatSessionList from './widget/ChatSessionList.vue'

// 布局 / 响应式
const { isSmallScreen, showConversations, drawerVisible, toggleConversations } = useChatLayout()

// 消息与流式发送（先创建，供会话层注入回调）
const chat = useChatMessages()

// 会话领域：列表 / 路由同步 / 增删改（注入布局与消息控制器）
const {
    activeKey,
    timeBasedItems,
    editDialogVisible,
    editingTitle,
    editSubmitting,
    handleSelectConversation,
    handleNewConversation,
    handleEditConversation,
    submitEditTitle,
    handleDeleteConversation,
} = useChatSession({ isSmallScreen, drawerVisible }, chat)

// 把会话上下文（activeKey）注入消息层，供发送时读取
chat.bindSession({ activeKey })

// 从消息层解构模板所需状态与方法
const { currentMessages, inputContent, isThinking, bubbleListRef, senderRef, handleSend, handleAbort } = chat

// 页面挂载后空闲预加载 mermaid 主包（1MB+），使首条图表无需等待 chunk 加载
onMounted(() => {
    const idle = (window as any).requestIdleCallback as
        | ((cb: () => void) => void)
        | undefined
    if (idle) idle(() => preloadMermaid())
    else preloadMermaid()
})
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
