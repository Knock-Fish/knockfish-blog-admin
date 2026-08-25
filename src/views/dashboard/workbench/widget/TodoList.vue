<template>
    <div class="todo-section">
        <!-- ========== 顶部：标题 + 总览统计 ========== -->
        <div class="section-header">
            <h3 class="section-title">
                <SvgIcon icon="mdi:checkbox-marked-outline" />
                待办事项
            </h3>
            <div class="header-right">
                <span class="todo-count">{{ stats.done }}/{{ stats.total
                    }}</span>
                <el-button link type="primary" class="refresh-btn"
                    :loading="loading" @click="loadData">
                    <Icon icon="ri:refresh-line" />
                </el-button>
            </div>
        </div>

        <!-- ========== 状态统计条（4 个紧凑状态卡） ========== -->
        <div class="stats-row">
            <div class="stat-cell cell-todo"
                :class="{ active: filter === 'todo' }"
                @click="setFilter('todo')">
                <div class="stat-num">{{ stats.todo }}</div>
                <div class="stat-label">未开始</div>
                <div class="stat-bar"><span
                        :style="{ width: pct(stats.todo) + '%' }"></span></div>
            </div>
            <div class="stat-cell cell-doing"
                :class="{ active: filter === 'doing' }"
                @click="setFilter('doing')">
                <div class="stat-num">{{ stats.doing }}</div>
                <div class="stat-label">进行中</div>
                <div class="stat-bar"><span
                        :style="{ width: pct(stats.doing) + '%' }"></span></div>
            </div>
            <div class="stat-cell cell-done"
                :class="{ active: filter === 'done' }"
                @click="setFilter('done')">
                <div class="stat-num">{{ stats.done }}</div>
                <div class="stat-label">已完成</div>
                <div class="stat-bar"><span
                        :style="{ width: pct(stats.done) + '%' }"></span></div>
            </div>
            <div class="stat-cell cell-delay"
                :class="{ active: filter === 'delay' }"
                @click="setFilter('delay')">
                <div class="stat-num">{{ stats.delay }}</div>
                <div class="stat-label">已延期</div>
                <div class="stat-bar"><span
                        :style="{ width: pct(stats.delay) + '%' }"></span></div>
            </div>
        </div>

        <!-- ========== 列表区：按类型分组的紧凑任务（保持原 max-height） ========== -->
        <div class="todo-list">
            <template v-if="filteredGroups.length > 0">
                <div v-for="group in filteredGroups" :key="group.type"
                    class="todo-group">
                    <div class="group-title">
                        <span class="group-dot"
                            :style="{ background: group.color }"></span>
                        <span class="group-name">{{ group.name }}</span>
                        <span class="group-count">{{ group.items.length
                            }}</span>
                    </div>
                    <div
                        v-for="t in group.items.slice(0, showMoreMap[group.type] ? undefined : 3)"
                        :key="t.id"
                        class="todo-item"
                        :class="{ 'is-completed': t.status === 'done', 'is-cancel': t.status === 'cancel' }"
                    >
                        <span class="status-dot" :style="{ background: statusColor(t.status) }"></span>
                        <span class="todo-text">{{ t.text }}</span>
                        <!-- 普通任务：进度条；里程碑/汇总：标签 -->
                        <el-progress
                            v-if="t.type === 'task'"
                            :percentage="Math.round((t.progress || 0) * 100)"
                            :stroke-width="4"
                            :status="progressStatus(t)"
                            class="todo-progress"
                        />
                        <el-tag v-else size="small" :type="t.type === 'milestone' ? 'warning' : 'success'" effect="plain">
                            {{ t.type === 'milestone' ? '里程碑' : '汇总' }}
                        </el-tag>
                        <span class="todo-time" :title="t.end || t.start">{{ dateTag(t) }}</span>
                    </div>
                    <div
                        v-if="group.items.length > 3 && !showMoreMap[group.type]"
                        class="group-more"
                        @click="toggleShowMore(group.type)"
                    >
                        展开剩余 {{ group.items.length - 3 }} 项
                    </div>
                    <div
                        v-else-if="group.items.length > 3 && showMoreMap[group.type]"
                        class="group-more"
                        @click="toggleShowMore(group.type)"
                    >
                        收起
                    </div>
                </div>
            </template>
            <el-empty v-else-if="!loading" description="暂无匹配任务"
                :image-size="60" />
            <div v-else class="loading-hint">加载中...</div>
        </div>

        <!-- ========== 底部快捷入口 ========== -->
        <div class="footer-actions">
            <el-button type="primary" plain size="small" @click="goGantt">
                <Icon icon="ri:external-link-line" /> 打开甘特图
            </el-button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { onMounted, reactive, ref, computed } from 'vue'
