import request from '@utils/http'
import { Api } from '@/typings/api'

export function fetchGetNFSServerConfig(params: any) {
  return request.get<Api.Sys.NFSServerConfig>({
    url: '/protocolService/getNFSServerConfig',
    params
  })
}

export function fetchSetupNFSServerConfig(data: Api.Sys.NFSServerConfig) {
  return request.post<Api.Sys.NFSServerConfig>({
    url: '/protocolService/setupNFSServerConfig',
    data
  })
}
