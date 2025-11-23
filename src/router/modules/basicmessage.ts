import { AppRouteRecord } from '@/types/router'

export const basicMessageRoutes: AppRouteRecord = {
  name: 'BasicMessage',
  path: '/basic-message',
  component: '/index/index',
  meta: {
    title: '基本信息',
    icon: '&#xe83b;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'basic-console',
      name: 'BasicConsole',
      component: '/storage-system/basic-message/console',
      meta: {
        title: '设备信息',
        keepAlive: false,
        fixedTab: true
      }
    },
    {
      path: 'basic-analysis',
      name: 'BasicAnalysis',
      component: '/storage-system/basic-message/analysis',
      meta: {
        title: 'menus.dashboard.analysis',
        keepAlive: false
      }
    },
    {
      path: 'basic-ecommerce',
      name: 'BasicEcommerce',
      component: '/storage-system/basic-message/ecommerce',
      meta: {
        title: 'menus.dashboard.ecommerce',
        keepAlive: false
      }
    }
  ]
}
