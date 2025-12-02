import { AppRouteRecord } from '@/types/router'

export const systemManagerRoutes: AppRouteRecord = {
  path: '/systemManager',
  name: 'SystemManager',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: '&#xe7b9;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'operation-logger',
      name: 'operationLogger',
      component: '/storage-system/system-manager/user',
      meta: {
        title: '操作日志',
        keepAlive: true
      }
    }
  ]
}
