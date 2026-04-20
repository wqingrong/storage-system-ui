import { AppRouteRecord } from '@/types/router'

export const dashboardRoutes: AppRouteRecord = {
  name: 'Dashboard',
  path: '/dashboard',
  component: '/index/index',
  meta: {
    title: '仪表盘',
    icon: '&#xe721;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'basic-message',
      name: 'BasicMessage',
      component: '/storage-system/dashboard/basic-message',
      meta: {
        title: '基本信息',
        keepAlive: false
      }
    },
    {
      path: 'basic-console',
      name: 'BasicConsole',
      component: '/storage-system/dashboard/console',
      meta: {
        title: '设备信息',
        keepAlive: false,
        fixedTab: true
      }
    },
    {
      path: 'basic-analysis',
      name: 'BasicAnalysis',
      component: '/storage-system/dashboard/analysis',
      meta: {
        title: 'menus.dashboard.analysis',
        keepAlive: false
      }
    }
  ]
}