import { router } from '@/router'
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs'
import { GanttTaskService } from '@/api/ganttTaskApi'
import type { TaskStatus, TaskType } from '@/components/gantt-chart/types'

interface FlatTask {
    id: string
    text: string
    type: TaskType
    status: TaskStatus
    progress: number
    start?: string
    end?: string
    parentId?: string | null
}

const loading = ref(false)
const allTasks = ref<FlatTask[]>([])
const filter = ref<TaskStatus | 'all'>('all')
/** 每组"展开更多"开关的持久化状态（不放在 computed 生成的临时对象里） */
const showMoreMap = reactive<Record<string, boolean>>({})
function toggleShowMore(type: string) {
    showMoreMap[type] = !showMoreMap[type]
}

/** 顶部 4 档状态统计 */
const stats = reactive({ total: 0, todo: 0, doing: 0, done: 0, delay: 0 })
function calcStats() {
    stats.total = allTasks.value.length
    stats.todo = allTasks.value.filter(t => t.status === 'todo').length
    stats.doing = allTasks.value.filter(t => t.status === 'doing').length
    stats.done = allTasks.value.filter(t => t.status === 'done').length
    stats.delay = allTasks.value.filter(t => t.status === 'delay').length
}

/** 从后端拉任务树（甘特图数据），并把 PROJECT / MILESTONE / TASK 全部摊平到列表 */
async function loadData() {
    loading.value = true
    try {
        const tree = await GanttTaskService.getTaskTree() || []
        const flat: FlatTask[] = []
        function walk(list: any[]) {
            for (const t of list) {
                flat.push({
                    id: String(t.task_id),
                    text: t.text,
                    type: t.type as TaskType,
                    status: t.status as TaskStatus,
                    progress: typeof t.progress === 'number' ? t.progress : 0,
                    start: t.start,
                    end: t.end,
                    parentId: t.parent_id,
                })
                if (t.children?.length) walk(t.children)
            }
        }
        walk(tree)
        allTasks.value = flat
        calcStats()
    } catch {
        allTasks.value = []
        calcStats()
    } finally {
        loading.value = false
    }
}

/** 顶部状态卡切换：再次点击当前激活状态即切回"全部" */
function setFilter(s: TaskStatus | 'all') {
    filter.value = filter.value === s ? 'all' : s
}
function pct(n: number) {
    if (!stats.total) return 0
    return Math.round((n / stats.total) * 100)
}
function statusColor(s: TaskStatus) {
    switch (s) {
        case 'done': return '#67c23a'
        case 'doing': return '#409eff'
        case 'delay': return '#f56c6c'
        case 'cancel': return '#c0c4cc'
        default: return '#909399'
    }
}
function progressStatus(t: FlatTask): any {
    if (t.status === 'delay') return 'exception'
    if (t.status === 'done' || t.progress === 1) return 'success'
    if (t.progress === 0) return ''
    return undefined
}
function dateTag(t: FlatTask): string {
    const end = t.end || t.start
    if (!end) return '未排期'
    const d = dayjs(end)
    if (d.isSame(dayjs(), 'day')) return '今天'
    if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return '昨天'
    if (d.isSame(dayjs().add(1, 'day'), 'day')) return '明天'
    if (d.isSame(dayjs(), 'month')) return d.format('DD日')
    return d.format('MM/DD')
}

/** 按类型（TASK / MILESTONE / PROJECT）分组，并按 status 过滤 */
interface GroupItem { type: TaskType; name: string; color: string; items: FlatTask[] }
const filteredGroups = computed<GroupItem[]>(() => {
    const filtered = filter.value === 'all'
        ? allTasks.value
        : allTasks.value.filter(t => t.status === filter.value)
    const order: TaskType[] = ['task', 'milestone', 'project']
    const meta: Record<TaskType, { name: string; color: string }> = {
        task: { name: '任务', color: '#409eff' },
        milestone: { name: '里程碑', color: '#e6a23c' },
        project: { name: '汇总任务', color: '#67c23a' },
    }
    return order
        .map<GroupItem>(k => ({
            type: k,
            name: meta[k].name,
            color: meta[k].color,
            items: filtered.filter(t => t.type === k),
        }))
        .filter(g => g.items.length > 0)
})

