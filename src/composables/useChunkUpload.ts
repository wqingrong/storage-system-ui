/**
 * 文件分片上传（重构版 · 全局单例）
 *
 * 设计要点：
 *   1. 【全局单例】状态定义在模块作用域，只创建一次。离开 File Station 页面（组件卸载）不会中止上传，
 *      上传在后台继续，任意页面都能看到进度面板。
 *   2. 任务队列调度：任何时刻最多 N 个任务并行（默认 2），其余排队，避免浏览器连接/内存被吃满
 *   3. 每个任务持有独立 AbortController，取消时立即 abort 所有在途请求并停止派发新请求
 *   4. 任何一个接口返回错误 → 当前任务立刻终止（不重试、不继续发分片），错误信息透传后端 message
 *   5. 不做任何本地持久化：浏览器刷新/关闭页签时 abortAll 立即中止所有在途请求，不会有"幽灵上传"
 *   6. 文件指纹在 Web Worker 中计算，一次顺序读同时得出文件 MD5 与全部分片 MD5，不阻塞 UI
 */
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchCheckChunkUpload,
  fetchChunkUpload,
  fetchMergeChunkUpload,
  fetchNewFolder
} from '@/api/file-station-service'
import type { CheckUploadResp, MergeResp } from '@/entity/file-station'
import { hashFile } from '@/utils/upload/hash'

// ============================================================
// 类型定义
// ============================================================

export type UploadStatus =
  | 'queued' // 排队等待
  | 'scanning' // 扫描文件夹
  | 'creating' // 创建目录
  | 'hashing' // 计算文件指纹
  | 'checking' // 校验断点
  | 'uploading' // 上传分片
  | 'merging' // 合并分片
  | 'done'
  | 'error'
  | 'cancelled'

/** 上传任务（文件 or 文件夹） */
export interface UploadTask {
  uid: string
  kind: 'file' | 'folder'
  /** 展示名称 */
  name: string
  /** 总字节数（文件夹扫描完成后回填） */
  size: number
  status: UploadStatus
  /** 0-100 */
  progress: number
  /** bytes/s */
  speed: number
  uploadedBytes: number
  errorMsg?: string
  /** 目标目录 ID（后端为加密后的路径字符串） */
  targetPathId: string
  /** 挂载点路径，如 /data */
  mountPath: string
  fileMd5: string
  totalChunks: number
  uploadedChunkCount: number
  /** 文件夹：文件总数 */
  fileCount?: number
  /** 文件夹：已完成文件数 */
  completedFiles?: number
  /** 文件夹：当前处理中的文件 */
  currentFile?: string
  createdAt: number
}

export interface UploadStats {
  total: number
  /** 未结束（含排队）的任务数 */
  active: number
  queued: number
  done: number
  error: number
  cancelled: number
  running: number
  overallPercent: number
}

export interface UseChunkUploadOptions {
  /** 分片大小，默认 5MB */
  chunkSize?: number
  /** 同时执行的任务数，默认 2 */
  concurrency?: number
  /** 单个任务内并行的分片数，默认 2 */
  chunkConcurrency?: number
  /** 当前目标目录 ID */
  targetPathId?: string
  /** 当前目录完整路径 */
  currentPath?: string
  /** 当前挂载点路径 */
  mountPath?: string
}

/** 上传目标 */
export interface UploadTarget {
  /** 目录 ID（后端加密路径） */
  id: string
  /** 目录完整路径，如 /data/demo */
  path: string
}

/** 文件夹任务创建出的目录信息（供左侧目录树增量插入节点） */
export interface FolderCreatedEvent {
  /** 父目录 ID（后端的加密路径），即任务上传目标 */
  parentId: string
  /** 父目录明文路径 */
  parentPath: string
  /** 新建目录 ID */
  id: string
  /** 新建目录明文路径 */
  path: string
  /** 目录名 */
  name: string
}

/** 任务运行时数据（不放进响应式对象，避免 File / AbortController 被代理） */
interface TaskRuntime {
  controller: AbortController
  file?: File
  entry?: FileSystemDirectoryEntry
  /** 分片 MD5，下标与分片下标一致 */
  chunkMd5s: string[]
  /** 速率采样窗口 */
  samples: Array<{ bytes: number; time: number }>
  /** 用户主动取消 */
  cancelled: boolean
  /** 已停止（取消或出错），所有循环据此退出 */
  stopped: boolean
  /** 文件夹上传的根父路径（明文路径） */
  basePath: string
}

