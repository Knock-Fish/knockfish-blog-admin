<template>
    <div class="chat-container">
        <!-- 左侧会话列表 -->
        <transition name="slide">
            <div v-show="showConversations" class="conversations-wrapper">
                <Conversations class="conversations" v-model:active="activeKey1"
                    :items="timeBasedItems" groupable :label-max-width="200"
                    :show-tooltip="false" row-key="id" show-built-in-menu>
                    <template #header>
                        <div class="conversations-header">
                            <ElButton type="primary" size="small">新对话</ElButton>
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

        <!-- 右侧主内容区 -->
        <div class="main-content" :class="{ 'full-width': !showConversations }">
            <!-- 隐藏时的快捷按钮 -->
            <div class="btn-list" v-show="!showConversations">
                <ElButton class="toggle-btn" @click="toggleConversations">
                    <SvgIcon icon="mdi:dock-left"></SvgIcon>
                </ElButton>
                <ElButton class="toggle-btn">
                    <SvgIcon icon="mdi:chat-plus-outline"></SvgIcon>
                </ElButton>
            </div>

            <!-- 对话区域 -->
            <div v-if="currentMessages.length > 0" class="chat-area">
                <div>
                    <div class="bubble-list">
                        <Bubble v-for="v in currentMessages"
                            :content="v.itemType" :placement="v.type"
                            is-markdown />
                        <Bubble content="hello" placement="end" />
                    </div>
                    <!-- 输入框 -->
                    <div class="sender">
                        <XSender ref="xSenderRef" v-model="senderValue.itemType"
                            :loading="isThinking" variant="updown"
                            placeholder="输入您的问题..." clearable
                            :auto-size="{ minRows: 2, maxRows: 5 }"
                            @submit="handelSender" />
                    </div>
                </div>
            </div>

            <!-- 欢迎页面 -->
            <div v-else class="welcome-wrapper">
                <div class="welcome-title">中午好，我是AI小助手</div>
                <div class="welcome-subtitle">有什么我可以帮助您的吗？</div>
                <!-- 输入框 -->
                <XSender ref="xSenderRef" v-model="senderValue.itemType"
                    :loading="isThinking" variant="updown"
                    placeholder="输入您的问题..." clearable
                    :auto-size="{ minRows: 2, maxRows: 5 }"
                    @submit="handelSender" />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { Conversations, XSender, BubbleList, Thinking, Prompts } from 'vue-element-plus-x'
import type { ConversationItem, ConversationMenuCommand } from 'vue-element-plus-x/types/Conversations'
import type { BubbleListItemProps } from 'vue-element-plus-x/types/BubbleList'
// 控制会话列表显示/隐藏
const showConversations = ref(true)
const senderValue = reactive<BubbleListItemProps>({
    id: 1,
    key: 1,
    type: "start",
    itemType: ""
})
const activeKey1 = ref('')
// 消息列表引用
const bubbleListRef = ref()
// XSender引用
const xSenderRef = ref()
// 是否正在思考
const isThinking = ref(false)
// 当前消息列表
const currentMessages = reactive<BubbleListItemProps[]>([])

// 会话列表数据
const timeBasedItems = ref<ConversationItem<{ id: string; label: string }>[]>([
    { id: '1', label: '今天的会话1', group: '今天' },
    { id: '2', label: '今天的会话2', group: '昨天' },
    { id: '3', label: '昨天的会话2' },
    { id: '4', label: '一周前的会话' },
    { id: '5', label: '一个月前的会话' },
    { id: '6', label: '很久以前的会话' }
])
const handelSender = () => {
    currentMessages.push(senderValue)
    senderValue.itemType = ""
}

// 切换会话列表显示/隐藏
const toggleConversations = () => {
    showConversations.value = !showConversations.value
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
        width: 90%;
        height: 100%;
        position: relative;
        /* 关键：建立定位上下文 */
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        scrollbar-width: none;

        .bubble-list {
            flex: 1;
            /* 占满剩余高度，自然滚动 */
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 30px;
        }

        .sender {
            width: 100%;
            position: absolute;
            left: 0;
            bottom: 0;
            z-index: 100;
            /* 比内容高即可，不用 10000 */
            background-color: var(--card-color);
            /* 一定要有背景，否则透明会透出下面 */
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
