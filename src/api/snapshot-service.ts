import request from '@/utils/http'

/** 获取快照列表 */
export function fetchSnapshotList(data: any) {
  return request.post<any>({
    url: '/storage/getZfsSnapshotList',
    data
  })
}

/** 创建快照 */
export function fetchCreateSnapshot(data: Record<string, any>) {
  return request.post<any>({
    url: '/storage/createZfsSnapshot',
    data
  })
}

/** 删除快照 */
export function fetchDeleteSnapshot(data: any) {
  return request.post<any>({
    url: '/storage/destroyZfsSnapshot',
    data
  })
}

/** 回滚快照 */
export function fetchRollbackSnapshot(data: any) {
  return request.post<any>({
    url: '/storage/rollbackSnapshot',
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

// 获取数据集列表
export function fetchGetZfsdDataSetList(params: any) {
  return request.get<any>({
    url: '/storage/getZfsDataSetList',
    params
  })
}
