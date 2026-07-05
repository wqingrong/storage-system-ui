import request from '@utils/http'
import { NetworkDeviceInterface, NetworkInterface } from '@/entity/network'

export function fetchGetNetworkInterfaceDetailedList(params: any) {
  return request.get<NetworkInterface[]>({
    url: '/network/getNetworkInterfaceDetailedList',
    params
  })
}

export function fetchGetNetworkDeviceList(params: any) {
  return request.get<NetworkDeviceInterface[]>({
    url: '/network/getInterfaceDeviceList',
    params
  })
}
