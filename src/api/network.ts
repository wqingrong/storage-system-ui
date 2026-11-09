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

export interface SetNetworkConfigOptions {
  /** 是否由 http 拦截器弹错误提示，默认 true */
  showErrorMessage?: boolean
  /**
   * 请求超时（毫秒）。
   * 修改 IP 时网卡一重启，连接可能表现为「一直无响应」而不是立刻断开，
   * 这时全局的 150s 会让用户干等两分半，需要给一个短超时。
   */
  timeout?: number
}

/**
 * 保存网络配置
 *
 * 注意：该接口内部会执行 `nmcli connection up <iface>`，如果改的是当前访问
 * 所用的网卡，连接会在响应返回前断开，前端只会收到网络错误（或超时），但配置
 * 实际上已经生效。这类场景需要调用方传 showErrorMessage=false 自行接管结果。
 */
export function fetchSetNetworkConfig(
  data: NetworkInterface,
  options: SetNetworkConfigOptions = {}
) {
  return request.post<NetworkInterface>({
    url: '/network/setNetworkConfig',
    data,
    showErrorMessage: options.showErrorMessage ?? true,
    ...(options.timeout ? { timeout: options.timeout } : {})
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
