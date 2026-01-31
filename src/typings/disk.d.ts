import { RaidGrade } from '@/enums/formEnum'

declare namespace Disk {
  namespace Device {
    interface DeviceMessage {
      model: string
      vendor: string
      serialNumber: string
      interfaceType: string
      totalSize: string
      device: string
      devicePath: string
      format: boolean
    }

    interface DiskDeviceDetail {
      model: string // 磁盘型号
      vendor: string // 磁盘厂商
      serialNumber: string // 磁盘序列号
      interfaceType: string // 磁盘接口类型
      totalSize: string // 磁盘总大小
      device: string // 盘符
      devicePath: string // 盘符路径
      use: string // 磁盘的用途
      healthStatus: HealthStatus // 磁盘的健康状态（使用枚举类型）
      temperature: string // 温度
    }

    type DiskDeviceList = Api.Common.PaginatedResponse<DiskDeviceDetail>
    type DiskDeviceSimpleList = Api.Common.PaginatedResponse<DeviceMessage>

    // 创建存储池的请求参数
    interface CreateStoragePoolDto {
      grade: RaidGrade
      diskDeviceList: Device.DeviceMessage[]
      storagePoolDesc: string
      chunkSize: string
    }

    interface RaidStatusInfo {
      status: string
      devicePath: string
      device: string
      chunkSize: string
      grade: string
      diskDeviceList: Disk.Device.DeviceMessage[]
    }

    interface CreateStoragePoolSuccessResponse {
      raidStatusInfo: RaidStatusInfo
      poolSize: string
      poolName: string
      vgName: string
      storagePoolDesc: string
    }

    interface RaidDetailInfo {
      status: string
      devicePath: string
      device: string
      chunkSize: string
      grade: string
      diskDeviceList: Device.DiskDeviceDetail[]
    }

    interface StorageSpace {
      spaceName: string
      volumeName: string
      mountPath: string
      vgName: string
      fileSystem: string
      spaceSize: string
      useSize: string
      freeSize: string
      useRatio: number
      mountStatus: string
    }

    interface StoragePool {
      poolName: string
      poolStatus: string
      vgName: string
      raidDetailInfo: Device.RaidDetailInfo
      storageSpaceList: Device.StorageSpace[]
      storageSize: string
      useSize: string
      freeSize: string
      useRatio: number
    }

    interface StoragePoolSimpleInfo {
      poolName: string
      vgName: string
      storageSize: string
      freeSize: string
      grad: string
      unit: string
    }

    interface StorageSpaceFormData {
      storagePoolName: string
      vgName: string
      descTxt: string
      spaceSize: string
      fileSystem: string
      unit: string
    }

    interface NewStorageSpaceResult {
      storagePoolName: string
      storageSpaceName: string
      unit: string
      vgName: string
      descTxt: string
      spaceSize: string
      fileSystem: string
      success: boolean
    }

    type StoragePoolList = Api.Common.PaginatedResponse<StoragePool>

    type StoragePoolSimpleList = Api.Common.PaginatedResponse<StoragePoolSimpleInfo>

    type StorageSpaceList = Api.Common.PaginatedResponse<StorageSpace>
  }
}
