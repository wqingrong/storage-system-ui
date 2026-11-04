import request from '@/utils/http'
import {
  ImportDiskParams,
  KickVdevNode,
  NewZfsDataSet,
  PoolSummary,
  ZFSDataSet,
  ZFSPool,
  ZFSPoolMap
} from '@/entity/zfs'
import { Disk } from '@/typings/disk'

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

/**
 * 在ZFS存储池上创建数据集(存储空间)
 * @param data 创建参数
 * @returns 创建成功的数据集信息
 */
export function fetchCreateZfsDataSet(data: NewZfsDataSet) {
  return request.post<ZFSDataSet>({
    url: '/zfs/createZfsDataSet',
    data
  })
}

/**
 * 销毁ZFS存储池
 * @param data 池标识(按池名销毁)
 * @returns 销毁的存储池信息
 */
export function fetchDestroyZPool(data: Pick<ZFSPool, 'pool_name'>) {
  return request.post<ZFSPool>({
    url: '/zfs/destroyZPool',
    data
  })
}

/**
 * 获取未导入的ZFS存储池列表
 * @returns 未导入存储池列表
 */
export function fetchUnImportZPoolList() {
  return request.get<Disk.Device.StoragePool[]>({
    url: '/zfs/unImportZPoolList'
  })
}

/**
 * 导入ZFS存储池(按UUID导入)
 * @param uuid 池UUID
 * @param poolName 池名称
 * @returns 导入结果
 */
export function fetchImportZPool(uuid: string, poolName: string) {
  return request.get<{ uuid: string; poolName: string }>({
    url: '/zfs/importZPool',
    params: { uuid, poolName }
  })
}

/**
 * 停止ZFS存储池
 * @param data 池标识(按池名停止)
 * @returns 停止的存储池信息
 */
export function fetchStopZPool(data: Pick<ZFSPool, 'pool_name'>) {
  return request.post<ZFSPool>({
    url: '/zfs/stopZPool',
    data
  })
}

/**
 * 挂载ZFS数据集(存储空间)
 * @param dataSet 数据集信息(由 /zfs/getZPoolMap 返回)
 * @returns 挂载后的数据集信息
 */
export function fetchMountVolume(dataSet: ZFSDataSet) {
  return request.post<ZFSDataSet>({
    url: '/zfs/mountVolume',
    data: dataSet
  })
}

/**
 * 卸载ZFS数据集(存储空间)
 * @param dataSet 数据集信息(由 /zfs/getZPoolMap 返回)
 * @returns 卸载后的数据集信息
 */
export function fetchUnmountVolume(dataSet: ZFSDataSet) {
  return request.post<ZFSDataSet>({
    url: '/zfs/unmountVolume',
    data: dataSet
  })
}

/**
 * 销毁ZFS数据集(存储空间，需先卸载)
 * @param dataSet 数据集信息(由 /zfs/getZPoolMap 返回)
 * @returns 销毁的数据集信息
 */
export function fetchDestroyDataset(dataSet: ZFSDataSet) {
  return request.post<ZFSDataSet>({
    url: '/zfs/destroyDataset',
    data: dataSet
  })
}

/**
 * ZFS存储池踢盘(将磁盘从存储池中踢出，执行 zpool offline -f)
 * @param data 踢盘参数(与后端 zfsmodel.KickVdevNode 对应)
 * @returns 踢盘结果
 */
export function fetchKickVdev(data: KickVdevNode) {
  return request.post<KickVdevNode>({
    url: '/zfs/kickVdev',
    data
  })
}

/**
 * ZFS存储池引入磁盘(将已移除/故障磁盘重新上线，执行 zpool online + zpool clear)
 * @param data 引入参数(与后端 zfsmodel.ImportDiskNode 对应)
 * @returns 引入结果
 */
export function fetchZfsImportDisk(data: ImportDiskParams) {
  return request.post<ImportDiskParams>({
    url: '/zfs/importDisk',
    data
  })
}
