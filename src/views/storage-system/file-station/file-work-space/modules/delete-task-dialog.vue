<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="isFinished"
    align-center
    @close="handleClose"
  >
    <!-- ======================== 阶段步骤条 ======================== -->
    <div class="delete-steps">
      <div
        v-for="(step, idx) in steps"
        :key="step.key"
        class="step-item"
        :class="{
          'step--active': step.active,
          'step--done': step.done,
          'step--error': step.error
        }"
      >
        <div class="step-dot">
          <span v-if="step.error" class="step-icon">✕</span>
          <span v-else-if="step.done" class="step-icon">✓</span>
          <span v-else-if="step.active" class="step-icon step-icon--pulse">{{ step.icon }}</span>
          <span v-else class="step-num">{{ idx + 1 }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
        <div v-if="idx < steps.length - 1" class="step-line" :class="{ 'line--done': step.done }" />
      </div>
    </div>

    <!-- ======================== 阶段内容区 ======================== -->
    <div class="delete-content">
      <!-- Init: 任务受理 -->
      <div v-if="currentPhase === TaskPhase.Init" class="phase-panel">
        <div class="phase-status">
          <ElIcon class="phase-loading"><Loading /></ElIcon>
          <span>任务受理中，请稍候...</span>
        </div>
        <p class="phase-sub">{{ initPayload?.message }}</p>
        <div v-if="initPayload?.pathList?.length" class="path-preview">
          <p class="path-label">待删除路径（{{ initPayload.pathList.length }}）：</p>
          <ul class="path-list">
            <li v-for="p in initPayload.pathList.slice(0, 5)" :key="p" class="path-item">{{
              p
            }}</li>
            <li v-if="initPayload.pathList.length > 5" class="path-more">
              ...还有 {{ initPayload.pathList.length - 5 }} 条
            </li>
          </ul>
        </div>
      </div>

      <!-- Scanning: 扫描文件系统 -->
      <div v-else-if="currentPhase === TaskPhase.Scanning" class="phase-panel">
        <div class="phase-status">
          <ElIcon class="phase-loading"><Loading /></ElIcon>
          <span>正在扫描文件系统...</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-val">{{ scanPayload?.filesFound ?? 0 }}</span>
            <span class="stat-label">文件</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ scanPayload?.dirsFound ?? 0 }}</span>
            <span class="stat-label">目录</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ formatBytes(scanPayload?.bytesFound ?? 0) }}</span>
            <span class="stat-label">大小</span>
          </div>
        </div>
        <p v-if="scanPayload?.currentPath" class="current-path">
          <ElIcon><Folder /></ElIcon>
          {{ scanPayload.currentPath }}
        </p>
      </div>

      <!-- Scanned: 扫描完成 -->
      <div v-else-if="currentPhase === TaskPhase.Scanned" class="phase-panel">
        <div class="phase-status phase-status--done">
          <ElIcon><CircleCheckFilled /></ElIcon>
          <span>扫描完成</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-val">{{ scannedPayload?.totalFiles ?? 0 }}</span>
            <span class="stat-label">文件</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ scannedPayload?.totalDirs ?? 0 }}</span>
            <span class="stat-label">目录</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{
              scannedPayload?.totalSizeHuman || formatBytes(scannedPayload?.totalSize ?? 0)
            }}</span>
            <span class="stat-label">总大小</span>
          </div>
        </div>
      </div>

      <!-- Deleting: 执行删除 -->
      <div v-else-if="currentPhase === TaskPhase.Deleting" class="phase-panel">
        <div class="phase-status">
          <ElIcon class="phase-loading"><Loading /></ElIcon>
          <span>正在删除文件...</span>
        </div>
        <ElProgress
          :percentage="deletePayload?.progressPct ?? 0"
          :color="progressColor"
          :stroke-width="12"
          striped
          striped-flow
        />
        <div class="stats-grid" style="margin-top: 16px">
          <div class="stat-card">
            <span class="stat-val">{{ deletePayload?.deletedCount ?? 0 }}</span>
            <span class="stat-label">已删除</span>
          </div>
          <div class="stat-card">
            <span class="stat-val">{{ deletePayload?.totalCount ?? 0 }}</span>
            <span class="stat-label">总计</span>
          </div>
          <div class="stat-card" :class="{ 'has-error': (deletePayload?.failedCount ?? 0) > 0 }">
            <span
              class="stat-val"
              :style="{ color: (deletePayload?.failedCount ?? 0) > 0 ? '#f56c6c' : '' }"
            >
              {{ deletePayload?.failedCount ?? 0 }}
            </span>
            <span class="stat-label">失败</span>
          </div>
        </div>
        <p v-if="deletePayload?.currentPath" class="current-path">
          <ElIcon><Document /></ElIcon>
          {{ deletePayload.currentPath }}
        </p>
      </div>

      <!-- Completed: 删除成功 -->
      <div v-else-if="currentPhase === TaskPhase.Completed" class="phase-panel">
        <ElResult icon="success" title="删除完成" :sub-title="resultPayload?.message ?? ''">
          <template #extra>
            <div class="result-summary">
              <ElTag type="success">文件 {{ resultPayload?.deletedFiles ?? 0 }}</ElTag>
              <ElTag type="success">目录 {{ resultPayload?.deletedDirs ?? 0 }}</ElTag>
              <ElTag v-if="(resultPayload?.failedCount ?? 0) > 0" type="danger">
                失败 {{ resultPayload.failedCount }}
              </ElTag>
              <ElTag v-if="resultPayload" type="info">
                耗时 {{ formatDuration(resultPayload.startTime, resultPayload.endTime) }}
              </ElTag>
            </div>
          </template>
        </ElResult>
      </div>

      <!-- Canceled: 已取消 -->
      <div v-else-if="currentPhase === TaskPhase.Canceled" class="phase-panel">
        <ElResult icon="warning" title="删除已取消" :sub-title="resultPayload?.message ?? ''">
          <template v-if="resultPayload" #extra>
            <div class="result-summary">
              <ElTag type="warning">已删除文件 {{ resultPayload.deletedFiles }}</ElTag>
              <ElTag type="warning">已删除目录 {{ resultPayload.deletedDirs }}</ElTag>
              <ElTag v-if="resultPayload.failedCount > 0" type="danger">
                失败 {{ resultPayload.failedCount }}
              </ElTag>
            </div>
          </template>
        </ElResult>
      </div>

      <!-- Failed: 删除失败 -->
      <div v-else-if="currentPhase === TaskPhase.Failed" class="phase-panel">
        <ElResult icon="error" title="删除失败" :sub-title="resultPayload?.message ?? '未知错误'">
          <template v-if="resultPayload" #extra>
            <div class="result-summary">
              <ElTag type="info">已删除文件 {{ resultPayload.deletedFiles }}</ElTag>
              <ElTag type="info">已删除目录 {{ resultPayload.deletedDirs }}</ElTag>
              <ElTag type="danger">失败 {{ resultPayload.failedCount }}</ElTag>
            </div>
          </template>
        </ElResult>
      </div>
    </div>

    <!-- ======================== 底部操作栏 ======================== -->
    <template #footer>
      <div class="dialog-footer">
        <ElButton v-if="cancelable" type="danger" plain :loading="canceling" @click="handleCancel">
          取消删除
        </ElButton>
        <ElButton v-if="isFinished" type="primary" @click="handleClose">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { CircleCheckFilled, Document, Folder, Loading } from '@element-plus/icons-vue'
  import {
    type DeletingPayload,
    type InitPayload,
    type ScannedPayload,
    type ScanProgressPayload,
    SSEEvent,
    TaskPhase,
    type TaskResultPayload
  } from '@/entity/sse'
  import { fetchSubmitCancelTask } from '@/api/task-service'
  import { sse } from '@/utils/sse'

  // ======================== Props & Emits ========================

  interface Props {
    visible: boolean
    taskId: string
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    /** 任务结束后触发，通知父组件可以刷新列表 */
    (e: 'task-done', taskId: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // ======================== 状态 ========================

  const canceling = ref(false)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        loadingEventData()
      } else {
        console.log('关闭弹窗,取消删除任务')
      }
    }
  )
  // 任务启动..
  const initPayload = ref<InitPayload>({
    pathList: [],
    message: ''
  })
  // 扫描信息
  const scanPayload = ref<ScanProgressPayload>({
    currentPath: '',
    filesFound: 0,
    dirsFound: 0,
    bytesFound: 0
  })

  const scannedPayload = ref<ScannedPayload>({
    pathList: [],
    totalFiles: 0,
    totalDirs: 0,
    totalSize: 0,
    totalSizeHuman: ''
  })

  const deletePayload = ref<DeletingPayload>({
    currentPath: '',
    deletedCount: 0,
    failedCount: 0,
    totalCount: 0,
    progressPct: 0
  })

  const resultPayload = ref<TaskResultPayload>({
    phase: TaskPhase.Init,
    message: '',
    deletedFiles: 0,
    deletedDirs: 0,
    failedCount: 0,
    startTime: '',
    endTime: ''
  })

  const currentEvent = ref('')

  // 监听相关事件信息
  const loadingEventData = () => {
    // 每次打开弹窗时重置所有 payload 为初始值
    currentEvent.value = ''
    Object.assign(initPayload.value, { pathList: [], message: '' })
    Object.assign(scanPayload.value, {
      currentPath: '',
      filesFound: 0,
      dirsFound: 0,
      bytesFound: 0
    })
    Object.assign(scannedPayload.value, {
      pathList: [],
      totalFiles: 0,
      totalDirs: 0,
      totalSize: 0,
      totalSizeHuman: ''
    })
    Object.assign(deletePayload.value, {
      currentPath: '',
      deletedCount: 0,
      failedCount: 0,
      totalCount: 0,
      progressPct: 0
    })
    Object.assign(resultPayload.value, {
      phase: TaskPhase.Init,
      message: '',
      deletedFiles: 0,
      deletedDirs: 0,
      failedCount: 0,
      startTime: '',
      endTime: ''
    })

    sse.subscribe(props.taskId, (data: SSEEvent) => {
      currentEvent.value = data.status
      switch (data.status) {
        case TaskPhase.Init:
          Object.assign(initPayload.value, data.data)
          break
        case TaskPhase.Scanning:
          Object.assign(scanPayload.value, data.data)
          break
        case TaskPhase.Scanned:
          Object.assign(scannedPayload.value, data.data)
          break
        case TaskPhase.Deleting:
          Object.assign(deletePayload.value, data.data)
          break
        case TaskPhase.Completed:
          Object.assign(resultPayload.value, data.data)
          break
        case TaskPhase.Canceled:
          Object.assign(resultPayload.value, data.data)
          break
        case TaskPhase.Failed:
          Object.assign(resultPayload.value, data.data)
          break
        default:
      }
    })
  }

  // ======================== 计算属性 ========================

  /** 当前所处阶段（SSE 实时更新） */
  const currentPhase = computed<TaskPhase>(() => {
    return (currentEvent.value as TaskPhase) || TaskPhase.Init
  })

  /** 是否已进入终态 */
  const isFinished = computed(() => {
    const phase = currentPhase.value
    return (
      phase === TaskPhase.Completed || phase === TaskPhase.Canceled || phase === TaskPhase.Failed
    )
  })

  /** 是否可取消：init / scanning / deleting 阶段可取消 */
  const cancelable = computed(() => {
    const phase = currentPhase.value
    return phase === TaskPhase.Init || phase === TaskPhase.Scanning || phase === TaskPhase.Deleting
  })

  /** 动态弹窗标题 */
  const dialogTitle = computed(() => {
    const labelMap: Record<string, string> = {
      [TaskPhase.Init]: '任务受理',
      [TaskPhase.Scanning]: '扫描中',
      [TaskPhase.Scanned]: '扫描完成',
      [TaskPhase.Deleting]: '删除中',
      [TaskPhase.Completed]: '删除成功',
      [TaskPhase.Canceled]: '已取消',
      [TaskPhase.Failed]: '删除失败'
    }
    return `删除任务 - ${labelMap[currentPhase.value] ?? '进行中'}`
  })

  const progressColor = computed(() => {
    const pct = deletePayload.value?.progressPct ?? 0
    if (pct >= 100) return '#67c23a'
    if (pct >= 60) return '#409eff'
    return '#e6a23c'
  })

  // ======================== 步骤条 ========================

  interface StepDef {
    key: string
    label: string
    icon: string
    active: boolean
    done: boolean
    error: boolean
  }

  const steps = computed<StepDef[]>(() => {
    const phase = currentPhase.value
    const phaseOrder = [
      { key: 'init', label: '受理', icon: '📋' },
      { key: 'scan', label: '扫描', icon: '🔍' },
      { key: 'delete', label: '删除', icon: '🗑️' },
      { key: 'done', label: '完成', icon: '🎉' }
    ]

    // 映射当前 phase 到步骤索引
    let activeIdx: number
    switch (phase) {
      case TaskPhase.Init:
        activeIdx = 0
        break
      case TaskPhase.Scanning:
      case TaskPhase.Scanned:
        activeIdx = 1
        break
      case TaskPhase.Deleting:
        activeIdx = 2
        break
      case TaskPhase.Completed:
        activeIdx = 3
        break
      // 失败/取消时最后一步标红
      case TaskPhase.Failed:
      case TaskPhase.Canceled:
        activeIdx = 3
        break
      default:
        activeIdx = 0
    }

    const isError = phase === TaskPhase.Failed || phase === TaskPhase.Canceled

    return phaseOrder.map((step, idx) => ({
      ...step,
      active: idx === activeIdx,
      done: idx < activeIdx,
      error: idx === activeIdx && isError
    }))
  })

  // ======================== 取消删除 ========================

  const handleCancel = async () => {
    try {
      canceling.value = true
      await fetchSubmitCancelTask({ taskId: props.taskId }).then(() => {
        emit('update:visible', false)
      })
    } catch {
      ElMessage.error('取消失败，请重试')
    } finally {
      canceling.value = false
    }
  }

  // ======================== 关闭弹窗 ========================

  const handleClose = () => {
    dialogVisible.value = false
    if (isFinished.value) {
      emit('task-done', props.taskId)
    }
  }

  // ======================== 工具函数 ========================

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const val = bytes / Math.pow(k, i)
    return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  function formatDuration(start: string, end: string): string {
    if (!start || !end) return '-'
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 0) return '-'
    const seconds = Math.floor(ms / 1000)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }
