import request from '@utils/http'
import {
  CancelUploadRe,
  CheckUploadRes,
  CheckUploadResp,
  MergeReq,
  RenamePathReq
} from '@/entity/file-station'

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

/**
 * 新建文件夹
 * @param silent 静默模式（上传任务内部建目录时使用，错误由任务自己提示）
 */
export function fetchNewFolder(data: any, signal?: AbortSignal, silent = false) {
  return request.post<any>({
    url: '/fileStation/newFolder',
    data,
    loading: data.loading !== 'close',
    signal,
    showErrorMessage: !silent
  })
}

/**
 * 重命名文件 / 文件夹
 * 请求体必须严格是 { name, path, id }，与后端 entity.RenameFileParam 对应
 */
export function fetchRenamePath(data: RenamePathReq) {
  return request.post<any>({
    url: '/fileStation/renamePath',
    data
  })
}

// 校验文件上传（断点续传 / 秒传判断）
export function fetchCheckChunkUpload(params: CheckUploadRes, signal?: AbortSignal) {
  return request.get<CheckUploadResp>({
    url: '/fileStation/checkChunkUpload',
    params,
    loading: false,
    signal,
    // 上传任务自行处理错误提示，避免全局弹窗打断批量上传
    showErrorMessage: false
  })
}

// 上传文件块
export function fetchChunkUpload(data: any, signal?: AbortSignal) {
  return request.post<any>({
    url: '/fileStation/chunkUpload',
    data,
    loading: false,
    signal,
    showErrorMessage: false
  })
}

// 合并文件块
export function fetchMergeChunkUpload(data: MergeReq, signal?: AbortSignal) {
  return request.post<any>({
    url: '/fileStation/mergeChunkUpload',
    data,
    loading: false,
    signal,
    showErrorMessage: false
  })
}

// 取消上传（清理服务端临时分片）
export function fetchCancelChunkUpload(data: CancelUploadRe) {
  return request.post<any>({
    url: '/fileStation/cancelChunkUpload',
    data,
    showErrorMessage: false
  })
}
