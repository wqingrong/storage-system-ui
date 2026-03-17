import request from '@/utils/http'
import { Api } from '@/typings/api'

export function fetchReloadSoftRaid(data: Api.Dto.ReloadSoftRaidDto) {
  return request.post<any>({
    url: 'storage/reloadSoftRaid',
    data
  })
}

export function fetchStopSoftRaid(data: Api.Dto.StopSoftRaidDto) {
  return request.post<any>({
    url: 'storage/stopSoftRaid',
    data
  })
}

export function fetchDestroySoftRaid(data: Api.Dto.DestroySoftRaidDto) {
  return request.post<any>({
    url: 'storage/destroySoftRaid',
    data
  })
}
