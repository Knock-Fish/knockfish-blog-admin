import { springBootClient } from "@/utils/http"
export class GanttTaskService {
    // 获取任务树
    static getTaskTree() {
        return springBootClient.get<Api.GanttTask.TaskInfo[]>({
            url: "/api/gantt/task/tree"
        })
    }
    // 新增任务
    static addTask(data: Api.GanttTask.TaskInfo) {
        return springBootClient.post<number>({
            url: "/api/gantt/task",
            data
        })
    }
    // 更新任务
    static updateTask(data: Api.GanttTask.TaskInfo) {
        return springBootClient.put<void>({
            url: "/api/gantt/task",
            data
        })
    }
    // 删除任务
    static delTask(taskId: number) {
        return springBootClient.del<void>({
            url: `/api/gantt/task/${taskId}`
        })
    }
}
