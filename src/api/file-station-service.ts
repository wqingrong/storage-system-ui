import request from '@utils/http'

export function fetchGetStoragePathList() {
  return request.get<any>({
    url: '/fileStation/getStoragePathList'
  })
}

export function fetchGetFileInfoList(data: any) {
  return request.post<any>({
    url: '/fileStation/getFileInfoList',
    data
  })
}

export function fetchGetDirInfoList(data: any) {
  return request.post<any>({
    url: '/fileStation/getDirInfoList',
    data
  })
}
