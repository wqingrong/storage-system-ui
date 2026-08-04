import { ref, watch } from 'vue'
import SparkMD5 from 'spark-md5'
import type { ChunkUploadReq, CheckUploadResp, MergeReq, MergeResp } from '@/entity/file-station'
import {
  fetchCheckChunkUpload,
  fetchChunkUpload,
  fetchMergeChunkUpload,
  fetchCancelChunkUpload,
  fetchNewFolder
} from '@/api/file-station-service'

// ============================================================
// 类型定义
// ============================================================

/** 单个上传文件的状态 */
export type UploadStatus =
  | 'pending' // 等待中
  | 'scanning' // 正在扫描文件夹
  | 'hashing' // 正在计算MD5
  | 'checking' // 正在检查已上传分片
  | 'uploading' // 正在上传分片
  | 'merging' // 正在合并分片
  | 'done' // 上传完成
  | 'error' // 上传失败
  | 'cancelled' // 已取消

export interface UploadFileItem {
  /** 唯一标识（内部生成） */
  uid: string
  /** 原始文件对象 */
  file: File
  /** 文件MD5（计算后赋值） */
  fileMd5: string
  /** 上传状态 */
  status: UploadStatus
  /** 整体进度 0-100 */
  progress: number
  /** 每个分片的进度 0-100 */
  chunkProgress: number[]
  /** 服务端已存在的分片下标 */
  uploadedChunks: number[]
  /** 总分片数 */
  totalChunks: number
  /** 已上传完成的字节数 */
  uploadedBytes: number
  /** 实时上传速率 (bytes/s)，基于最近采样窗口计算 */
  speed: number
  /** 上传挂载路径（currentPath 按 / 分割的第一段） */
  mountPath: string
  /** 错误信息 */
  errorMsg?: string
  /** 文件在文件夹内的相对路径（上传文件夹时使用），用于 UI 展示 */
  relativePath: string
  /** 是否为文件夹上传项（聚合进度） */
  isFolder?: boolean
  /** 文件夹内的文件总数 */
  fileCount?: number
  /** 文件夹内已完成文件数 */
  completedFiles?: number
}

/** 文件夹扫描后收集的待上传文件 */
export interface PendingFileEntry {
  file: File
  relativePath: string
}

/** 文件夹树节点（扫描阶段构建，上传阶段直接遍历） */
export interface FolderTreeNode {
  /** 文件夹名称 */
  name: string
  /** 相对于拖入根文件夹的路径，如 "MyDocs/sub1" */
  relativePath: string
  /** 该文件夹下的文件 */
  files: PendingFileEntry[]
  /** 子文件夹 */
  children: FolderTreeNode[]
  /** 服务端创建目录后的 ID（创建阶段回填） */
  serverId?: string
}

/** 扫描进度上下文（跨递归共享） */
interface ScanProgress {
  filesFound: number
  totalBytes: number
}

export interface UseChunkUploadOptions {
  /** 每个分片大小，默认 3MB */
  chunkSize?: number
  /** 并发上传数，默认 2 */
  concurrency?: number
  /** 当前工作区目录路径ID */
  targetPathId: string
  /** 当前工作区目录路径（用于文件夹创建） */
  currentPath?: string
  mountPath: string
}

// ============================================================
// Composable
// ============================================================

