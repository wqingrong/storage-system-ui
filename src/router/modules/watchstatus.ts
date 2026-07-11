import { AppRouteRecord } from '@/types/router'

export const watchStatusRoutes: AppRouteRecord = {
  name: 'WatchStatus',
  path: '/watch-status',
  component: '/index/index',
  meta: {
    title: '监控状态',
    icon: '&#xe812;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      //  全部的监控状态
      path: 'watch-network',
      name: 'WatchNetwork',
      component: '/storage-system/watch-status/watch-network',
      meta: {
        title: '网络监控',
        keepAlive: false,
        fixedTab: true
      }
    },
    {
      path: 'watch-disk',
      name: 'WatchDisk',
      component: '/storage-system/watch-status/watch-disk',
      meta: {
        title: '硬盘监控',
        keepAlive: false
      }
    },
    // {
    //   path: 'watch-storagePool',
    //   name: 'WatchStoragePool',
    //   component: '/storage-system/watch-status/ecommerce',
    //   meta: {
    //     title: '存储池监控',
    //     keepAlive: false
    //   }
    // },
    {
      path: 'watch-process',
      name: 'watchProcess',
      component: '/storage-system/watch-status/watch-progress',
      meta: {
        title: '进程监控',
        keepAlive: false
      }
    },
    {
      path: 'watch-CPU-memory',
      name: 'watchCPU',
      component: '/storage-system/watch-status/cpu-memory-monitor',
      meta: {
        title: 'CPU/内存监控',
        keepAlive: false
      }
    }
  ]
}
