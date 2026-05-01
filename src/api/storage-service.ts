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

export function fetchImportZPool(data: Api.Dto.ImportZPoolDto) {
  return request.post<any>({
    url: 'storage/importZPool',
    data
  })
}

export function fetchStopZPool(data: Api.Dto.StopZPool) {
  return request.post<any>({
    url: 'storage/stopZPool',
    data
  })
}

export function fetchDestroyZPool(data: Api.Dto.DestroyZPool) {
  return request.post<any>({
    url: 'storage/destroyZPool',
    data
  })
}
// 踢盘
export function fetchPoolKickDisk(data: any) {
  return request.post<any>({
    url: 'storage/poolKickDisk',
    data
  })
}
