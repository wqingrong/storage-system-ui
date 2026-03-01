import request from '@utils/http'
export function fetchGetCPUStatusInfo() {
  return request.get<Api.Monitor.CPUStatusInfo>({
    url: '/monitor/getCpuStatusInfo'
  })
}
