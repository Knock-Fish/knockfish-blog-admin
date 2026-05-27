<template>
    <div class="todo-section">
        <div class="section-header">
            <h3 class="section-title">
                <SvgIcon icon="mdi:checkbox-marked-outline" />
                待办事项
            </h3>
            <span class="todo-count">{{ completedCount }}/{{ totalCount }}</span>
        </div>

        <div class="todo-input-wrapper">
            <el-input
                v-model="newTodo"
                placeholder="添加新待办..."
                size="default"
                @keyup.enter="handleAddTodo"
            >
                <template #append>
                    <el-button :icon="Plus" @click="handleAddTodo" />
                </template>
            </el-input>
        </div>

        <div class="todo-list">
            <div
                class="todo-item"
                v-for="todo in todoList"
                :key="todo.id"
                :class="{ 'is-completed': todo.completed }"
            >
                <el-checkbox
                    v-model="todo.completed"
                    @change="handleToggle(todo)"
                />
                <span class="todo-text">{{ todo.text }}</span>
                <span class="todo-time">{{ todo.createdAt }}</span>
                <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    circle
                    @click="handleDelete(todo.id)"
                />
            </div>

            <el-empty
                v-if="todoList.length === 0"
                description="暂无待办事项"
                :image-size="60"
            />
        </div>
    </div>
</template>

<script setup lang='ts'>
import { Plus, Delete } from '@element-plus/icons-vue'

interface TodoItem {
    id: number
    text: string
    completed: boolean
    createdAt: string
}

const todoList = ref<TodoItem[]>([
    {
        id: 1,
        text: '完成工作台页面开发',
        completed: false,
        createdAt: '今天 10:30'
    },
    {
        id: 2,
        text: '审核文章《Vue3 学习笔记》',
        completed: false,
        createdAt: '今天 09:15'
    },
    {
        id: 3,
        text: '回复用户评论',
        completed: true,
        createdAt: '昨天 18:20'
    }
])

const newTodo = ref('')
const todoIdCounter = ref(4)

const totalCount = computed(() => todoList.value.length)
const completedCount = computed(() => todoList.value.filter(t => t.completed).length)

const handleAddTodo = () => {
    if (!newTodo.value.trim()) return

    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const timeStr = `今天 ${hours}:${minutes}`

    todoList.value.unshift({
        id: todoIdCounter.value++,
        text: newTodo.value.trim(),
        completed: false,
        createdAt: timeStr
    })
    newTodo.value = ''
}

const handleToggle = (todo: TodoItem) => {
    const item = todoList.value.find(t => t.id === todo.id)
    if (item) {
        item.completed = todo.completed
    }
}

const handleDelete = (id: number) => {
    todoList.value = todoList.value.filter(t => t.id !== id)
}
</script>

<style lang="scss" scoped>
.todo-section {
    background: var(--card-color);
    border-radius: 7px;
    padding: 20px;
    border: 1px solid var(--border-color);

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
        }

        .todo-count {
            font-size: 13px;
            color: var(--text-color-secondary);
            background-color: var(--el-fill-color-light);
            padding: 4px 10px;
            border-radius: 10px;
        }
    }

    .todo-input-wrapper {
        margin-bottom: 16px;

        :deep(.el-input__wrapper) {
            border-radius: 7px;
        }
    }

    .todo-list {
        max-height: 300px;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--el-border-color);
            border-radius: 2px;
        }
    }

    .todo-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 7px;
        transition: all 0.3s ease;
        margin-bottom: 8px;
        background-color: var(--el-fill-color-light);

        &:last-child {
            margin-bottom: 0;
        }

        &:hover {
            background-color: var(--el-fill-color);

            .el-button {
                opacity: 1;
            }
        }

        &.is-completed {
            .todo-text {
                text-decoration: line-through;
                color: var(--text-color-secondary);
            }
        }

        .todo-text {
            flex: 1;
            font-size: 14px;
            color: var(--text-color);
            transition: all 0.3s ease;
        }

        .todo-time {
            font-size: 12px;
            color: var(--text-color-secondary);
            flex-shrink: 0;
        }

        .el-button {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
    }
}

@media (max-width: $screen-medium) {
    .todo-section {
        padding: 15px;

        .section-header {
            margin-bottom: 12px;

            .section-title {
                font-size: 15px;
            }
        }

        .todo-input-wrapper {
            margin-bottom: 12px;
        }

        .todo-item {
            padding: 10px;
            gap: 10px;

            .todo-text {
                font-size: 13px;
            }

            .el-button {
                opacity: 1;
            }
        }
    }
}

@media (max-width: $screen-small) {
    .todo-section {
        padding: 12px;

        .section-header {
            margin-bottom: 10px;

            .section-title {
                font-size: 14px;
            }

            .todo-count {
                font-size: 12px;
                padding: 3px 8px;
            }
        }

        .todo-item {
            padding: 8px;
            gap: 8px;

            .todo-text {
                font-size: 12px;
            }

            .todo-time {
                font-size: 10px;
            }
        }
    }
}
</style>