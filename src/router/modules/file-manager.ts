import { AppRouteRecord } from '@/types/router'

export const fileManager: AppRouteRecord = {
  name: 'FileManager',
  path: '/file-manager',
  component: '/index/index',
  meta: {
    title: '文件管理',
    icon: '&#xe726;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'share-folder',
      name: 'shareFolder',
      component: '/storage-system/file-manager/share-folder',
      meta: {
        title: '共享文件夹',
        keepAlive: true
      }
    },
    {
      path: 'file-service',
      name: 'fileService',
      component: '/storage-system/file-manager/file-service',
      meta: {
        title: '文件服务',
        keepAlive: true
      }
    }
  ]
}
