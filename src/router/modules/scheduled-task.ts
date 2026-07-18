import { AppRouteRecord } from '@/types/router'

export const scheduledTaskRoutes: AppRouteRecord = {
  name: 'ScheduledTask',
  path: '/scheduled-task',
  component: '/index/index',
  meta: {
    title: '定时任务',
    icon: '&#xe6f3;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'task-list',
      name: 'TaskList',
      component: '/storage-system/scheduled-task/task-list',
      meta: {
        title: '任务列表',
        keepAlive: true
      }
    }
  ]
}