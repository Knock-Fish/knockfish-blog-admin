/** 会话列表项（由后端 Thread 映射而来，附带分组信息） */
export interface ConversationItem {
    id: string
    label: string
    group?: string
    session?: Api.Agent.Thread
}

/** 单条聊天消息（组件内部视图模型，与后端 Message 解耦） */
export interface MessageItem {
    id: string
    content: string
    role: 'user' | 'assistant'
    isLoading?: boolean
    error?: string
}
