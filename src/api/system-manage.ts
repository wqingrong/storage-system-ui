import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { Disk } from '@/typings/disk'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/system/menus'
  })
}

// 获取操作日志信息
export function fetchGetOperationList(params: Api.Sys.OperationLoggerSearchParams) {
  return request.get<Api.Sys.OperationLoggerList>({
    url: '/system/getOperationLoggerList',
    params
  })
}
//  获取所有磁盘
export function fetchGetAllDiscDeviceList() {
  return request.get<Disk.Device.DiskDeviceSimpleList>({
    url: '/disk/getAllDiskList'
  })
}

export function fetchGetFreeDiscDeviceList() {
  return request.get<Disk.Device.DiskDeviceSimpleList>({
    url: '/disk/getFreeDiskList'
  })
}

// 获取硬盘的详细信息列表
export function fetchGetDiscDeviceDetailList() {
  return request.get<Disk.Device.DiskDeviceList>({
    url: '/disk/getDiskDetailList'
  })
}

export function fetchCreateStoragePool(data: Disk.Device.CreateStoragePoolDto) {
  return request.post<Disk.Device.CreateStoragePoolSuccessResponse>({
    url: '/disk/createStoragePool',
    data
  })
}

export function fetchGetStoragePoolList() {
  return request.get<Disk.Device.StoragePoolList>({
    url: 'storage/getStoragePoolList'
  })
}

export function fetchGetStoragePoolSimpleList() {
  return request.get<Disk.Device.StoragePoolSimpleList>({
    url: 'storage/getStoragePoolSimpleList'
  })
}

export function fetchNewtStorageSpace(data: Disk.Device.StorageSpaceFormData) {
  return request.post<Disk.Device.NewStorageSpaceResult>({
    url: 'storage/newStorageSpace',
    data
  })
}
