import request from '@utils/http'
import { NetworkInterface } from '@/entity/network'

export function fetchGetNetworkInterfaceDetailedList(params: any) {
  return request.get<NetworkInterface[]>({
    url: '/network/getNetworkInterfaceDetailedList',
    params
  })
}
