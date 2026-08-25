import request from "@/utils/http"
export class GanttTaskService {
    // 获取任务树
    static getTaskTree() {
        return request.get<Api.GanttTask.TaskInfo[]>({
            url: "/api/gantt/task/tree"
        })
    }
    // 新增任务
    static addTask(data: Api.GanttTask.TaskInfo) {
        return request.post<number>({
            url: "/api/gantt/task",
            data
        })
    }
    // 更新任务
    static updateTask(data: Api.GanttTask.TaskInfo) {
        return request.put<void>({
            url: "/api/gantt/task",
            data
        })
    }
    // 删除任务
    static delTask(taskId: number) {
        return request.del<void>({
            url: `/api/gantt/task/${taskId}`
        })
    }
}
