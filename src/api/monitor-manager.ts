import request from '@utils/http'
import { Api } from '@/typings/api'
export function fetchGetCPUStatusInfo() {
  return request.get<Api.Monitor.CPUStatusInfo>({
    url: '/monitor/getCpuStatusInfo'
  })
}

export function fetchGetMemoryInfo() {
  return request.get<Api.Monitor.MemoryInfo>({
    url: '/monitor/getMemoryInfo'
  })
}
