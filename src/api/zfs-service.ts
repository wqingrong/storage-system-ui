import request from '@/utils/http'
import { PoolSummary, ZFSPool, ZFSPoolMap } from '@/entity/zfs'

/**
 * 获取当前全部ZFS存储池(池名 → 完整池信息)
 * @returns 存储池map
 */
export function fetchGetZPoolMap() {
  return request.get<ZFSPoolMap>({
    url: '/zfs/getZPoolMap'
  })
}

/**
 * 获取全部ZFS存储池健康概览(列表页/告警使用)
 * @returns 池健康概览列表
 */
export function fetchGetZPoolSummary() {
  return request.get<PoolSummary[]>({
    url: '/zfs/getZPoolSummary'
  })
}

/**
 * 获取单个ZFS存储池详情(vdev树/scrub/问题明细)
 * @param poolName 池名称
 * @returns 池详情
 */
export function fetchGetZPoolDetail(poolName: string) {
  return request.get<ZFSPool>({
    url: '/zfs/getZPoolDetail',
    params: { pool: poolName }
  })
}
