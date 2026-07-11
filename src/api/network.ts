import request from '@utils/http'
import { NetworkDeviceInterface, NetworkInterface } from '@/entity/network'
import { Api } from '@/typings/api'

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

export function fetchSetNetworkConfig(data: NetworkInterface) {
  return request.post<NetworkInterface>({
    url: '/network/setNetworkConfig',
    data
  })
}

export function fetchClearInterfaceConfig(data: NetworkInterface) {
  return request.post<NetworkInterface>({
    url: '/network/clearInterfaceConfig',
    data
  })
}

export function fetchCreateBond(data: NetworkInterface) {
  return request.post<NetworkInterface>({
    url: '/network/createBond',
    data
  })
}
