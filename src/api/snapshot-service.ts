import request from '@/utils/http'

/** 获取快照列表 */
export function fetchSnapshotList(params?: Record<string, any>) {
  return request.get<any>({
    url: '/snapshot/list',
    params
  })
}

/** 创建快照 */
export function fetchCreateSnapshot(data: Record<string, any>) {
  return request.post<any>({
    url: '/snapshot/create',
    data
  })
}

/** 删除快照 */
export function fetchDeleteSnapshot(data: { snapshotId: string }) {
  return request.post<any>({
    url: '/snapshot/delete',
    data
  })
}

/** 回滚快照 */
export function fetchRollbackSnapshot(data: { snapshotId: string }) {
  return request.post<any>({
    url: '/snapshot/rollback',
    data
  })
}

/** 克隆快照 */
export function fetchCloneSnapshot(data: { snapshotId: string; targetName?: string }) {
  return request.post<any>({
    url: '/snapshot/clone',
    data
  })
}
