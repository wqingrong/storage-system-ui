import { AppRouteRecord } from '@/types/router'

export const usersManager: AppRouteRecord = {
  name: 'usersManager',
  path: '/usersManager',
  component: '/index/index',
  meta: {
    title: '用户管理',
    icon: '&#xe831;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'users-manager',
      name: 'UsersManager',
      component: '/storage-system/users-manager/users',
      meta: {
        title: '用户管理',
        keepAlive: false,
        fixedTab: true
      }
    },
    {
      path: 'groups-manager',
      name: 'GroupsManager',
      component: '/storage-system/users-manager/groups',
      meta: {
        title: '用户组管理',
        keepAlive: false
      }
    }
  ]
}
