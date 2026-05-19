import { AppRouteRecord } from '@/types/router'

export const SafetyProtection: AppRouteRecord = {
  name: 'SafetyProtection',
  path: '/safety_protection',
  component: '/index/index',
  meta: {
    title: '安全防护',
    icon: '&#xe7c6;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'firewall-manager',
      name: 'FirewallManager',
      component: '/storage-system/safety-protection/firewall-port-manager',
      meta: {
        title: '防火墙管理',
        keepAlive: true
      }
    }
  ]
}
