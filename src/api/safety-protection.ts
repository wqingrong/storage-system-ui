import request from '@utils/http'

//  获取当前开放的防火墙端口
export function fetchParesPortList(params: any) {
  return request.get<any>({
    url: '/firewall/paresPortList',
    params
  })
}
