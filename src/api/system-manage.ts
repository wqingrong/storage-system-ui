import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { Disk } from '@/typings/disk'
import { Api } from '@/typings/api'

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
    url: 'storage/createStoragePool',
    data
  })
}

export function fetchCreateZPool(data: Disk.Device.CreateZPoolDto) {
  return request.post<Disk.Device.CreateZPoolSuccessResponse>({
    url: 'storage/createZpool',
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

export function fetchMountStorageSpace(data: Api.Dto.MountStorageSpaceDto) {
  return request.post<Disk.Device.StorageSpace>({
    url: 'storage/mountStorageSpace',
    data
  })
}

export function fetchUmountStorageSpace(data: Api.Dto.UmountStorageSpaceDto) {
  return request.post<any>({
    url: 'storage/umountStorageSpace',
    data
  })
}

export function fetchDestroyStorageSpace(data: Api.Dto.DestroyStorageSpace) {
  return request.post<any>({
    url: 'storage/destroyStorageSpace',
    data
  })
}

// 获取用户组列表
export function fetchGetGroupList(params: Api.Dto.GetGroupListDto) {
  return request.get<Api.result.GroupList>({
    url: 'user/getGroupList',
    params
  })
}

// 添加用户组
export function fetchAddGroup(data: Api.Dto.SysGroupDto) {
  return request.post<Api.result.GroupEntity>({
    url: 'user/addGroup',
    data
  })
}

// 添加用户接口
export function fetchAddUser(data: Api.Dto.SysUserFormDto) {
  return request.post<Api.Sys.SysUser>({
    url: 'user/addUser',
    data
  })
}

// 查询用户列表接口
export function fetchQueryUserList(params: Api.Dto.QueryUserListDto) {
  return request.get<Api.result.UserList>({
    url: 'user/queryUserList',
    params
  })
}

// 编辑用户信息
export function fetchEditUser(data: Api.Dto.SysUserFormDto) {
  return request.post<Api.Sys.SysUser>({
    url: 'user/editUser',
    data
  })
}

// 删除用户
export function fetchDeleteUsers(data: Api.Dto.DeleteUserDto[]) {
  return request.post<Api.Dto.DeleteUserDto>({
    url: 'user/delUsers',
    data
  })
}

//  编辑用户组
export function fetchEditGroup(data: Api.Dto.SysGroupDto) {
  return request.post<Api.Dto.SysGroupDto>({
    url: 'user/editGroup',
    data
  })
}

// 删除用户组
export function fetchDelGroups(data: Api.Dto.DeleteSysGroupDto[]) {
  return request.post<any>({
    url: 'user/delGroups',
    data
  })
}

//  获取存储空间列表
export function fetchGetStorageSpaceList() {
  return request.get<Disk.Device.StorageSpaceList>({
    url: 'storage/getStorageSpaceList'
  })
}
