export enum Purpose {
  nfsShare = 'nfsShare',
  snapshot = 'snapshot',
  sambaShare = 'sambaShare'
}

/**
 * 分片上传请求参数
 */
export interface ChunkUploadReq {
  fileMd5: string
  chunkIndex: number
  totalChunks: number
  chunkMd5: string
  chunkFile: boolean
}

/**
 * 查询上分片参数
 */
export interface CheckUploadRes {
  fileMd5: string
  totalChunks: number
}

/**
 * 校验上传接口返回结构
 */
export interface CheckUploadResp {
  /** 是否完整上传完毕（可秒传） */
  isUploaded: boolean
  /** 已上传分片下标数组 */
  uploadedChunks: number[]
  /** 总分片数量 */
  totalChunks: number
}

/**
 * 合并分片请求参数
 */
export interface MergeReq {
  fileMd5: string
  fileName: string
  totalChunks: number
  /** 最终存放路径ID */
  targetPathId: string
}

/**
 * 合并分片接口返回结构
 */
export interface MergeResp {
  success: boolean
  fileUrl?: string
  msg?: string
}

// 取消上传
export interface CancelUploadRe {
  fileMd5: string
}
