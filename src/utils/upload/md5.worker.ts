/**
 * 文件指纹计算 Worker
 *
 * 一次磁盘顺序读完成两件事：
 *   1. 全文件 MD5（后端 merge 时强校验，必须与实际内容一致）
 *   2. 每个分片的 MD5（后端 chunkUpload 校验用）
 *
 * 放在 Worker 中运行，避免大文件哈希阻塞主线程导致上传面板卡死。
 */
import SparkMD5 from 'spark-md5'

export interface HashWorkerRequest {
  file: File
  chunkSize: number
}

export type HashWorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; md5: string; chunkMd5s: string[] }
  | { type: 'error'; message: string }

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<HashWorkerRequest>) => void) | null
  postMessage: (message: HashWorkerResponse) => void
}

ctx.onmessage = async (event: MessageEvent<HashWorkerRequest>) => {
  const { file, chunkSize } = event.data

  try {
    if (!file || file.size <= 0) {
      ctx.postMessage({ type: 'error', message: '文件内容为空' })
      return
    }

    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize))
    const chunkMd5s: string[] = new Array(totalChunks)
    const fileHasher = new SparkMD5.ArrayBuffer()

    let offset = 0
    let lastReport = -1

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size)
      const buffer = await file.slice(offset, end).arrayBuffer()

      fileHasher.append(buffer)

      const chunkHasher = new SparkMD5.ArrayBuffer()
      chunkHasher.append(buffer)
      chunkMd5s[Math.floor(offset / chunkSize)] = chunkHasher.end()

      offset = end

      const percent = Math.min(100, Math.round((offset / file.size) * 100))
      // 同一百分比不重复上报，减少 postMessage 次数
      if (percent !== lastReport) {
        lastReport = percent
        ctx.postMessage({ type: 'progress', percent })
      }
    }

    ctx.postMessage({ type: 'done', md5: fileHasher.end(), chunkMd5s })
  } catch (err: any) {
    ctx.postMessage({ type: 'error', message: err?.message || '文件指纹计算失败' })
  }
}