function goGantt() {
    router.push({ name: 'Todo' })
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.todo-section {
    background: var(--card-color);
    border-radius: 7px;
    padding: 20px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    /* 保持布局容器高度不变：原有 max-height 300 的列表 + header/footer 用压缩填充其余空间 */

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 8px;

            .todo-count {
                font-size: 12px;
                color: var(--text-color-secondary);
                background-color: var(--el-fill-color-light);
                padding: 3px 10px;
                border-radius: 10px;
            }

            .refresh-btn {
                padding: 0 4px;
            }
        }
    }

    /* ========== 4 状态卡紧凑统计条 ========== */
    .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 12px;
    }

    .stat-cell {
        position: relative;
        padding: 8px 10px;
        border-radius: 6px;
        background: var(--el-fill-color-lighter);
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;

        &:hover {
            transform: translateY(-1px);
            background: var(--el-fill-color-light);
        }

        &.active {
            border-color: var(--el-color-primary-light-5);
            box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        }

        .stat-num {
            font-size: 18px;
            font-weight: 700;
            line-height: 1.1;
        }

        .stat-label {
            font-size: 11px;
            color: var(--text-color-secondary);
            margin-top: 2px;
        }

        .stat-bar {
            position: relative;
            margin-top: 6px;
            height: 3px;
            border-radius: 2px;
            background: rgba(144, 147, 153, 0.12);
            overflow: hidden;

            span {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                border-radius: 2px;
                transition: width 0.3s;
            }
        }

        &.cell-todo {
            .stat-num {
                color: #909399;
            }

            .stat-bar span {
                background: #909399;
            }
        }

        &.cell-doing {
            .stat-num {
                color: #409eff;
            }

            .stat-bar span {
                background: #409eff;
            }
        }

        &.cell-done {
            .stat-num {
                color: #67c23a;
            }

            .stat-bar span {
                background: #67c23a;
            }
        }

        &.cell-delay {
            .stat-num {
                color: #f56c6c;
            }

            .stat-bar span {
                background: #f56c6c;
            }
        }
    }

    /* ========== 列表：保持原 max-height 300 不变 ========== */
    .todo-list {
        max-height: 370px;
        overflow-y: auto;
        scrollbar-width: none;
        flex: 1;
        min-height: 0;

        &::-webkit-scrollbar {
            width: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--el-border-color);
            border-radius: 2px;
        }
    }

    .todo-group {
        margin-bottom: 10px;
    }

    .group-title {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 2px 4px 6px 4px;
        font-size: 12px;
        color: var(--text-color-secondary);

        .group-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .group-name {
            font-weight: 600;
        }

        .group-count {
            margin-left: auto;
            background: var(--el-fill-color-light);
            padding: 0 6px;
            height: 16px;
            line-height: 16px;
            border-radius: 8px;
            font-size: 11px;
        }
    }

    .todo-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        margin-bottom: 4px;
        background: transparent;
        transition: background 0.15s;

        &:hover {
            background: var(--el-fill-color-lighter);
        }

        &.is-completed {
            .todo-text {
                text-decoration: line-through;
                color: var(--text-color-secondary);
            }
        }

        &.is-cancel .todo-text {
            text-decoration: line-through;
            color: var(--text-color-placeholder);
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .todo-text {
            flex: 1;
            min-width: 0;
            font-size: 13px;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .todo-progress {
            width: 100px;
            flex-shrink: 0;

            :deep(.el-progress-bar__outer) {
                height: 4px;
                border-radius: 2px;
            }
        }

        .el-tag {
            flex-shrink: 0;
            margin-right: 2px;
        }

        .todo-time {
            flex-shrink: 0;
            font-size: 11px;
            color: var(--text-color-secondary);
            min-width: 36px;
            text-align: right;
        }
    }

    .group-more {
        text-align: center;
        font-size: 11px;
        color: var(--text-color-secondary);
        padding: 4px;
        cursor: pointer;

        &:hover {
            color: var(--el-color-primary);
        }
    }

    .loading-hint {
        text-align: center;
        color: var(--text-color-secondary);
        padding: 20px 0;
        font-size: 12px;
    }

    /* ========== 底部快捷栏 ========== */
    .footer-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px dashed var(--el-border-color-lighter);
    }
}

@media (max-width: $screen-medium) {
    .todo-section {
        padding: 15px;
    }

    .todo-section .section-header {
        margin-bottom: 10px;

        .section-title {
            font-size: 15px;
        }
    }

    .todo-section .stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }
}

@media (max-width: $screen-small) {
    .todo-section {
        padding: 12px;
    }

    .todo-section .section-header {
        margin-bottom: 8px;

        .section-title {
            font-size: 14px;
        }
    }

    .todo-section .todo-progress {
        display: none;
    }

    /* 小屏隐藏进度条给文字腾空间 */
}
</style>