export function useChunkUpload(options: UseChunkUploadOptions) {
  const { chunkSize = 2 * 1024 * 1024, concurrency = 1 } = options

  /** 上传队列 */
  const uploadList = ref<UploadFileItem[]>([])
  /** 是否正在上传 */
  const isUploading = ref(false)
  /** 每个上传项的 AbortController，用于取消 */
  const abortControllers = new Map<string, AbortController>()
  /** 文件夹上传项 → 内部文件 uid 列表（用于取消时级联中止） */
  const folderChildren = new Map<string, string[]>()

  // ---- 上传状态持久化（页面刷新后恢复上传列表）-----------------------

  const STORAGE_KEY = 'chunk_upload_list'

  interface StoredUploadItem {
    uid: string
    fileName: string
    fileSize: number
    fileMd5: string
    status: UploadStatus
    progress: number
    totalChunks: number
    uploadedBytes: number
    mountPath: string
    errorMsg?: string
    relativePath: string
    isFolder?: boolean
    fileCount?: number
    completedFiles?: number
  }

  function serializeList(list: UploadFileItem[]): StoredUploadItem[] {
    return list.map((item) => ({
      uid: item.uid,
      fileName: item.file.name,
      fileSize: item.file.size,
      fileMd5: item.fileMd5,
      status: item.status,
      progress: item.progress,
      totalChunks: item.totalChunks,
      uploadedBytes: item.uploadedBytes,
      mountPath: item.mountPath || '',
      errorMsg: item.errorMsg,
      relativePath: item.relativePath || '',
      isFolder: item.isFolder,
      fileCount: item.fileCount,
      completedFiles: item.completedFiles
    }))
  }

  function deserializeList(stored: StoredUploadItem[]): UploadFileItem[] {
    const activeStatuses: UploadStatus[] = [
      'pending',
      'scanning',
      'hashing',
      'checking',
      'uploading',
      'merging'
    ]

    return stored.map((s) => {
      const wasActive = activeStatuses.includes(s.status)
      const item: UploadFileItem = {
        uid: s.uid,
        file: new File([], s.fileName, { type: '' }),
        fileMd5: s.fileMd5,
        // 刷新导致 JS 运行时销毁，File 对象和网络连接全部丢失，无法恢复 → 标记为 cancelled
        status: wasActive ? 'cancelled' : (s.status as UploadStatus),
        progress: wasActive ? 0 : s.progress,
        chunkProgress: [],
        uploadedChunks: [],
        totalChunks: s.totalChunks,
        uploadedBytes: 0,
        speed: 0,
        mountPath: s.mountPath,
        errorMsg: wasActive ? '页面刷新，上传已中断（请重新拖入文件上传）' : s.errorMsg,
        relativePath: s.relativePath
      }
      // 保留文件夹相关字段
      if (s.isFolder) {
        item.isFolder = true
        item.fileCount = s.fileCount
        item.completedFiles = s.completedFiles
        ;(item as any)._totalBytes = s.fileSize
      }
      // 保留原始文件大小（用于 UI 显示，因为占位 File 的 size 为 0）
      ;(item as any)._storedSize = s.fileSize
      return item
    })
  }

  /** 从 sessionStorage 恢复上传列表，同时收集需要通知服务端取消的中断项 fileMd5 */
  function restoreUploadList(): { items: UploadFileItem[]; activeMd5s: string[] } {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as StoredUploadItem[]
        if (Array.isArray(stored) && stored.length > 0) {
          const activeStatuses: UploadStatus[] = [
            'pending',
            'scanning',
            'hashing',
            'checking',
            'uploading',
            'merging'
          ]
          // 收集所有中断项的 fileMd5（用于通知服务端取消）
          const activeMd5s = stored
            .filter((s) => activeStatuses.includes(s.status) && s.fileMd5)
            .map((s) => s.fileMd5)
          return { items: deserializeList(stored), activeMd5s }
        }
      }
    } catch {
      // 解析失败则丢弃
    }
    return { items: [], activeMd5s: [] }
  }

  /** 持久化上传列表到 sessionStorage */
  function persistUploadList(list: UploadFileItem[]) {
    try {
      if (list.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializeList(list)))
      } else {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // 存储满则静默失败
    }
  }

  // 初始化：恢复上次未完成的上传记录，并通知服务端取消中断的上传
  const { items: restoredItems, activeMd5s: interruptedMd5s } = restoreUploadList()
  if (restoredItems.length > 0) {
    uploadList.value = restoredItems
  }
  // 异步通知服务端取消中断的上传（不阻塞页面加载）
  if (interruptedMd5s.length > 0) {
    interruptedMd5s.forEach((md5) => {
      fetchCancelChunkUpload({ fileMd5: md5, mountPath: options.mountPath }).catch(() => {
        // 取消通知失败不影响本地状态
      })
    })
  }

  // 监听上传列表变化，自动持久化（防抖 500ms）
  let persistTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    uploadList,
    (newVal) => {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => persistUploadList(newVal), 500)
    },
    { deep: true }
  )

  /**
   * 判断错误是否由主动取消引起
   */
  function isAbortError(err: any): boolean {
    return (
      err?.name === 'AbortError' ||
      err?.code === 'ERR_CANCELED' ||
      err?.message?.toLowerCase?.().includes('abort') ||
      err?.message?.toLowerCase?.().includes('cancel')
    )
  }

  // ---- 内部工具方法 -------------------------------------------------

  let uidCounter = 0
  function genUid(): string {
    return `upload_${Date.now()}_${++uidCounter}`
  }

  /**
   * 计算文件分片总数
   */
  function calcTotalChunks(fileSize: number): number {
    return Math.ceil(fileSize / chunkSize)
  }

  // ---- MD5 计算（增量式，兼容大文件）-------------------------------

  /**
   * 使用 spark-md5 增量计算文件 MD5
   */
  function computeFileMd5(file: File, onProgress?: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const readChunkSize = 2 * 1024 * 1024 // 每次读 2MB 用于 MD5 计算
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()
      let offset = 0

      fileReader.onload = (e) => {
        const arrayBuffer = e.target!.result as ArrayBuffer
        spark.append(arrayBuffer)
        offset += readChunkSize

        if (onProgress) {
          onProgress(Math.min(100, Math.round((offset / file.size) * 100)))
        }

        if (offset < file.size) {
          readNextSlice()
        } else {
          const hash = spark.end()
          resolve(hash)
        }
      }

      fileReader.onerror = () => {
        reject(new Error(`读取文件失败: ${file.name}`))
      }

      function readNextSlice() {
        const slice = file.slice(offset, offset + readChunkSize)
        fileReader.readAsArrayBuffer(slice)
      }

      readNextSlice()
    })
  }

  // ---- 文件切片 ----------------------------------------------------

  /**
   * 获取文件第 index 个分片的 Blob
   */
  function getChunkBlob(file: File, index: number): Blob {
    const start = index * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    return file.slice(start, end)
  }

  /**
   * 计算单个分片的 MD5
   */
  function computeChunkMd5(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()

      fileReader.onload = (e) => {
        spark.append(e.target!.result as ArrayBuffer)
        resolve(spark.end())
      }
      fileReader.onerror = () => reject(new Error('分片MD5计算失败'))

      fileReader.readAsArrayBuffer(blob)
    })
  }

  // ---- API 调用（伪代码，按实际接口对接）---------------------------

  /**
   * [伪代码] 校验上传：检查文件是否已上传完毕 / 哪些分片已上传
   * TODO: 替换为实际请求
   */
  async function checkUpload(fileMd5: string): Promise<CheckUploadResp> {
    // ====== 伪代码：请替换为实际接口调用 ======
    // console.log('mergeChunk: ', req)
    return fetchCheckChunkUpload({ fileMd5: fileMd5, totalChunks: 0, mountPath: options.mountPath })
  }

  /**
   * [伪代码] 上传单个分片
   * TODO: 替换为实际请求（注意使用 FormData 上传二进制分片）
   */
  async function uploadChunk(
    req: ChunkUploadReq,
    chunkBlob: Blob,
    signal?: AbortSignal
  ): Promise<void> {
    const formData = new FormData()
    formData.append('fileMd5', req.fileMd5)
    formData.append('chunkIndex', String(req.chunkIndex))
    formData.append('totalChunks', String(req.totalChunks))
    formData.append('chunkMd5', req.chunkMd5)
    formData.append('chunkFile', chunkBlob)
    formData.append('mountPath', req.mountPath)
    formData.append('targetPathId', req.targetPathId)
    await fetchChunkUpload(formData, signal)
    console.log('upload:', formData)
    console.log(`[uploadChunk] index=${req.chunkIndex}/${req.totalChunks}, md5=${req.chunkMd5}`)
  }

  /**
   * [伪代码] 合并分片
   * TODO: 替换为实际请求
   */
  async function mergeChunks(req: MergeReq): Promise<MergeResp> {
    // return {}
    console.log('mergeChunk: ', req)
    return fetchMergeChunkUpload(req)
  }

  // ---- 重试 & 延迟工具 --------------------------------------------

  /** 单个分片最大重试次数 */
  const MAX_CHUNK_RETRIES = 3
  /** 重试基础延迟 ms（指数退避：1s → 2s → 4s） */
  const RETRY_BASE_DELAY = 1000
  /** 分片启动间隔 ms，避免瞬时连接风暴 */
  const LAUNCH_STAGGER = 150

  /**
   * 带指数退避 + 随机抖动的延迟
   */
  function backoffDelay(attempt: number): number {
    const exponential = RETRY_BASE_DELAY * Math.pow(2, attempt)
    const jitter = Math.random() * 1000 // 0~1s 随机抖动
    return exponential + jitter
  }

  /**
   * 判断是否为可重试的网络错误
   * ERR_CONNECTION_RESET / ECONNRESET / ETIMEDOUT / 5xx 等都应重试
   */
  function isRetryableError(err: any): boolean {
    const msg = String(err?.message || err || '').toLowerCase()
    return (
      msg.includes('connection reset') ||
      msg.includes('err_connection_reset') ||
      msg.includes('econnreset') ||
      msg.includes('timeout') ||
      msg.includes('etimedout') ||
      msg.includes('network') ||
      msg.includes('abort') ||
      (err?.status && err.status >= 500) ||
      err?.code === 'ECONNRESET' ||
      err?.code === 'ETIMEDOUT' ||
      err?.code === 'ERR_NETWORK'
    )
  }

  /**
   * 更新上传速率（滚动 5 秒采样窗口 + 指数平滑）
   */
  function updateSpeed(item: UploadFileItem, chunkBytes: number): void {
    const now = Date.now()
    const samples: { bytes: number; time: number }[] = (item as any)._speedSamples || []
    samples.push({ bytes: chunkBytes, time: now })

    // 剔除 5 秒前的旧样本
    const cutoff = now - 5000
    const recent = samples.filter((s) => s.time > cutoff)
    ;(item as any)._speedSamples = recent

    if (recent.length >= 1) {
      const windowBytes = recent.reduce((sum, s) => sum + s.bytes, 0)
      const windowSeconds = (now - recent[0].time) / 1000
      const instantSpeed = windowSeconds > 0.1 ? windowBytes / windowSeconds : 0
      // 指数平滑：70% 新值 + 30% 旧值，避免速率数字跳动
      item.speed = item.speed > 0 ? item.speed * 0.3 + instantSpeed * 0.7 : instantSpeed
    }
  }

  // ---- 分片上传（带并发控制 + 重试 + 错峰）-----------------------

  /**
   * 上传文件的所有缺失分片（带并发控制、重试、错峰启动）
   */
  async function uploadMissingChunks(item: UploadFileItem): Promise<void> {
    const { totalChunks, uploadedChunks } = item

    // 计算需要上传的分片下标
    const missingChunks = Array.from({ length: totalChunks }, (_, i) => i).filter(
      (i) => !uploadedChunks.includes(i)
    )

    if (missingChunks.length === 0) {
      return
    }

    let activeCount = 0
    let cursor = 0
    let aborted = false

    return new Promise((resolve, reject) => {
      // 检查是否已被取消（status 会被 cancelUpload 异步修改）
      const isCancelled = () => (item.status as string) === 'cancelled'

      function tryLaunchOne() {
        // 双重检查：局部 aborted 标志 + 全局 cancel 状态
        if (aborted || isCancelled()) return
        if (cursor >= missingChunks.length && activeCount === 0) {
          resolve()
          return
        }

        // 只要还有空闲槽位且还有待上传分片，就启动
        while (activeCount < concurrency && cursor < missingChunks.length) {
          // 启动前再次检查是否已取消
          if (isCancelled()) return

          const chunkIndex = missingChunks[cursor++]
          activeCount++

          uploadSingleChunkWithRetry(item, chunkIndex)
            .then(() => {
              activeCount--
              // 分片完成后稍作延迟再启动下一个，错峰避免连接风暴
              if (!aborted && !isCancelled()) {
                setTimeout(tryLaunchOne, LAUNCH_STAGGER)
              }
            })
            .catch((err) => {
              aborted = true
              reject(err)
            })
        }
      }

      // 首批分片也错峰启动
      for (let i = 0; i < Math.min(concurrency, missingChunks.length); i++) {
        setTimeout(tryLaunchOne, i * LAUNCH_STAGGER)
      }
    })
  }

  /**
   * 上传单个分片（带自动重试 + 指数退避）
   */
  async function uploadSingleChunkWithRetry(
    item: UploadFileItem,
    chunkIndex: number
  ): Promise<void> {
    const chunkBlob = getChunkBlob(item.file, chunkIndex)
    const chunkMd5 = await computeChunkMd5(chunkBlob)

    const req: ChunkUploadReq = {
      fileMd5: item.fileMd5,
      chunkIndex,
      totalChunks: item.totalChunks,
      chunkMd5,
      chunkFile: true,
      mountPath: options.mountPath || '',
      targetPathId: options.targetPathId || ''
    }

    let lastError: any = null

    // 获取当前文件的 AbortSignal
    const signal = abortControllers.get(item.uid)?.signal

    for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt++) {
      try {
        await uploadChunk(req, chunkBlob, signal)

        // 上传成功 → 更新进度
        item.uploadedChunks.push(chunkIndex)
        item.uploadedBytes += chunkBlob.size
        item.chunkProgress[chunkIndex] = 100
        item.progress = Math.round((item.uploadedBytes / item.file.size) * 100)

        // 更新上传速率（滚动 5 秒采样窗口）
        updateSpeed(item, chunkBlob.size)
        return
      } catch (err: any) {
        lastError = err

        // 用户主动取消 — 不重试，直接终止
        if (isAbortError(err)) {
          throw err
        }

        // 不可重试的错误直接抛
        if (!isRetryableError(err)) {
          throw err
        }

        // 还有重试次数，等待后重试
        if (attempt < MAX_CHUNK_RETRIES) {
          const delay = backoffDelay(attempt)
          item.errorMsg = `分片 ${chunkIndex} 上传失败，${delay / 1000}s 后重试 (${attempt + 1}/${MAX_CHUNK_RETRIES})`
          console.warn(
            `[ChunkRetry] index=${chunkIndex} attempt=${attempt + 1}/${MAX_CHUNK_RETRIES} delay=${delay}ms`,
            err
          )
          await new Promise((r) => setTimeout(r, delay))
          item.errorMsg = undefined
        }
      }
    }

    // 所有重试耗尽
    throw new Error(
      `分片 ${chunkIndex} 上传失败（已重试 ${MAX_CHUNK_RETRIES} 次）: ${lastError?.message || lastError}`
    )
  }

  // ---- 主流程 ----------------------------------------------------

  /**
   * 处理单个文件的上传全流程：
   *   MD5计算 → 服务端校验 → 上传缺失分片 → 合并
   */
  async function processFile(item: UploadFileItem): Promise<void> {
    try {
      // 1. 计算文件 MD5
      item.status = 'hashing'
      const md5 = await computeFileMd5(item.file, (pct) => {
        // MD5 计算进度计入前 10% 整体进度
        item.progress = Math.round(pct * 0.1)
      })
      item.fileMd5 = md5
      item.totalChunks = calcTotalChunks(item.file.size)
      item.chunkProgress = new Array(item.totalChunks).fill(0)

      // 2. 校验服务端已上传分片
      item.status = 'checking'
      const checkResp: CheckUploadResp = await checkUpload(item.fileMd5)
      // 秒传：服务端已有完整文件
      if (checkResp.isUploaded) {
        item.progress = 100
        item.status = 'done'
        return
      }

      // 同步服务端已有的分片
      item.uploadedChunks = checkResp.uploadedChunks || []
      item.totalChunks = checkResp.totalChunks || item.totalChunks
      if (item.chunkProgress.length < item.totalChunks) {
        item.chunkProgress = new Array(item.totalChunks).fill(0)
      }
      // 已存在的分片标记完成
      for (const idx of item.uploadedChunks) {
        item.chunkProgress[idx] = 100
      }
      item.uploadedBytes =
        item.uploadedChunks.length * Math.min(chunkSize, item.file.size / item.totalChunks)
      item.progress = Math.round((item.uploadedBytes / item.file.size) * 100)

      // 3. 上传缺失分片
      item.status = 'uploading'
      // 初始化速率采样窗口
      ;(item as any)._speedSamples = []
      ;(item as any)._uploadStartTime = Date.now()
      await uploadMissingChunks(item)

      // 4. 合并分片（带重试）
      item.status = 'merging'
      // 文件夹内文件使用其父目录 ID，否则使用当前工作区目录
      const targetPathId = (item as any)._parentDirId || options.targetPathId

      let mergeResp: MergeResp | null = null

      for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt++) {
        try {
          mergeResp = await mergeChunks({
            fileMd5: item.fileMd5,
            fileName: item.file.name,
            totalChunks: item.totalChunks,
            targetPathId
          })
          break // 成功，退出重试循环
        } catch (err: any) {
          if (!isRetryableError(err) || attempt >= MAX_CHUNK_RETRIES) {
            throw err
          }
          const delay = backoffDelay(attempt)
          console.warn(
            `[MergeRetry] file=${item.file.name} attempt=${attempt + 1}/${MAX_CHUNK_RETRIES} delay=${delay}ms`,
            err
          )
          await new Promise((r) => setTimeout(r, delay))
        }
      }

      if (!mergeResp) {
        throw new Error('合并请求失败：未获取到响应')
      }

      if (mergeResp?.success) {
        item.progress = 100
        item.status = 'done'
      } else {
        throw new Error(mergeResp.msg || '合并失败')
      }
    } catch (err: any) {
      // 主动取消不标记为 error
      if (isAbortError(err) || item.status === 'cancelled') {
        item.status = 'cancelled'
        return
      }
      item.status = 'error'
      item.errorMsg = err.message || '上传失败'
      throw err
    }
  }

  /**
   * 将文件加入上传队列并开始处理
   */
  async function addFiles(files: File[]): Promise<void> {
    // 过滤大小为 0 的文件
    const validFiles = files.filter((f) => f.size > 0)

    // 创建上传项（先用普通对象入队，再从响应式数组中取回代理对象）
    const plainItems: UploadFileItem[] = validFiles.map((file) => {
      const uid = genUid()
      // 为每个文件创建独立的 AbortController
      abortControllers.set(uid, new AbortController())
      return {
        uid,
        file,
        fileMd5: '',
        status: 'pending' as UploadStatus,
        progress: 0,
        chunkProgress: [],
        uploadedChunks: [],
        totalChunks: 0,
        uploadedBytes: 0,
        speed: 0,
        mountPath: options.mountPath || '',
        relativePath: ''
      }
    })

    // push 到 ref 数组中，Vue 会自动将每个对象包装为响应式代理
    uploadList.value.push(...plainItems)

    // ⚠️ 关键：从响应式数组中取回代理对象，否则后续 mutation 不会触发 UI 更新
    const startIdx = uploadList.value.length - plainItems.length
    const reactiveItems = plainItems.map((_, i) => uploadList.value[startIdx + i])

    // 逐个处理（MD5 计算是 CPU 密集型，并行意义不大）
    for (const item of reactiveItems) {
      if (item.status === 'cancelled') continue
      try {
        await processFile(item)
      } catch {
        // 错误已记录在 item 上，继续处理下一个
      }
    }
  }

  // ---- 文件夹上传 --------------------------------------------------

  /**
   * 递归扫描文件夹树（纯前端遍历）
   *   - 构建 FolderTreeNode 树形结构
   *   - 统计文件数量与总大小
   *   - 支持通过 AbortController 取消
   *
   * @returns 当前目录对应的树节点（包含子节点和文件）
   */
  async function scanFolderTree(
    entry: FileSystemDirectoryEntry,
    parentPath: string,
    controller: AbortController,
    progress?: ScanProgress,
    onProgress?: (ctx: ScanProgress, currentPath: string) => void
  ): Promise<FolderTreeNode> {
    const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name

    // 批量读取目录下所有条目
    const allEntries: FileSystemEntry[] = []
    const reader = entry.createReader()

    await new Promise<void>((resolve, reject) => {
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (controller.signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'))
            return
          }
          if (batch.length === 0) {
            resolve()
          } else {
            allEntries.push(...batch)
            readBatch()
          }
        }, reject)
      }
      readBatch()
    })

    // 构建当前节点
    const node: FolderTreeNode = {
      name: entry.name,
      relativePath: currentPath,
      files: [],
      children: []
    }

    for (const childEntry of allEntries) {
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      if (childEntry.isDirectory) {
        // 递归扫描子目录 → 挂到 children 上
        const childNode = await scanFolderTree(
          childEntry as FileSystemDirectoryEntry,
          currentPath,
          controller,
          progress,
          onProgress
        )
        node.children.push(childNode)
      } else if (childEntry.isFile) {
        // 文件直接挂到当前节点的 files 上
        const fileEntry = childEntry as FileSystemFileEntry
        const file: File = await new Promise((resolve, reject) => {
          fileEntry.file(resolve, reject)
        })
        // 跳过大小为 0 的空文件
        if (file.size === 0) continue
        node.files.push({ file, relativePath: currentPath })
        if (progress) {
          progress.filesFound++
          progress.totalBytes += file.size
        }
      }

      // 每处理完一个条目就通知进度
      if (onProgress && progress) {
        onProgress(progress, currentPath)
      }
    }

    return node
  }

  // ---- 树遍历工具函数 ------------------------------------------------

  /** 递归统计树中文件夹总数（含根节点） */
  function countAllFolders(node: FolderTreeNode): number {
    let count = 1
    for (const child of node.children) {
      count += countAllFolders(child)
    }
    return count
  }

  /** 深度优先遍历树，将所有文件收集为平铺上传队列 */
  function collectUploadQueue(
    node: FolderTreeNode,
    fallbackServerId: string,
    out: Array<{ file: PendingFileEntry; parentServerId: string }>
  ): void {
    const serverId = node.serverId || fallbackServerId
    for (const f of node.files) {
      out.push({ file: f, parentServerId: serverId })
    }
    for (const child of node.children) {
      collectUploadQueue(child, serverId, out)
    }
  }

  /**
   * 遍历文件夹树，在服务端逐层创建目录
   *   - BFS 保证父目录先于子目录创建
   *   - 创建成功后将 serverId 回填到节点上
   *   - 单个文件夹创建失败不影响其他文件夹（子文件使用父级 serverId 兜底）
   */
  async function createFolderTree(
    rootNode: FolderTreeNode,
    baseParentId: string,
    basePath: string,
    controller: AbortController
  ): Promise<void> {
    // BFS 队列：[节点, 父目录服务端路径, 兜底 serverId]
    const queue: Array<{ node: FolderTreeNode; fatherPath: string; fallbackServerId: string }> = [
      { node: rootNode, fatherPath: basePath, fallbackServerId: baseParentId }
    ]

    while (queue.length > 0) {
      if (controller.signal.aborted) break

      const { node, fatherPath, fallbackServerId } = queue.shift()!

      try {
        const res: any = await fetchNewFolder({
          fatherPath,
          name: node.name,
          loading: 'close',
          isSkip: true
        })
        if (res?.id) {
          node.serverId = res.id
        }
      } catch (err: any) {
        if (isAbortError(err)) throw err
        console.warn(`[CreateFolder] 创建失败，跳过: ${node.relativePath}`, err)
      }

      // 子节点的 fatherPath = basePath + "/" + 当前节点的 relativePath
      const childFatherPath = `${basePath}/${node.relativePath}`
      // 如果当前节点创建成功，子节点用它的 serverId；否则沿用父级兜底
      const childFallbackId = node.serverId || fallbackServerId

      for (const child of node.children) {
        queue.push({ node: child, fatherPath: childFatherPath, fallbackServerId: childFallbackId })
      }
    }
  }

  /**
   * 上传文件夹（树形结构驱动，三步走）
   *   Phase 1: 前端扫描 → 构建 FolderTreeNode 树
   *   Phase 2: 遍历树创建服务端目录 → 回填 serverId
   *   Phase 3: 遍历树上传所有文件 → 使用节点上的 serverId
   */
  async function addFolderFromEntry(
    folderEntry: FileSystemDirectoryEntry,
    baseParentId: string,
    basePath: string
  ): Promise<void> {
    // → 创建扫描进度项
    const scanUid = genUid()
    const scanController = new AbortController()
    abortControllers.set(scanUid, scanController)

    const scanItem: UploadFileItem = {
      uid: scanUid,
      file: new File([], folderEntry.name, { type: '' }),
      fileMd5: '',
      status: 'scanning',
      progress: 0,
      chunkProgress: [],
      uploadedChunks: [],
      totalChunks: 0,
      uploadedBytes: 0,
      speed: 0,
      relativePath: folderEntry.name,
      mountPath: options.mountPath
    }

    uploadList.value.push(scanItem)
    const scanIdx = uploadList.value.length - 1
    const reactiveScanItem = uploadList.value[scanIdx]

    try {
      // ---------- Phase 1: 前端扫描 → 构建树 ----------
      const progress: ScanProgress = { filesFound: 0, totalBytes: 0 }
      const rootNode = await scanFolderTree(
        folderEntry,
        '',
        scanController,
        progress,
        (ctx, currentPath) => {
          reactiveScanItem.progress = Math.min(
            99,
            Math.round((ctx.filesFound / Math.max(ctx.filesFound + 5, 10)) * 100)
          )
          reactiveScanItem.errorMsg = `已发现 ${ctx.filesFound} 个文件，当前: ${currentPath}`
          reactiveScanItem.totalChunks = ctx.filesFound
        }
      )

      if (progress.filesFound === 0) {
        reactiveScanItem.status = 'done'
        reactiveScanItem.errorMsg = '文件夹为空'
        return
      }

      // ---------- Phase 2: 遍历树创建服务端目录 ----------
      const totalFolders = countAllFolders(rootNode)
      reactiveScanItem.errorMsg = `正在创建 ${totalFolders} 个文件夹...`
      await createFolderTree(rootNode, baseParentId, basePath, scanController)

      // ---------- Phase 3: 遍历树收集上传队列 ----------
      const uploadQueue: Array<{ file: PendingFileEntry; parentServerId: string }> = []
      collectUploadQueue(rootNode, baseParentId, uploadQueue)

      // 过渡：文件夹扫描项 → 聚合进度项
      reactiveScanItem.status = 'uploading'
      reactiveScanItem.isFolder = true
      reactiveScanItem.fileCount = uploadQueue.length
      reactiveScanItem.completedFiles = 0
      reactiveScanItem.progress = 0
      reactiveScanItem.errorMsg = undefined
      ;(reactiveScanItem as any)._totalBytes = progress.totalBytes

      // ---------- Phase 4: 逐个上传文件（内部处理，不加入 uploadList）----------
      const childUids: string[] = []
      let cumulativeBytes = 0

      for (let fi = 0; fi < uploadQueue.length; fi++) {
        if ((reactiveScanItem.status as string) !== 'cancelled') {
          const { file: pe, parentServerId } = uploadQueue[fi]
          const uid = genUid()
          childUids.push(uid)
          abortControllers.set(uid, new AbortController())
          const internalItem: UploadFileItem = {
            uid,
            file: pe.file,
            fileMd5: '',
            status: 'pending',
            progress: 0,
            chunkProgress: [],
            uploadedChunks: [],
            totalChunks: 0,
            uploadedBytes: 0,
            speed: 0,
            relativePath: pe.relativePath,
            mountPath: options.mountPath
          }
          ;(internalItem as any)._parentDirId = parentServerId
          try {
            await processFile(internalItem)
          } catch {
            // 单个文件失败不阻塞后续
          }
          cumulativeBytes += pe.file.size
          reactiveScanItem.completedFiles = fi + 1
          reactiveScanItem.progress =
            progress.totalBytes > 0 ? Math.round((cumulativeBytes / progress.totalBytes) * 100) : 0
        } else {
          break
        }
      }

      // 注册父子关系（用于取消时级联中止）
      folderChildren.set(scanUid, childUids)

      // 最终状态
      if ((reactiveScanItem.status as string) !== 'cancelled') {
        reactiveScanItem.status = 'done'
        reactiveScanItem.progress = 100
      }
    } catch (err: any) {
      if (isAbortError(err)) {
        reactiveScanItem.status = 'cancelled'
      } else {
        reactiveScanItem.status = 'error'
        reactiveScanItem.errorMsg = err.message || '文件夹扫描失败'
      }
    } finally {
      abortControllers.delete(scanUid)
    }
  }

  /**
   * 批量添加文件（从拖拽事件，兼容文件夹）
   */
  async function addFilesFromDrop(event: DragEvent): Promise<void> {
    const items = event.dataTransfer?.items
    if (!items || items.length === 0) return

    isUploading.value = true

    try {
      const regularFiles: File[] = []
      const folderEntries: FileSystemDirectoryEntry[] = []

      // 分类：普通文件 vs 文件夹
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry?.()
          if (entry?.isDirectory) {
            folderEntries.push(entry as FileSystemDirectoryEntry)
          } else {
            const file = item.getAsFile()
            if (file && file.size > 0) regularFiles.push(file)
          }
        }
      }

      // 处理普通文件
      if (regularFiles.length > 0) {
        await addFiles(regularFiles)
      }

      // 处理文件夹
      const baseParentId = options.targetPathId
      const basePath = options.currentPath || ''

      for (const folderEntry of folderEntries) {
        await addFolderFromEntry(folderEntry, baseParentId, basePath)
      }
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 取消某个文件的上传（中止前端请求 + 通知服务端）
   */
  function cancelUpload(uid: string): void {
    const idx = uploadList.value.findIndex((item) => item.uid === uid)
    if (idx === -1) return
    const item = uploadList.value[idx]
    if (item.status === 'done' || item.status === 'error') return

    // 1. ⚠️ 必须先标记取消，让 tryLaunchOne 立即停止排期新分片
    item.status = 'cancelled'

    // 2. 级联中止文件夹内所有内部文件的上传
    const children = folderChildren.get(uid)
    if (children) {
      for (const childUid of children) {
        const childCtrl = abortControllers.get(childUid)
        if (childCtrl) {
          childCtrl.abort()
          abortControllers.delete(childUid)
        }
      }
      folderChildren.delete(uid)
    }

    // 3. abort 当前项的请求
    const controller = abortControllers.get(uid)
    if (controller) {
      controller.abort()
      abortControllers.delete(uid)
    }

    // 4. 通知服务端取消（清理服务端已上传的分片）
    if (item.fileMd5) {
      fetchCancelChunkUpload({ fileMd5: item.fileMd5, mountPath: options.mountPath }).catch(() => {
        // 取消通知失败不影响本地状态
      })
    }
  }

  /**
   * 移除已完成的文件项
   */
  function removeItem(uid: string): void {
    // 清理文件夹子项
    const children = folderChildren.get(uid)
    if (children) {
      for (const childUid of children) {
        abortControllers.delete(childUid)
      }
      folderChildren.delete(uid)
    }
    abortControllers.delete(uid)

    const idx = uploadList.value.findIndex((item) => item.uid === uid)
    if (idx !== -1) {
      uploadList.value.splice(idx, 1)
    }
  }

  /**
   * 清除所有已完成/取消/失败的文件
   */
  function clearFinished(): void {
    uploadList.value = uploadList.value.filter(
      (item) =>
        item.status === 'pending' || item.status === 'hashing' || item.status === 'uploading'
    )
  }

  /**
   * 重试失败的文件
   */
  async function retryUpload(uid: string): Promise<void> {
    const item = uploadList.value.find((i) => i.uid === uid)
    if (!item || item.status !== 'error') return
    item.status = 'pending'
    item.errorMsg = undefined
    try {
      await processFile(item)
    } catch {
      // 错误已记录
    }
  }

  /**
   * 动态更新目标目录路径ID（用户切换目录时调用）
   */
  function setTargetPathId(id: string): void {
    options.targetPathId = id
  }

  /**
   * 动态更新当前工作区路径（用于文件夹创建）
   */
  function setCurrentPath(path: string): void {
    options.currentPath = path
    options.mountPath = `/${(path || '').split('/')[1]}`
  }

  return {
    // 状态
    uploadList,
    isUploading,

    // 操作
    addFiles,
    addFilesFromDrop,
    cancelUpload,
    removeItem,
    clearFinished,
    retryUpload,
    setTargetPathId,
    setCurrentPath,

    // 工具（暴露给外部调试/自定义）
    computeFileMd5,
    computeChunkMd5,
    getChunkBlob,
    calcTotalChunks
  }
}
