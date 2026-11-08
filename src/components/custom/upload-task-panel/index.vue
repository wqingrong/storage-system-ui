<template>
  <Teleport to="body">
    <!-- 悬浮入口 -->
    <Transition name="upload-fab">
      <div v-if="tasks.length > 0" class="upload-fab" @click="dialogVisible = true">
        <span class="upload-fab__icon" :class="{ 'is-spinning': stats.active > 0 }">
          <ElIcon :size="18"><UploadFilled /></ElIcon>
        </span>

        <span class="upload-fab__text">
          <span class="upload-fab__title">{{ fabTitle }}</span>
          <span class="upload-fab__desc"
            >{{ stats.overallPercent }}% · 共 {{ stats.total }} 项</span
          >
        </span>

        <span class="upload-fab__badge" :class="badgeClass">{{ badgeText }}</span>

        <span class="upload-fab__bar" :style="{ width: `${stats.overallPercent}%` }" />
      </div>
    </Transition>

    <!-- 任务面板 -->
    <ElDialog
      v-model="dialogVisible"
      width="620px"
      top="10vh"
      :close-on-click-modal="false"
      :show-close="true"
      class="upload-dialog"
    >
      <template #header>
        <div class="upload-dialog__header">
          <div class="upload-dialog__title">
            上传任务
            <span class="upload-dialog__summary">{{ summaryText }}</span>
          </div>
          <ElButton
            v-if="stats.active > 0"
            text
            type="danger"
            size="small"
            @click="handleCancelAll"
          >
            全部取消
          </ElButton>
        </div>
      </template>

      <ElScrollbar max-height="52vh">
        <div v-if="sortedTasks.length === 0" class="upload-empty">
          <ElEmpty description="暂无上传任务" :image-size="72" />
        </div>

        <div v-for="item in sortedTasks" :key="item.uid" class="task" :class="`is-${item.status}`">
          <!-- 标题行 -->
          <div class="task__head">
            <span class="task__icon">
              <ElIcon v-if="item.status === 'done'" color="#67c23a" :size="18">
                <CircleCheckFilled />
              </ElIcon>
              <ElIcon v-else-if="item.status === 'error'" color="#f56c6c" :size="18">
                <CircleCloseFilled />
              </ElIcon>
              <ElIcon v-else-if="item.status === 'cancelled'" color="#909399" :size="18">
                <RemoveFilled />
              </ElIcon>
              <ElIcon v-else :size="18" color="#409eff" class="is-spinning">
                <Loading />
              </ElIcon>
            </span>

            <span class="task__name" :title="displayName(item)">
              <span v-if="item.kind === 'folder'" class="task__badge">文件夹</span>
              {{ displayName(item) }}
            </span>

            <span class="task__percent">{{ item.status === 'done' ? 100 : item.progress }}%</span>
          </div>

          <!-- 元信息 -->
          <div class="task__meta">
            <span class="task__status">{{ statusText(item) }}</span>
            <span v-if="item.size > 0" class="task__dot">{{ formatSize(item.size) }}</span>
            <span v-if="item.speed > 0" class="task__dot task__speed">{{
              formatSpeed(item.speed)
            }}</span>
            <span v-if="item.kind === 'folder' && item.fileCount" class="task__dot">
              {{ item.completedFiles || 0 }}/{{ item.fileCount }} 个文件
            </span>
            <span
              v-else-if="item.kind === 'file' && item.status === 'uploading' && item.totalChunks"
              class="task__dot"
            >
              {{ item.uploadedChunkCount }}/{{ item.totalChunks }} 片
            </span>
          </div>

          <!-- 进度条 -->
          <ElProgress
            v-if="showProgress(item)"
            class="task__progress"
            :percentage="item.progress"
            :indeterminate="isIndeterminate(item)"
            :status="item.status === 'error' ? 'exception' : undefined"
            :stroke-width="5"
            :show-text="false"
          />

          <!-- 错误信息 -->
          <div
            v-if="item.status === 'error' && item.errorMsg"
            class="task__error"
            :title="item.errorMsg"
          >
            {{ item.errorMsg }}
          </div>

          <!-- 操作 -->
          <div class="task__actions">
            <template v-if="item.status === 'error'">
              <ElButton text type="primary" size="small" @click="retry(item.uid)">重试</ElButton>
              <ElButton text size="small" @click="remove(item.uid)">移除</ElButton>
            </template>
            <template v-else-if="item.status === 'done' || item.status === 'cancelled'">
              <ElButton text size="small" @click="remove(item.uid)">移除</ElButton>
            </template>
            <template v-else>
              <ElButton text type="danger" size="small" @click="cancel(item.uid)">取消</ElButton>
            </template>
          </div>
        </div>
      </ElScrollbar>

      <template #footer>
        <div class="upload-dialog__footer">
          <ElButton :disabled="finishedCount === 0" @click="clearFinished()"> 清除已结束 </ElButton>
          <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
        </div>
      </template>
    </ElDialog>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import {
    CircleCheckFilled,
    CircleCloseFilled,
    Loading,
    RemoveFilled,
    UploadFilled
  } from '@element-plus/icons-vue'
  import { useChunkUpload } from '@/composables/useChunkUpload'
  import type { UploadStatus, UploadTask } from '@/composables/useChunkUpload'

  /**
   * 直接消费全局上传 store（单例）。
   * 面板本身挂载在全局布局上，因此离开 File Station 页面后仍然可见、可控。
   */
  const { tasks, stats, cancel, cancelAll, remove, retry, clearFinished } = useChunkUpload()

  const dialogVisible = ref(false)

  /** 新任务排在前面 */
  const sortedTasks = computed(() => [...tasks.value].reverse())

  const finishedCount = computed(
    () =>
      tasks.value.filter(
        (item) => item.status === 'done' || item.status === 'error' || item.status === 'cancelled'
      ).length
  )

  const fabTitle = computed(() => {
    if (stats.value.active > 0) return `正在上传 ${stats.value.active} 项`
    if (stats.value.error > 0) return `${stats.value.error} 项上传失败`
    if (stats.value.done === 0 && stats.value.cancelled > 0) return '任务已全部取消'
    return '上传完成'
  })

  const badgeText = computed(() => {
    if (stats.value.active > 0) return String(stats.value.active)
    if (stats.value.error > 0) return '!'
    return '✓'
  })

  const badgeClass = computed(() => ({
    'is-active': stats.value.active > 0,
    'is-error': stats.value.active === 0 && stats.value.error > 0
  }))

  const summaryText = computed(() => {
    const parts: string[] = []
    if (stats.value.active > 0) parts.push(`${stats.value.active} 个进行中`)
    if (stats.value.done > 0) parts.push(`${stats.value.done} 个已完成`)
    if (stats.value.error > 0) parts.push(`${stats.value.error} 个失败`)
    if (stats.value.cancelled > 0) parts.push(`${stats.value.cancelled} 个已取消`)
    return parts.join(' · ')
  })

  const STATUS_TEXT: Record<UploadStatus, string> = {
    queued: '排队等待',
    scanning: '正在扫描文件夹',
    creating: '正在创建文件夹',
    hashing: '正在计算文件指纹',
    checking: '正在校验断点',
    uploading: '上传中',
    merging: '正在合并文件',
    done: '上传完成',
    error: '上传失败',
    cancelled: '已取消'
  }

  function statusText(task: UploadTask): string {
    const base = STATUS_TEXT[task.status]
    if (task.status === 'scanning' && task.fileCount) {
      return `${base}（已发现 ${task.fileCount} 个文件）`
    }
    // 文件夹任务额外提示当前处理中的文件
    const showCurrent =
      task.kind === 'folder' &&
      task.currentFile &&
      (task.status === 'creating' || task.status === 'uploading')
    if (showCurrent) {
      return `${base}·${task.currentFile}`
    }
    return base
  }

  function displayName(task: UploadTask): string {
    return task.name
  }

  function showProgress(task: UploadTask): boolean {
    return task.status !== 'queued' && task.status !== 'done' && task.status !== 'cancelled'
  }

  function isIndeterminate(task: UploadTask): boolean {
    return task.status === 'scanning' || task.status === 'creating' || task.status === 'merging'
  }

  function handleCancelAll(): void {
    cancelAll()
  }

  function formatSize(bytes: number): string {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${parseFloat((bytes / 1024 ** unit).toFixed(2))} ${units[unit]}`
  }

  function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }
</script>

<style lang="scss" scoped>
  /* ============ 悬浮入口 ============ */
  .upload-fab {
    position: fixed;
    right: 24px;
    bottom: 96px;
    z-index: 2100;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 200px;
    max-width: 300px;
    padding: 10px 14px;
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 6px 24px rgb(0 0 0 / 12%);
    transition:
      box-shadow 0.2s,
      transform 0.2s;
    user-select: none;

    &:hover {
      box-shadow: 0 8px 28px rgb(64 158 255 / 22%);
      transform: translateY(-1px);
    }

    &__icon {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: #409eff;
      background: rgb(64 158 255 / 10%);
      border-radius: 8px;
    }

    &__text {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      line-height: 1.4;
    }

    &__title {
      overflow: hidden;
      font-size: 13px;
      color: #303133;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__desc {
      font-size: 11px;
      color: #909399;
    }

    &__badge {
      flex-shrink: 0;
      min-width: 20px;
      padding: 0 6px;
      font-size: 11px;
      line-height: 20px;
      color: #fff;
      text-align: center;
      background: #c0c4cc;
      border-radius: 10px;

      &.is-active {
        background: #409eff;
      }

      &.is-error {
        background: #f56c6c;
      }
    }

    &__bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: linear-gradient(90deg, #409eff, #67c23a);
      transition: width 0.3s;
    }
  }

  .upload-fab-enter-active,
  .upload-fab-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .upload-fab-enter-from,
  .upload-fab-leave-to {
    opacity: 0;
    transform: translateY(12px);
  }

  /* ============ 面板 ============ */
  .upload-dialog {
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 8px;
    }

    &__title {
      display: flex;
      align-items: baseline;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    &__summary {
      font-size: 12px;
      font-weight: 400;
      color: #909399;
    }

    &__footer {
      display: flex;
      justify-content: space-between;
    }
  }

  .upload-empty {
    padding: 12px 0;
  }

  /* ============ 任务项 ============ */
  .task {
    padding: 12px 0;
    border-bottom: 1px solid #f2f3f5;

    &:last-child {
      border-bottom: none;
    }

    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__icon {
      display: inline-flex;
      flex-shrink: 0;
    }

    &__name {
      flex: 1;
      overflow: hidden;
      font-size: 13px;
      color: #303133;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__badge {
      display: inline-block;
      padding: 0 5px;
      margin-right: 4px;
      font-size: 11px;
      line-height: 16px;
      color: #e6a23c;
      background: rgb(230 162 60 / 12%);
      border-radius: 3px;
      vertical-align: 1px;
    }

    &__percent {
      flex-shrink: 0;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: #909399;
    }

    &__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 4px 0 0 26px;
      font-size: 12px;
      color: #909399;
    }

    &__dot {
      &::before {
        margin-right: 8px;
        content: '·';
        color: #dcdfe6;
      }

      &:first-child::before {
        display: none;
      }
    }

    &__speed {
      color: #67c23a;
    }

    &__progress {
      margin: 8px 0 0 26px;
    }

    &__error {
      padding: 6px 10px;
      margin: 8px 0 0 26px;
      font-size: 12px;
      line-height: 1.5;
      color: #f56c6c;
      word-break: break-all;
      background: rgb(245 108 108 / 8%);
      border-radius: 4px;
    }

    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
    }

    &.is-cancelled {
      .task__name,
      .task__percent {
        color: #a8abb2;
      }
    }

    &.is-done {
      .task__name {
        color: #606266;
      }
    }
  }

  .is-spinning {
    animation: upload-spin 1s linear infinite;
  }

  @keyframes upload-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
