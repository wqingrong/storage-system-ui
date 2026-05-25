import { AppRouteRecord } from '@/types/router'

export const fileStation: AppRouteRecord = {
  name: 'FileStation',
  path: '/file-station',
  component: '/index/index',
  meta: {
    title: 'FileStation',
    icon: '&#xe726;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'file-work-space',
      name: 'fileWorkSpace',
      component: '/storage-system/file-station/file-work-space',
      meta: {
        title: '文件工作区',
        keepAlive: true
      }
    }
    // {
    //     path: 'file-service',
    //     name: 'fileService',
    //     component: '/storage-system/file-manager/file-service',
    //     meta: {
    //         title: '文件服务',
    //         keepAlive: true
    //     }
    // }
  ]
}
