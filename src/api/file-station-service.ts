import request from '@utils/http'
import { CancelUploadRe, CheckUploadRes, CheckUploadResp, MergeReq } from '@/entity/file-station'

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

export function fetchNewFolder(data: any) {
  return request.post<any>({
    url: '/fileStation/newFolder',
    data,
    loading: data.loading !== 'close'
  })
}

export function fetchRenamePath(data: any) {
  return request.post<any>({
    url: '/fileStation/renamePath',
    data
  })
}

// 校验文件上传
export function fetchCheckChunkUpload(params: CheckUploadRes) {
  return request.get<CheckUploadResp>({
    url: '/fileStation/checkChunkUpload',
    params,
    loading: false
  })
}

// 上传文件块
export function fetchChunkUpload(data: any, signal?: AbortSignal) {
  return request.post<any>({
    url: '/fileStation/chunkUpload',
    data,
    loading: false,
    signal,
    showErrorMessage: false // 取消/错误在 composable 中自行处理，不弹全局弹窗
  })
}

// 合并文件块
export function fetchMergeChunkUpload(data: MergeReq) {
  return request.post<any>({
    url: '/fileStation/mergeChunkUpload',
    data,
    loading: false,
    showErrorMessage: false
  })
}

// 取消上传
export function fetchCancelChunkUpload(data: CancelUploadRe) {
  return request.post<any>({
    url: '/fileStation/cancelChunkUpload',
    data,
    showErrorMessage: false
  })
}