/** 文件夹树节点 */
interface FolderNode {
  name: string
  files: Array<{ file: File; relPath: string }>
  children: FolderNode[]
  dirId?: string
  dirPath?: string
}

interface UploadFileContext {
  task: UploadTask
  rt: TaskRuntime
  file: File
  targetPathId: string
  /** 该文件在任务总进度中的起始字节偏移（文件夹任务使用） */
  offset: number
}

/** 内部信号：任务已停止（取消或异常） */
class TaskStoppedError extends Error {
  constructor() {
    super('任务已停止')
    this.name = 'TaskStoppedError'
  }
}

// ============================================================
// 常量
// ============================================================

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024
const DEFAULT_CONCURRENCY = 2
const DEFAULT_CHUNK_CONCURRENCY = 2
/** 速率统计窗口 */
const SPEED_WINDOW = 4000
/**
 * UI 刷新节流间隔（毫秒）。
 * 文件夹里成百上千个小文件时，"计算指纹 / 校验 / 上传 / 合并"会以毫秒级频率变化，
 * 逐次推送响应式更新会让面板持续重渲染。这里合并成固定频率刷新。
 */
const UI_FLUSH_INTERVAL = 250

const TERMINAL_STATUS: UploadStatus[] = ['done', 'error', 'cancelled']

function isTerminal(status: UploadStatus): boolean {
  return TERMINAL_STATUS.includes(status)
}

/** 由目录路径推导挂载点（与后端 merge 时的推导逻辑保持一致） */
export function resolveMountPath(path: string): string {
  const segments = (path || '').split('/').filter(Boolean)
  return segments.length > 0 ? `/${segments[0]}` : ''
}

// ============================================================
// Store 实现
// ============================================================

