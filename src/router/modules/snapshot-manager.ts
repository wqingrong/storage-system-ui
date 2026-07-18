import { AppRouteRecord } from '@/types/router'

export const snapshotManagerRoutes: AppRouteRecord = {
  name: 'SnapshotManager',
  path: '/snapshot-manager',
  component: '/index/index',
  meta: {
    title: '快照管理',
    icon: '&#xe76d;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'snapshot-list',
      name: 'SnapshotList',
      component: '/storage-system/snapshot-manager/snapshot-list',
      meta: {
        title: '快照列表',
        keepAlive: true
      }
    }
  ]
}
