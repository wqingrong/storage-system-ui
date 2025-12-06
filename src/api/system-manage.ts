import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

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
export function fetchGetAllDiscDeviceList() {
  return request.get<Disk.Device.DiskDeviceSimpleList>({
    url: '/disk/getAllDiskList'
  })
}
// 获取硬盘的详细信息列表
export function fetchGetDiscDeviceDetailList() {
  return request.get<Disk.Device.DiskDeviceList>({
    url: '/disk/getDiskDetailList'
  })
}
