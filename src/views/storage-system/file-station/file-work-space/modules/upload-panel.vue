<template>
  <Teleport to="body">
    <!-- 右上角悬浮触发按钮 -->
    <Transition name="trigger-fade">
      <div v-if="uploadList.length > 0" class="upload-trigger" @click="dialogVisible = true">
        <ElIcon class="upload-trigger__icon"><UploadFilled /></ElIcon>
        <span class="upload-trigger__text">上传任务</span>
        <span v-if="activeCount > 0" class="upload-trigger__badge">{{ activeCount }}</span>
      </div>
    </Transition>

    <!-- 居中弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      title="上传任务"
      width="560px"
      top="15vh"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="upload-dialog__body">
        <ElScrollbar max-height="50vh">
          <div v-for="item in uploadList" :key="item.uid" class="upload-item">
            <div class="upload-item__info">
              <!-- 状态图标 -->
              <span class="upload-item__icon">
                <ElIcon v-if="item.status === 'done'" color="#67C23A" :size="20"
                  ><CircleCheckFilled
                /></ElIcon>
                <ElIcon v-else-if="item.status === 'error'" color="#F56C6C" :size="20"
                  ><CircleCloseFilled
                /></ElIcon>
                <ElIcon v-else-if="item.status === 'cancelled'" color="#909399" :size="20"
                  ><RemoveFilled
                /></ElIcon>
                <ElIcon v-else color="#409EFF" :size="20" class="is-loading"><Loading /></ElIcon>
              </span>

              <!-- 文件名 & 状态 -->
              <div class="upload-item__detail">
                <div class="upload-item__name" :title="item.file.name">{{ item.file.name }}</div>
                <div class="upload-item__meta">
                  <span class="upload-item__status-text">{{ statusTextMap[item.status] }}</span>
                  <span class="upload-item__size">{{ formatSize(item.file.size) }}</span>
                  <span v-if="item.status === 'uploading'" class="upload-item__chunk-info">
                    {{ item.uploadedChunks.length }}/{{ item.totalChunks }} 片
                  </span>
                  <span v-if="item.status === 'uploading' && item.speed > 0" class="upload-item__speed">
                    {{ formatSpeed(item.speed) }}
                  </span>
                </div>
                <div v-if="item.status === 'error' && item.errorMsg" class="upload-item__error">
                  {{ item.errorMsg }}
                </div>
              </div>
            </div>

            <!-- 进度条：MD5 计算阶段不显示 -->
            <ElProgress
              v-if="item.status !== 'done' && item.status !== 'cancelled' && item.status !== 'hashing'"
              :percentage="item.progress"
              :status="item.status === 'error' ? 'exception' : undefined"
              :stroke-width="6"
              style="margin-top: 6px"
            />

            <!-- 操作 -->
            <div class="upload-item__actions">
              <template v-if="item.status === 'error'">
                <ElButton size="small" type="primary" @click="$emit('retry', item.uid)"
                  >重试</ElButton
                >
                <ElButton size="small" @click="$emit('remove', item.uid)">移除</ElButton>
              </template>
              <template v-else-if="item.status === 'done'">
                <ElButton size="small" @click="$emit('remove', item.uid)">移除</ElButton>
              </template>
              <template v-else-if="item.status === 'cancelled'">
                <ElButton size="small" @click="$emit('remove', item.uid)">移除</ElButton>
              </template>
              <template v-else-if="item.status === 'hashing'">
                <!-- MD5 计算阶段不显示取消按钮，无法中断 -->
              </template>
              <template v-else>
                <ElButton size="small" type="danger" @click="$emit('cancel', item.uid)"
                  >取消</ElButton
                >
              </template>
            </div>
          </div>
        </ElScrollbar>
      </div>

      <template #footer>
        <div class="upload-dialog__footer">
          <ElButton
            @click="handleClearFinished"
            :disabled="doneCount === 0 && errorCount === 0 && cancelledCount === 0"
          >
            清除已完成
          </ElButton>
          <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
        </div>
      </template>
    </ElDialog>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    UploadFilled,
    CircleCheckFilled,
    CircleCloseFilled,
    RemoveFilled,
    Loading
  } from '@element-plus/icons-vue'
  import type { UploadFileItem, UploadStatus } from '@/composables/useChunkUpload'

  const props = defineProps<{
    uploadList: UploadFileItem[]
  }>()

  const emit = defineEmits<{
    cancel: [uid: string]
    remove: [uid: string]
    retry: [uid: string]
  }>()

  const dialogVisible = ref(false)

  const statusTextMap: Record<UploadStatus, string> = {
    pending: '等待中...',
    hashing: '正在计算文件指纹...',
    checking: '正在校验已上传分片...',
    uploading: '上传中',
    merging: '正在合并分片...',
    done: '上传完成',
    error: '上传失败',
    cancelled: '已取消'
  }

  const activeCount = computed(
    () =>
      props.uploadList.filter(
        (i) => i.status !== 'done' && i.status !== 'cancelled' && i.status !== 'error'
      ).length
  )
  const doneCount = computed(() => props.uploadList.filter((i) => i.status === 'done').length)
  const errorCount = computed(() => props.uploadList.filter((i) => i.status === 'error').length)
  const cancelledCount = computed(
    () => props.uploadList.filter((i) => i.status === 'cancelled').length
  )

  function handleClearFinished() {
    // 清理完成/取消/失败的任务
    const toRemove = props.uploadList.filter(
      (i) => i.status === 'done' || i.status === 'error' || i.status === 'cancelled'
    )
    toRemove.forEach((i) => emit('remove', i.uid))
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
  }

  function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s'
    if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s'
    return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s'
  }
</script>

<style lang="scss" scoped>
  /* ============================================================
   右上角悬浮触发按钮
   ============================================================ */
  .upload-trigger {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    user-select: none;
    transition:
      box-shadow 0.2s,
      transform 0.2s;

    &:hover {
      box-shadow: 0 4px 20px rgba(64, 158, 255, 0.25);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &__icon {
      color: #409eff;
      font-size: 18px;
    }

    &__text {
      font-size: 13px;
      color: #303133;
    }

    &__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #409eff;
      color: #fff;
      font-size: 11px;
      border-radius: 9px;
    }
  }

  /* 触发按钮动画 */
  .trigger-fade-enter-active,
  .trigger-fade-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }
  .trigger-fade-enter-from,
  .trigger-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  /* ============================================================
   弹窗内上传列表
   ============================================================ */
  .upload-dialog__body {
    .upload-item {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      &__info {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      &__icon {
        flex-shrink: 0;
        padding-top: 1px;
      }

      &__detail {
        flex: 1;
        min-width: 0;
      }

      &__name {
        font-size: 14px;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }

      &__meta {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
      }

      &__status-text {
        color: #909399;
      }

      &__size {
        color: #c0c4cc;
      }

      &__chunk-info {
        color: #409eff;
      }

      &__speed {
        color: #67c23a;
        font-weight: 500;

        &::before {
          content: '· ';
          color: #c0c4cc;
          font-weight: 400;
        }
      }

      &__error {
        font-size: 12px;
        color: #f56c6c;
        margin-top: 2px;
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }
    }
  }

  .upload-dialog__footer {
    display: flex;
    justify-content: space-between;
  }
</style>
