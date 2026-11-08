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
  mountPath: string
  targetPathId: string
}

/**
 * 查询上分片参数
 */
export interface CheckUploadRes {
  fileMd5: string
  totalChunks: number
  mountPath: string
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
  mountPath: string
}

/**
 * 重命名请求参数
 *
 * 与后端 `entity.RenameFileParam` 严格对应，三个字段都是 `binding:"required,min=1"`：
 * - 后端 Go 字段名是 `NewName`，但 json tag 是 `name`，请求体里必须用 `name`
 * - `path` 是文件/目录的**完整旧路径**，后端取 `path.Dir(path)` + 新名字拼出新路径
 * - `id` 是旧路径的加密 id，后端当前不参与计算，但绑定层要求非空，缺了会直接 400
 */
export interface RenamePathReq {
  /** 新名称（仅文件名，不含路径分隔符） */
  name: string
  /** 被重命名对象的完整旧路径，如 /volume1/share/a.txt */
  path: string
  /** 被重命名对象的 id（后端 AES 加密后的旧路径） */
  id: string
}
