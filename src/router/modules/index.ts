import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { watchStatusRoutes } from './watchstatus'
import { usersManager } from './users-manager'
import { systemManagerRoutes } from '@/router/modules/system-manager'
import { storageManager } from '@/router/modules/storage-manager'
import { fileManager } from '@/router/modules/file-manager'
import { templateRoutes } from '@/router/modules/template'
import { widgetsRoutes } from '@/router/modules/widgets'
import { examplesRoutes } from '@/router/modules/examples'
import { systemRoutes } from '@/router/modules/system'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  watchStatusRoutes,
  usersManager,
  storageManager,
  fileManager,
  systemManagerRoutes,
  dashboardRoutes,
  templateRoutes,
  widgetsRoutes,
  examplesRoutes,
  systemRoutes
]
