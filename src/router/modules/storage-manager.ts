import { AppRouteRecord } from '@/types/router'

export const storageManager: AppRouteRecord = {
  name: 'StorageManager',
  path: '/storage-manager',
  component: '/index/index',
  meta: {
    title: '存储管理',
    icon: '&#xe7c6;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'storage-space',
      name: 'StorageSpace',
      component: '/storage-system/storage-manager/storage-space',
      meta: {
        title: '存储空间',
        keepAlive: true
      }
    },
    {
      path: 'disk-message',
      name: 'DiskMessage',
      component: '/storage-system/storage-manager/disk-message',
      meta: {
        title: '硬盘信息',
        keepAlive: false
      }
    },
    {
      path: 'disk-manager',
      name: 'DiskManager',
      component: '/storage-system/storage-manager/disk-manager',
      meta: {
        title: '硬盘管理',
        keepAlive: true
      }
    }
  ]
}
