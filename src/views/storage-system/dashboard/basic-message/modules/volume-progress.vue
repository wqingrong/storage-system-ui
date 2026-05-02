<template>
  <div class="lv-volume-card">
    <!-- 标题 -->
    <div class="card-header">
      <div class="title">{{ volumeName }}</div>
      <div class="percent-text">{{ precent }}%</div>
    </div>

    <!-- 进度条主体 -->
    <div class="progress-box">
      <el-progress
        :percentage="precent"
        :color="progressColor"
        :stroke-width="12"
        :show-text="false"
      />
    </div>

    <!-- 容量详情文字 -->
    <div class="volume-info">
      <div class="info-item">
        <span>文件系统：</span>
        <span>{{ fileSystem }}</span>
      </div>
      <div class="info-item">
        <span>总容量：</span>
        <span>{{ totalSize }}</span>
      </div>
      <div class="info-item">
        <span>可用：</span>
        <span>{{ freeSize }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    // LV卷名称
    volumeName: string
    // 总容量 单位G
    precent: number
    totalSize: string
    freeSize: string
    fileSystem: string
  }

  const props = defineProps<Props>()

  // 进度条颜色自适应（绿-黄-红 告警分级，贴合你系统告警组件）
  const progressColor = computed(() => {
    const val = props.precent
    if (val < 70) return '#67c23a' // 正常 绿色
    if (val < 90) return '#e6a23c' // 警告 黄色
    return '#f56c6c' // 爆满 红色
  })
</script>

<style scoped>
  .lv-volume-card {
    padding: 10px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }

  .percent-text {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .progress-box {
    margin-bottom: 16px;
  }

  .volume-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
  }

  /* 强制兜底 彻底矩形无圆角 防止组件自带样式覆盖 */
  :deep(.el-progress-bar__outer) {
    border-radius: 0 !important;
  }
  :deep(.el-progress-bar__inner) {
    border-radius: 0 !important;
  }

  .info-item {
    display: flex;
    gap: 4px;
  }
</style>
