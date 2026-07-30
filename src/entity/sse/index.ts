/** 任务阶段 */
export enum TaskPhase {
  /** 任务受理 */
  Init = 'init',
  /** 扫描文件系统 */
  Scanning = 'scanning',
  /** 扫描完成 */
  Scanned = 'scanned',
  /** 执行删除 */
  Deleting = 'deleting',
  /** 删除成功 */
  Completed = 'completed',
  /** 取消删除 */
  Canceled = 'canceled',
  /** 删除失败 */
  Failed = 'failed'
}

// 事件类型
export enum Event {
  'DeleteEvent' = 'deleteEvent'
}

// ======================== 删除任务 SSE 事件结构 ========================

/** 删除任务的统一 SSE 事件信封，前端根据 phase 字段分发渲染 */
export interface SSEEvent {
  event: Event
  eventId: string
  status: TaskPhase // 对应事件的发展阶段
  time: string
  data: any
}

/** 任务启动 */
export interface InitPayload {
  pathList: string[]
  message: string
}

/** 扫描进度（遍历中逐文件推送，已做节流） */
export interface ScanProgressPayload {
  currentPath: string
  filesFound: number
  dirsFound: number
  bytesFound: number
}

/** 扫描完成汇总 */
export interface ScannedPayload {
  pathList: string[]
  totalFiles: number
  totalDirs: number
  totalSize: number
  totalSizeHuman: string
}

/** 删除进度 */
export interface DeletingPayload {
  currentPath: string
  deletedCount: number
  failedCount: number
  totalCount: number
  progressPct: number
}

/** 最终结果（completed / canceled / failed 共用） */
export interface TaskResultPayload {
  phase: TaskPhase
  message: string
  deletedFiles: number
  deletedDirs: number
  failedCount: number
  startTime: string
  endTime: string
}

/** 所有 payload 的联合类型 */
export type TaskPayload =
  | InitPayload
  | ScanProgressPayload
  | ScannedPayload
  | DeletingPayload
  | TaskResultPayload

/** 单阶段记录（用于前端追踪任务进度） */
export interface PhaseRecord {
  phase: TaskPhase
  payload: TaskPayload
  timestamp: string
}