</script>

<style lang="scss" scoped>
  // ======================== 步骤条 ========================
  .delete-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0 20px;
    gap: 0;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0;
    position: relative;
  }

  .step-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    background: #e4e7ed;
    color: #909399;
    transition: all 0.3s ease;
  }

  .step-label {
    margin-left: 6px;
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
    transition: color 0.3s;
  }

  .step-line {
    width: 48px;
    height: 2px;
    background: #e4e7ed;
    margin: 0 12px;
    transition: background 0.3s;

    &.line--done {
      background: #67c23a;
    }
  }

  // 激活态
  .step--active {
    .step-dot {
      background: #409eff;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.15);
    }
    .step-label {
      color: #409eff;
      font-weight: 600;
    }
  }

  // 已完成
  .step--done {
    .step-dot {
      background: #67c23a;
      color: #fff;
    }
    .step-label {
      color: #67c23a;
    }
  }

  // 错误态
  .step--error {
    .step-dot {
      background: #f56c6c;
      color: #fff;
    }
    .step-label {
      color: #f56c6c;
      font-weight: 600;
    }
  }

  .step-icon--pulse {
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.85);
    }
  }

  // ======================== 内容区 ========================
  .delete-content {
    min-height: 180px;
    padding: 0 4px;
  }

  .phase-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .phase-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #303133;

    &--done {
      color: #67c23a;
    }
  }

  .phase-loading {
    animation: spin 1.5s linear infinite;
    color: #409eff;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .phase-sub {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }

  // 路径预览
  .path-preview {
    width: 100%;
    background: #f5f7fa;
    border-radius: 6px;
    padding: 10px 14px;
  }

  .path-label {
    margin: 0 0 6px;
    font-size: 12px;
    color: #909399;
  }

  .path-list {
    margin: 0;
    padding-left: 16px;
  }

  .path-item {
    font-size: 12px;
    color: #606266;
    word-break: break-all;
    line-height: 1.8;
  }

  .path-more {
    font-size: 12px;
    color: #909399;
    font-style: italic;
  }

  // 统计卡片
  .stats-grid {
    display: flex;
    gap: 16px;
    justify-content: center;
    width: 100%;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 12px 20px;
    min-width: 80px;

    &.has-error {
      background: #fef0f0;
    }
  }

  .stat-val {
    font-size: 20px;
    font-weight: 700;
    color: #303133;
  }

  .stat-label {
    font-size: 12px;
    color: #909399;
  }

  // 当前路径
  .current-path {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #909399;
    margin: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 结果汇总
  .result-summary {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }

  // ======================== 底部 ========================
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
