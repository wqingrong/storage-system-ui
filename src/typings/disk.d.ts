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
  }
}
