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
      path: 'basic-console',
      name: 'BasicConsole',
      component: '/storage-system/storage-manager/console',
      meta: {
        title: '存储空间',
        keepAlive: false,
        fixedTab: true
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
      path: 'basic-ecommerce',
      name: 'BasicEcommerce',
      component: '/storage-system/storage-manager/ecommerce',
      meta: {
        title: 'menus.dashboard.ecommerce',
        keepAlive: false
      }
    }
  ]
}
