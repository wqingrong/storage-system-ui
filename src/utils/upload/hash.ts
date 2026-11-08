import SparkMD5 from 'spark-md5'
import type { HashWorkerRequest, HashWorkerResponse } from './md5.worker'

export interface HashResult {
  /** 整个文件的 MD5 */
  md5: string
  /** 每个分片对应的 MD5，下标与分片下标一致 */
  chunkMd5s: string[]
}

export interface HashOptions {
  /** 分片大小，必须与上传分片大小一致 */
  chunkSize: number
  /** 中止信号，取消任务时立即停止计算 */
  signal?: AbortSignal
  /** 计算进度 0-100 */
  onProgress?: (percent: number) => void
}

function createAbortError(): Error {
  return new DOMException('任务已取消', 'AbortError')
}

/**
 * 计算文件指纹（文件 MD5 + 分片 MD5）
 *
 * 优先在 Web Worker 中计算，避免阻塞 UI；
 * Worker 不可用时降级为主线程分片计算（每片之间让出事件循环，保证界面可响应）。
 */
export async function hashFile(file: File, options: HashOptions): Promise<HashResult> {
  if (options.signal?.aborted) throw createAbortError()

  const worker = createWorker()
  if (!worker) {
    return hashOnMainThread(file, options)
  }

  return new Promise<HashResult>((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      options.signal?.removeEventListener('abort', handleAbort)
      worker.terminate()
    }

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    function handleAbort() {
      settle(() => reject(createAbortError()))
    }

    options.signal?.addEventListener('abort', handleAbort)

    worker.onmessage = (event: MessageEvent<HashWorkerResponse>) => {
      const message = event.data
      if (message.type === 'progress') {
        if (!settled) options.onProgress?.(message.percent)
        return
      }
      if (message.type === 'done') {
        settle(() => resolve({ md5: message.md5, chunkMd5s: message.chunkMd5s }))
        return
      }
      settle(() => reject(new Error(message.message || '文件指纹计算失败')))
    }

    worker.onerror = () => {
      // Worker 加载失败（如浏览器策略限制）→ 主线程兜底重算
      if (settled) return
      settled = true
      options.signal?.removeEventListener('abort', handleAbort)
      worker.terminate()
      hashOnMainThread(file, options).then(resolve, reject)
    }

    const payload: HashWorkerRequest = { file, chunkSize: options.chunkSize }
    worker.postMessage(payload)
  })
}

function createWorker(): Worker | null {
  try {
    return new Worker(new URL('./md5.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    return null
  }
}

/** 主线程兜底方案：逐片读取 + 主动让出事件循环 */
async function hashOnMainThread(file: File, options: HashOptions): Promise<HashResult> {
  const { chunkSize, signal, onProgress } = options
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize))
  const chunkMd5s: string[] = new Array(totalChunks)
  const fileHasher = new SparkMD5.ArrayBuffer()

  let offset = 0
  while (offset < file.size) {
    if (signal?.aborted) throw createAbortError()

    const end = Math.min(offset + chunkSize, file.size)
    const buffer = await file.slice(offset, end).arrayBuffer()

    fileHasher.append(buffer)

    const chunkHasher = new SparkMD5.ArrayBuffer()
    chunkHasher.append(buffer)
    chunkMd5s[Math.floor(offset / chunkSize)] = chunkHasher.end()

    offset = end
    onProgress?.(Math.min(100, Math.round((offset / file.size) * 100)))

    // 让出主线程，避免长任务导致页面卡顿
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return { md5: fileHasher.end(), chunkMd5s }
}
