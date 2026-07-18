import request from '@/utils/http'

/** 获取定时任务列表 */
export function fetchScheduledTaskList(params?: Record<string, any>) {
  return request.get<any>({
    url: '/scheduled-task/list',
    params
  })
}

/** 创建定时任务 */
export function fetchCreateScheduledTask(data: Record<string, any>) {
  return request.post<any>({
    url: '/scheduled-task/create',
    data
  })
}

/** 更新定时任务 */
export function fetchUpdateScheduledTask(data: Record<string, any>) {
  return request.post<any>({
    url: '/scheduled-task/update',
    data
  })
}

/** 删除定时任务 */
export function fetchDeleteScheduledTask(data: { id: string }) {
  return request.post<any>({
    url: '/scheduled-task/delete',
    data
  })
}

/** 立即执行定时任务 */
export function fetchExecuteScheduledTask(data: { id: string }) {
  return request.post<any>({
    url: '/scheduled-task/execute',
    data
  })
}

/** 启用/禁用定时任务 */
export function fetchToggleScheduledTask(data: { id: string; enabled: boolean }) {
  return request.post<any>({
    url: '/scheduled-task/toggle',
    data
  })
}