function createUploadStore(initial: UseChunkUploadOptions) {
  const config = {
    chunkSize: initial.chunkSize || DEFAULT_CHUNK_SIZE,
    concurrency: Math.max(1, initial.concurrency || DEFAULT_CONCURRENCY),
    chunkConcurrency: Math.max(1, initial.chunkConcurrency || DEFAULT_CHUNK_CONCURRENCY)
  }

  /** 当前上传目标（由页面在入队前设置，入队时快照到任务上） */
  const target: { id: string; path: string; mountPath: string } = {
    id: initial.targetPathId || '',
    path: initial.currentPath || '',
    mountPath: initial.mountPath || resolveMountPath(initial.currentPath || '')
  }

  /**
   * 任务列表（权威数据）。
   * 刻意保持**非响应式**：上传过程中进度/状态每秒可能变更上百次，
   * 如果直接作为响应式数据源，会让整个任务面板持续重渲染（文件夹里大量小文件时尤其明显）。
   * 所有读写都走这里，再由 tasks 镜像按固定频率同步给 UI。
   */
  const allTasks: UploadTask[] = []
  /** UI 数据源：allTasks 的节流快照 */
  const tasks = ref<UploadTask[]>([])
  /** 正在执行的任务数 */
  const running = ref(0)

  /** 节流定时器 */
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  /** 立即同步一次 UI（离散操作与终态使用，保证操作反馈不延迟） */
  function flushNow(): void {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    tasks.value = allTasks.map((task) => ({ ...task }))
  }

  /** 标脏：把短时间内的多次变更合并成一次刷新 */
  function markDirty(): void {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      flushTimer = null
      tasks.value = allTasks.map((task) => ({ ...task }))
    }, UI_FLUSH_INTERVAL)
  }

  /** 运行时数据 */
  const runtime = new Map<string, TaskRuntime>()
  /** 排队等待的任务 uid */
  const pendingQueue: string[] = []
  /** 目录创建完成回调（页面据此把新目录插入左侧树） */
  const folderCreatedListeners = new Set<(event: FolderCreatedEvent) => void>()

  /** 订阅「目录已创建」事件，返回取消订阅函数 */
  function onFolderCreated(listener: (event: FolderCreatedEvent) => void): () => void {
    folderCreatedListeners.add(listener)
    return () => {
      folderCreatedListeners.delete(listener)
    }
  }

  function emitFolderCreated(event: FolderCreatedEvent): void {
    folderCreatedListeners.forEach((listener) => {
      try {
        listener(event)
      } catch {
        // 单个订阅者异常不影响上传主流程
      }
    })
  }

  let uidSeed = 0
  function genUid(): string {
    uidSeed += 1
    return `upload_${Date.now()}_${uidSeed}`
  }

  // ---------- 基础工具 ----------

  function findTask(uid: string): UploadTask | undefined {
    return allTasks.find((item) => item.uid === uid)
  }

  function createRuntime(partial: Partial<TaskRuntime> = {}): TaskRuntime {
    return {
      controller: new AbortController(),
      chunkMd5s: [],
      samples: [],
      cancelled: false,
      stopped: false,
      basePath: '',
      ...partial
    }
  }

  /** 任务是否仍在运行，否则抛出停止信号 */
  function assertRunning(rt: TaskRuntime): void {
    if (rt.stopped || rt.controller.signal.aborted) throw new TaskStoppedError()
  }

  function setStage(task: UploadTask, status: UploadStatus): void {
    if (task.status !== 'cancelled') task.status = status
    markDirty()
  }

  function calcProgress(bytes: number, total: number): number {
    if (!total) return 0
    return Math.max(0, Math.min(100, Math.round((bytes / total) * 100)))
  }

  function chunkBytes(fileSize: number, chunkSize: number, index: number): number {
    const start = index * chunkSize
    return Math.max(0, Math.min(chunkSize, fileSize - start))
  }

  function toErrorMessage(err: any): string {
    if (!err) return '上传异常'
    if (typeof err === 'string') return err
    if (err.message) return String(err.message)
    return '上传异常'
  }

  function pushSample(rt: TaskRuntime, bytes: number): void {
    const now = Date.now()
    rt.samples.push({ bytes, time: now })
    const cutoff = now - SPEED_WINDOW
    rt.samples = rt.samples.filter((sample) => sample.time >= cutoff)
  }

  function updateSpeed(task: UploadTask, rt: TaskRuntime): void {
    const samples = rt.samples
    if (samples.length < 2) return
    const bytes = samples.reduce((sum, sample) => sum + sample.bytes, 0)
    const seconds = (samples[samples.length - 1]!.time - samples[0]!.time) / 1000
    if (seconds <= 0.2) return
    const instant = bytes / seconds
    task.speed = task.speed > 0 ? task.speed * 0.4 + instant * 0.6 : instant
    markDirty()
  }

  // ---------- 队列调度 ----------

  /**
   * 调度：按进入顺序取任务执行，同时最多 config.concurrency 个
   */
  function schedule(): void {
    while (running.value < config.concurrency && pendingQueue.length > 0) {
      const uid = pendingQueue.shift()!
      const task = findTask(uid)
      const rt = runtime.get(uid)

      // 已取消 / 已开始过的任务直接跳过
      if (!task || !rt || rt.cancelled || task.status !== 'queued') continue

      running.value += 1
      void execute(task, rt).finally(() => {
        running.value -= 1
        schedule()
      })
    }
  }

  /** 执行一个任务，任何异常都在这里收敛，不会抛出 */
  async function execute(task: UploadTask, rt: TaskRuntime): Promise<void> {
    try {
      if (task.kind === 'folder') {
        await runFolderTask(task, rt)
      } else {
        await runFileTask(task, rt)
      }

      if (task.status !== 'cancelled') {
        task.status = 'done'
        task.progress = 100
        task.speed = 0
        task.errorMsg = undefined
        // 成功后释放文件引用，避免长会话下把已上传的文件一直留在内存里
        // （失败的任务保留引用，保证「重试」可用）
        rt.file = undefined
        rt.entry = undefined
        rt.chunkMd5s = []
        rt.samples = []
      }
    } catch (err) {
      task.speed = 0

      // 用户取消：静默收尾
      if (rt.cancelled) {
        task.status = 'cancelled'
        return
      }

      // 任何错误（含后端返回的错误信息）→ 当前任务立即终止
      task.status = 'error'
      task.errorMsg = toErrorMessage(err)
      ElMessage.error({
        message: `「${task.name}」上传失败：${task.errorMsg}`,
        grouping: true
      })
    } finally {
      if (isTerminal(task.status)) task.speed = 0
      // 终态立即同步，不受节流窗口影响
      flushNow()
    }
  }

  // ---------- 单文件上传流程 ----------

  async function runFileTask(task: UploadTask, rt: TaskRuntime): Promise<void> {
    const file = rt.file
    if (!file) throw new Error('文件对象已失效，请重新选择文件')

    await uploadFile({
      task,
      rt,
      file,
      targetPathId: task.targetPathId,
      offset: 0
    })
  }

  /**
   * 单个文件完整流程：指纹 → 校验断点 → 上传缺失分片 → 合并
   */
  async function uploadFile(ctx: UploadFileContext): Promise<void> {
    const { task, rt, file, targetPathId, offset } = ctx
    const signal = rt.controller.signal
    const chunkSize = config.chunkSize

    // ---- 1. 计算文件指纹（Worker 内） ----
    setStage(task, 'hashing')
    task.currentFile = file.name

    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize))
    task.totalChunks = totalChunks

    const hashResult = await hashFile(file, {
      chunkSize,
      signal,
      onProgress: (percent) => {
        if (rt.stopped) return
        const bytes = offset + (file.size * percent) / 100
        task.progress = Math.min(99, calcProgress(bytes, task.size))
        markDirty()
      }
    })
    assertRunning(rt)

    rt.chunkMd5s = hashResult.chunkMd5s
    task.fileMd5 = hashResult.md5

    // ---- 2. 校验服务端已上传分片 ----
    setStage(task, 'checking')
    const checkResp: CheckUploadResp | null = await fetchCheckChunkUpload(
      { fileMd5: hashResult.md5, totalChunks, mountPath: task.mountPath },
      signal
    )
    assertRunning(rt)

    // 秒传（后端已存在完整文件）
    if (checkResp?.isUploaded) {
      task.uploadedBytes = offset + file.size
      task.progress = calcProgress(offset + file.size, task.size)
      markDirty()
      return
    }

    const uploadedSet = new Set<number>(
      Array.isArray(checkResp?.uploadedChunks) ? checkResp.uploadedChunks : []
    )

    // ---- 3. 上传缺失分片 ----
    let fileUploaded = 0
    for (const index of uploadedSet) {
      fileUploaded += chunkBytes(file.size, chunkSize, index)
    }
    task.uploadedChunkCount = uploadedSet.size
    task.uploadedBytes = offset + fileUploaded
    task.progress = Math.min(99, calcProgress(offset + fileUploaded, task.size))

    const missing: number[] = []
    for (let index = 0; index < totalChunks; index++) {
      if (!uploadedSet.has(index)) missing.push(index)
    }

    if (missing.length > 0) {
      setStage(task, 'uploading')
      await uploadChunks(ctx, missing, (bytes) => {
        fileUploaded += bytes
        task.uploadedChunkCount += 1
        task.uploadedBytes = offset + fileUploaded
        task.progress = Math.min(99, calcProgress(offset + fileUploaded, task.size))
        markDirty()
      })
    }

    assertRunning(rt)

    // ---- 4. 合并分片 ----
    setStage(task, 'merging')
    const mergeResp: MergeResp | null = await fetchMergeChunkUpload(
      { fileMd5: hashResult.md5, fileName: file.name, totalChunks, targetPathId },
      signal
    )
    assertRunning(rt)

    if (!mergeResp || mergeResp.success !== true) {
      throw new Error(mergeResp?.msg || '分片合并失败')
    }

    task.uploadedBytes = offset + file.size
    task.progress = calcProgress(offset + file.size, task.size)
    markDirty()
  }

  /**
   * 上传缺失分片：固定并发槽位，任何一片失败立即终止整个任务
   */
  async function uploadChunks(
    ctx: UploadFileContext,
    missing: number[],
    onChunkDone: (bytes: number) => void
  ): Promise<void> {
    const { rt } = ctx
    const limit = Math.min(config.chunkConcurrency, missing.length)
    let cursor = 0

    const runner = async (): Promise<void> => {
      while (true) {
        assertRunning(rt)
        const current = cursor
        cursor += 1
        if (current >= missing.length) return

        await uploadOneChunk(ctx, missing[current]!, onChunkDone)
        // 让出事件循环，保证取消信号能被及时感知。
        // 注意：隐藏标签页里 setTimeout 最小被节流到 1s，会让上传速度骤降，
        // 而后台上传本身不需要"可交互性"，因此仅在页面可见时做宏任务让出。
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }
    }

    const runners: Promise<void>[] = []
    for (let i = 0; i < limit; i++) runners.push(runner())

    try {
      await Promise.all(runners)
    } catch (err) {
      // 任一失败：立刻中止该任务所有在途请求，不再派发新分片
      rt.stopped = true
      rt.controller.abort()
      throw err
    }
  }

  async function uploadOneChunk(
    ctx: UploadFileContext,
    index: number,
    onChunkDone: (bytes: number) => void
  ): Promise<void> {
    const { task, rt, file } = ctx
    const chunkSize = config.chunkSize
    const start = index * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const blob = file.slice(start, end)

    const formData = new FormData()
    formData.append('fileMd5', task.fileMd5)
    formData.append('chunkIndex', String(index))
    formData.append('totalChunks', String(task.totalChunks))
    formData.append('chunkMd5', rt.chunkMd5s[index] || '')
    formData.append('chunkFile', blob, `${task.fileMd5}_${index}`)
    formData.append('mountPath', task.mountPath)
    formData.append('targetPathId', task.targetPathId)

    await fetchChunkUpload(formData, rt.controller.signal)
    assertRunning(rt)

    onChunkDone(blob.size)
    pushSample(rt, blob.size)
    updateSpeed(task, rt)
  }

  // ---------- 文件夹上传 ----------

  async function runFolderTask(task: UploadTask, rt: TaskRuntime): Promise<void> {
    const entry = rt.entry
    if (!entry) throw new Error('文件夹对象已失效，请重新拖入文件夹')

    // ---- 1. 扫描目录树 ----
    setStage(task, 'scanning')
    const root: FolderNode = { name: entry.name, files: [], children: [] }
    const scanStats = { files: 0, bytes: 0 }

    await scanFolderTree(entry, rt, root, scanStats, (current) => {
      task.fileCount = scanStats.files
      task.size = scanStats.bytes
      task.currentFile = current
      markDirty()
    })
    assertRunning(rt)

    if (scanStats.files === 0) throw new Error('文件夹内没有可上传的文件')

    task.size = scanStats.bytes
    task.fileCount = scanStats.files
    markDirty()

    // ---- 2. 逐层创建目录 ----
    setStage(task, 'creating')
    await createFolderTree(root, rt, (current) => {
      task.currentFile = current
      markDirty()
    })
    assertRunning(rt)

    // 通知外部：根目录已建好（用于左侧目录树增量插入节点）
    if (root.dirId && root.dirPath) {
      emitFolderCreated({
        parentId: task.targetPathId,
        parentPath: rt.basePath,
        id: root.dirId,
        path: root.dirPath,
        name: root.name
      })
    }

    // ---- 3. 展平上传队列 ----
    const jobs: Array<{ file: File; dirId: string }> = []
    const walk = (node: FolderNode): void => {
      for (const item of node.files) jobs.push({ file: item.file, dirId: node.dirId! })
      node.children.forEach(walk)
    }
    walk(root)

    // ---- 4. 逐个上传（同一任务内串行，避免与其它任务争抢资源） ----
    let offset = 0
    task.completedFiles = 0

    for (let i = 0; i < jobs.length; i++) {
      assertRunning(rt)
      const job = jobs[i]!

      await uploadFile({
        task,
        rt,
        file: job.file,
        targetPathId: job.dirId,
        offset
      })

      offset += job.file.size
      task.completedFiles = i + 1
      task.uploadedBytes = offset
      task.progress = Math.min(99, calcProgress(offset, task.size))
      markDirty()
    }
  }

  /** 递归扫描目录（readEntries 必须循环调用直到返回空数组） */
  async function scanFolderTree(
    entry: FileSystemDirectoryEntry,
    rt: TaskRuntime,
    node: FolderNode,
    stats: { files: number; bytes: number },
    onProgress: (current: string) => void
  ): Promise<void> {
    const reader = entry.createReader()

    while (true) {
      assertRunning(rt)
      const batch = await readEntries(reader)
      if (batch.length === 0) break

      for (const child of batch) {
        assertRunning(rt)

        if (child.isDirectory) {
          const subNode: FolderNode = { name: child.name, files: [], children: [] }
          node.children.push(subNode)
          await scanFolderTree(child as FileSystemDirectoryEntry, rt, subNode, stats, onProgress)
        } else if (child.isFile) {
          const file = await readEntryFile(child as FileSystemFileEntry)
          if (!file || file.size === 0) continue
          node.files.push({ file, relPath: node.name })
          stats.files += 1
          stats.bytes += file.size
          onProgress(file.name)
        }
      }
    }
  }

  /** 广度优先创建目录，父目录先于子目录 */
  async function createFolderTree(
    root: FolderNode,
    rt: TaskRuntime,
    onProgress: (current: string) => void
  ): Promise<void> {
    const queue: Array<{ node: FolderNode; fatherPath: string }> = [
      { node: root, fatherPath: rt.basePath }
    ]

    while (queue.length > 0) {
      assertRunning(rt)
      const item = queue.shift()!
      onProgress(item.node.name)

      const info: any = await fetchNewFolder(
        {
          fatherPath: item.fatherPath,
          name: item.node.name,
          isSkip: true,
          loading: 'close'
        },
        rt.controller.signal,
        true
      )
      assertRunning(rt)

      if (!info?.id) throw new Error(`创建文件夹「${item.node.name}」失败`)

      item.node.dirId = info.id
      item.node.dirPath = info.path || `${item.fatherPath}/${item.node.name}`

      for (const child of item.node.children) {
        queue.push({ node: child, fatherPath: item.node.dirPath! })
      }
    }
  }

  // ---------- 添加任务 ----------

  interface ResolvedTarget {
    id: string
    path: string
    mountPath: string
  }

  /** 解析上传目标，缺失时给出提示并阻止上传 */
  function resolveTarget(explicit?: UploadTarget): ResolvedTarget | null {
    const id = explicit?.id || target.id
    const path = explicit?.path || target.path
    const mountPath = resolveMountPath(path) || target.mountPath

    if (!id) {
      ElMessage.warning('请先选择要上传到的目录')
      return null
    }
    if (!mountPath) {
      ElMessage.warning('无法识别当前挂载点，请重新选择目录后再上传')
      return null
    }
    return { id, path, mountPath }
  }

  function isDuplicateTask(file: File): boolean {
    return allTasks.some(
      (item) =>
        item.kind === 'file' &&
        item.name === file.name &&
        item.size === file.size &&
        !isTerminal(item.status)
    )
  }

  /** 添加文件到上传队列（target 不传则使用 setTarget 设置的目标） */
  function addFiles(files: File[], explicit?: UploadTarget): void {
    const resolved = resolveTarget(explicit)
    if (!resolved) return

    const valid = files.filter((file) => file.size > 0)
    if (valid.length === 0) {
      if (files.length > 0) ElMessage.warning('空文件已自动忽略')
      return
    }

    let skipped = 0
    let added = 0

    for (const file of valid) {
      if (isDuplicateTask(file)) {
        skipped += 1
        continue
      }

      const uid = genUid()
      const rt = createRuntime({ file, basePath: resolved.path })

      pushTask(
        {
          uid,
          kind: 'file',
          name: file.name,
          size: file.size,
          status: 'queued',
          progress: 0,
          speed: 0,
          uploadedBytes: 0,
          targetPathId: resolved.id,
          mountPath: resolved.mountPath,
          fileMd5: '',
          totalChunks: 0,
          uploadedChunkCount: 0,
          createdAt: Date.now()
        },
        rt
      )
      added += 1
    }

    if (skipped > 0 && added === 0) {
      ElMessage.warning(`${skipped} 个同名文件正在上传中，已跳过`)
    }

    // 批量入队结束后立即同步一次，避免用户觉得"点了没反应"
    if (added > 0) flushNow()
  }

  /** 添加文件夹到上传队列 */
  function addFolder(entry: FileSystemDirectoryEntry, explicit?: UploadTarget): void {
    const resolved = resolveTarget(explicit)
    if (!resolved) return

    const uid = genUid()
    const rt = createRuntime({ entry, basePath: resolved.path })

    pushTask(
      {
        uid,
        kind: 'folder',
        name: entry.name,
        size: 0,
        status: 'queued',
        progress: 0,
        speed: 0,
        uploadedBytes: 0,
        targetPathId: resolved.id,
        mountPath: resolved.mountPath,
        fileMd5: '',
        totalChunks: 0,
        uploadedChunkCount: 0,
        fileCount: 0,
        completedFiles: 0,
        createdAt: Date.now()
      },
      rt
    )

    flushNow()
  }

  function pushTask(raw: UploadTask, rt: TaskRuntime): void {
    allTasks.push(raw)
    runtime.set(raw.uid, rt)
    pendingQueue.push(raw.uid)
    markDirty()
    schedule()
  }

  /**
   * 从拖拽事件添加任务（兼容文件夹）
   * 注意：dataTransfer.items 必须在同步阶段读取完毕，await 之后会失效
   */
  async function addFromDrop(event: DragEvent, explicit?: UploadTarget): Promise<void> {
    const items = event.dataTransfer?.items
    if (!items || items.length === 0) return

    const files: File[] = []
    const folders: FileSystemDirectoryEntry[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!
      if (item.kind !== 'file') continue

      const entry = item.webkitGetAsEntry?.()
      if (entry?.isDirectory) {
        folders.push(entry as FileSystemDirectoryEntry)
      } else {
        const file = item.getAsFile()
        if (file && file.size > 0) files.push(file)
      }
    }

    if (files.length > 0) addFiles(files, explicit)
    for (const folder of folders) addFolder(folder, explicit)
  }

  // ---------- 任务控制 ----------

  /**
   * 取消单个任务（不刷新 UI，由调用方决定何时 flush）
   * 立即 abort 所有在途请求，并且不再派发任何新请求
   */
  function cancelOne(uid: string): boolean {
    const task = findTask(uid)
    const rt = runtime.get(uid)
    if (!task || !rt) return false
    if (isTerminal(task.status)) return false

    // 先置停止标志，再 abort，保证回调里不会再发起请求
    rt.cancelled = true
    rt.stopped = true
    rt.controller.abort()

    const queueIndex = pendingQueue.indexOf(uid)
    if (queueIndex >= 0) pendingQueue.splice(queueIndex, 1)

    task.status = 'cancelled'
    task.speed = 0
    task.errorMsg = undefined
    return true
  }

  /** 取消任务：立即 abort 所有在途请求，不再派发任何新请求 */
  function cancel(uid: string): void {
    if (cancelOne(uid)) flushNow()
  }

  /** 取消全部未完成任务（只刷新一次 UI） */
  function cancelAll(): void {
    let changed = false
    for (const task of allTasks) {
      if (!isTerminal(task.status) && cancelOne(task.uid)) changed = true
    }
    if (changed) flushNow()
  }

  /** 移除任务（未完成会先取消） */
  function remove(uid: string): void {
    const task = findTask(uid)
    if (!task) return

    if (!isTerminal(task.status)) cancelOne(uid)

    runtime.delete(uid)
    const index = allTasks.findIndex((item) => item.uid === uid)
    if (index >= 0) allTasks.splice(index, 1)
    flushNow()
  }

  /** 清除已完成 / 已取消 / 失败的任务 */
  function clearFinished(): void {
    const kept: UploadTask[] = []
    for (const task of allTasks) {
      if (isTerminal(task.status)) {
        runtime.delete(task.uid)
      } else {
        kept.push(task)
      }
    }
    allTasks.length = 0
    allTasks.push(...kept)
    flushNow()
  }

  /** 重试失败任务（重新走一遍校验，已上传分片会被复用） */
  function retry(uid: string): void {
    const task = findTask(uid)
    const rt = runtime.get(uid)
    if (!task || !rt || task.status !== 'error') return

    rt.controller = new AbortController()
    rt.cancelled = false
    rt.stopped = false
    rt.chunkMd5s = []
    rt.samples = []

    task.status = 'queued'
    task.progress = 0
    task.speed = 0
    task.uploadedBytes = 0
    task.uploadedChunkCount = 0
    task.fileMd5 = ''
    task.errorMsg = undefined
    task.completedFiles = 0

    flushNow()
    pendingQueue.push(uid)
    schedule()
  }

  /** 更新上传目标目录（拖拽 / 选择文件前调用） */
  function setTarget(next: UploadTarget): void {
    target.id = next.id
    target.path = next.path
    target.mountPath = resolveMountPath(next.path)
  }

  /**
   * 合并调用方传入的配置。
   * 单例场景下，布局、页面可能先后调用 useChunkUpload 并带上各自参数，
   * 这里做非破坏性合并，避免"先调用者的参数锁死全局配置"。
   */
  function configure(next: UseChunkUploadOptions): void {
    // 分片大小只在空闲时调整，避免影响在途任务的切片边界
    if (next.chunkSize && running.value === 0 && pendingQueue.length === 0) {
      config.chunkSize = next.chunkSize
    }
    if (next.concurrency) config.concurrency = Math.max(1, next.concurrency)
    if (next.chunkConcurrency) config.chunkConcurrency = Math.max(1, next.chunkConcurrency)

    if (next.currentPath) {
      target.path = next.currentPath
      target.mountPath = resolveMountPath(next.currentPath)
    }
    if (next.targetPathId) target.id = next.targetPathId
    if (next.mountPath) target.mountPath = next.mountPath
  }

  // ---------- 统计 ----------

  const stats = computed<UploadStats>(() => {
    const list = tasks.value
    let active = 0
    let queued = 0
    let done = 0
    let error = 0
    let cancelled = 0

    let totalBytes = 0
    let uploadedBytes = 0

    for (const task of list) {
      if (task.status === 'done') done += 1
      else if (task.status === 'error') error += 1
      else if (task.status === 'cancelled') cancelled += 1
      else active += 1

      if (task.status === 'queued') queued += 1

      if (task.size > 0) {
        totalBytes += task.size
        uploadedBytes +=
          task.status === 'done' ? task.size : Math.min(task.uploadedBytes, task.size)
      }
    }

    let overallPercent = 0
    if (totalBytes > 0) {
      overallPercent = Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
    } else if (list.length > 0) {
      overallPercent = Math.round(
        list.reduce((sum, task) => sum + (task.status === 'done' ? 100 : task.progress), 0) /
          list.length
      )
    }

    return {
      total: list.length,
      active,
      queued,
      done,
      error,
      cancelled,
      running: running.value,
      overallPercent
    }
  })

  // ---------- 页面刷新 / 关闭保护（只注册一次） ----------

  /** 页面刷新 / 关闭：立刻中止所有在途请求，避免"刷新后仍在跑" */
  function abortAll(): void {
    pendingQueue.length = 0
    runtime.forEach((rt) => {
      rt.cancelled = true
      rt.stopped = true
      rt.controller.abort()
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', abortAll)
    window.addEventListener('pagehide', abortAll)
  }

  return {
    /** 任务列表 */
    tasks,
    /** 汇总统计 */
    stats,

    // 添加
    addFiles,
    addFromDrop,
    // 控制
    cancel,
    cancelAll,
    remove,
    retry,
    clearFinished,
    setTarget,
    configure,
    // 事件
    onFolderCreated
  }
}

export type UploadStore = ReturnType<typeof createUploadStore>

// ============================================================
// 全局单例
// ============================================================

let instance: UploadStore | null = null

/**
 * 获取上传 store（全局单例）。
 *
 * 因为状态挂在模块作用域，离开 File Station 页面时组件卸载**不会**中止上传，
 * 上传会在后台继续执行，直到完成、失败或被主动取消。
 * 只有浏览器刷新 / 关闭页签才会通过 abortAll 立即中断。
 */
export function useChunkUpload(options: UseChunkUploadOptions = {}): UploadStore {
  if (!instance) {
    instance = createUploadStore(options)
  } else if (Object.keys(options).length > 0) {
    instance.configure(options)
  }
  return instance
}

// ============================================================
// 文件系统 API 辅助
// ============================================================

function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries((entries) => resolve(entries), reject)
  })
}

function readEntryFile(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (file) => resolve(file),
      () => resolve(null)
    )
  })
}
