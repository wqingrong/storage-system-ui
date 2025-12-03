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
  }
}
