import { AppRouteRecord } from '@/types/router'

export const netWork: AppRouteRecord = {
  name: 'NetWork',
  path: '/netWork',
  component: '/index/index',
  meta: {
    title: '网络',
    icon: '&#xe726;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'network-manager',
      name: 'netWorkManager',
      component: '/storage-system/network/network-manager',
      meta: {
        title: '网络管理',
        keepAlive: true
      }
    }
  ]
}
