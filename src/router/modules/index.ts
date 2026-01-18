import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { templateRoutes } from './template'
import { widgetsRoutes } from './widgets'
import { examplesRoutes } from './examples'
import { systemRoutes } from './system'
import { articleRoutes } from './article'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { safeguardRoutes } from './safeguard'
import { helpRoutes } from './help'
import { basicMessageRoutes } from './basicmessage'
import { watchStatusRoutes } from './watchstatus'
import { usersManager } from './users-manager'
import { systemManagerRoutes } from '@/router/modules/system-manager'
import { storageManager } from '@/router/modules/storage-manager'
import { fileManager } from '@/router/modules/file-manager'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  basicMessageRoutes,
  usersManager,
  storageManager,
  fileManager,
  watchStatusRoutes,
  systemManagerRoutes,
  dashboardRoutes,
  templateRoutes,
  widgetsRoutes,
  examplesRoutes,
  systemRoutes,
  articleRoutes,
  resultRoutes,
  exceptionRoutes,
  safeguardRoutes,
  ...helpRoutes
]
