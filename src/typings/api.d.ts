import GeneralView from '@views/storage-system/dashboard/basic-message/modules/general-view .vue'

/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
declare namespace Api {
  //  接口参数实体类型的包装
  namespace Dto {
    interface MountStorageSpaceDto {
      fileSystem: string
      vgName: string
      volumeName: string
    }

    interface UmountStorageSpaceDto {
      fileSystem: string
      vgName: string
      volumeName: string
    }

    interface DestroyStorageSpace {
      fileSystem: string
      vgName: string
      volumeName: string
    }

    //  获取用户组列表的请求参数
    interface GetGroupListDto {
      current: number
      size: number
      gid: number
      groupName: string
      sort: string // 排序的字段
      orderBy: string // 升序asc 还是降序 desc
    }

    interface QueryUserListDto {
      userName: string
      userAlias: string
      current: number
      size: number
      orderBy: string
      sort: string
    }

    // 添加用户组的参数信息
    interface SysGroupDto {
      groupName: string
      groupAlias: string
      groupDesc: string
    }
    // 系统用户的表单信息
    interface SysUserFormDto {
      uid: number
      userName: string
      userAlias: string
      userDesc: string
      password: string
      masterGroup: Sys.SysGroup
      slaveGroupList: Sys.SysGroup[]
    }

    // 删除用户信息的参数
    interface DeleteUserDto {
      uid: number
      userName: string
    }

    // 删除用户组参数信息
    interface DeleteSysGroupDto {
      gid: number
      groupName: string
    }

    // 创建共享目录的dto
    interface NewShareFolderDto {
      mountPath: string
      folderName: string
      folderPath: string
    }

    interface ReloadSoftRaidDto {
      UUID: string
      devicePath: string
      diskDeviceList: Disk.Device.DiskDeviceDetail[]
    }
    interface ImportZPoolDto {
      UUID: string
      devicePath: string
      poolName: string
    }

    interface StopZPool {
      UUID: string
      devicePath: string
      poolName: string
    }

    interface DestroyZPool {
      UUID: string
      devicePath: string
      poolName: string
    }

    interface StopSoftRaidDto {
      UUID: string
      devicePath: string
    }
    interface DestroySoftRaidDto {
      UUID: string
      devicePath: string
      diskDeviceList: Disk.Device.DiskDeviceDetail[]
    }
  }
  namespace Sys {
    // 基本权限
    interface BasicPermission {
      RO: string
      RW: string
      FB: string
    }
    // 自定权限
    // interface CustomPermission {}

    interface Folder {
      mountPath: string
      folderName: string
      folderPath: string
      modifyTime: string
      ownerUser: string
      ownerGroup: string
    }
    interface SambaRecycle {
      recyclePath: string
    }
    interface SambaPermission {
      writeUserList: string[]
      writeGroupList: string[]
      readUserList: string[]
      readGroupList: string[]
    }
    interface SambaShareFolderConfig {
      folderPath: string
      recycle: SambaRecycle
      shareName: string
      permission: SambaPermission
    }
    interface ShareFolder {
      storageSpace: Disk.Device.StorageSpace
      folder: Folder
      sambaShareFolderConfig: SambaShareFolderConfig
      folderDesc: string
      shareProtocol: string
      isExpanded: boolean
    }

    type ShareFolderList = Api.Common.PaginatedResponse<ShareFolder>

    interface SysUser {
      userName: string
      userAlias: string
      uid: number
      masterGroup: Api.Sys.SysGroup
      userDesc: string
      shell: string
      password: string
      createTime: string
      slaveGroupList: Api.Sys.SysGroup[]
      basicPermission: BasicPermission
    }

    interface SysGroup {
      groupName: string
      groupAlias: string
      createTime: string
      groupDesc: string
      gid: number
      totalPeople: number
      basicPermission: BasicPermission
    }
    // 操作日志的基本格式
    interface OperationLogger {
      id: number
      logType: string
      optionOwner: string
      operationMessage_Zh: string
      operationMessage_En: string
      operationTime: string
    }
    // 搜索日志的参数的数据结构
    interface SearchOperationLoggerParams {
      logType: string
      optionOwner: string
      operationMessage_Zh: string
      operationMessage_En: string
      operationTime: string
    }

    /** 用户搜索日志的参数*/
    type OperationLoggerSearchParams = Partial<SearchOperationLoggerParams> &
      Api.Common.CommonSearchParams

    type OperationLoggerList = Api.Common.PaginatedResponse<OperationLogger>

    interface NFSServerConfig {
      running: boolean
      enabled: boolean
      threads: number
      supportVersion: string
      lockPort: number
      mountedPort: number
      statPort: number
    }
  }
  // 监控信息
  namespace Monitor {
    interface CPUItemStatusInfo {
      usageRate: number
      idleRate: number
      cpuIndex: string
      currentTime: string
    }
    // cpu监控信息
    interface CPUStatusInfo {
      avgUsageRate: number
      avgIdle: number
      currentTime: string
      cpuItemStatusInfoList: CPUItemStatusInfo[]
    }
    interface SwapMemoryInfo {
      totalSize: string
      usedSize: string
      freeSize: string
      availableSize: string
      usageRate: number
      currentTime: string
    }
    interface MemoryInfo {
      totalSize: string
      usedSize: string
      freeSize: string
      availableSize: string
      usageRate: number
      currentTime: string
      swapeMemoryInfo: SwapMemoryInfo
    }
  }
  // 仪表盘模块相关变量
  namespace Dashboard {
    interface GeneralView {
      systemRunTime: string
      diskNumber: number
      raidNumber: number
      volumeNumber: number
    }
  }
  // 接口返回值定义的数据类型
  namespace result {
    type UserList = Api.Common.PaginatedResponse<Sys.SysUser>
    type GroupList = Api.Common.PaginatedResponse<Sys.SysGroup>
    type GroupEntity = Api.Sys.SysGroup
  }
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams
    >
  }
}
