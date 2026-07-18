<template>
  <div class="card art-custom-card sales-card" style="height: auto">
    <div class="card-header">
      <p class="title">阵列信息</p>
    </div>

    <!-- 空状态 -->
    <ElEmpty v-if="storagePoolList.length === 0" :image-size="200" description="暂无存储池" />

    <div v-for="(item, index) in storagePoolList" :key="index" class="pool-row">
      <!-- 顶部：池名称 + 容量概览 + 状态醒目卡片 -->
      <div
        class="pool-header"
        :style="{ borderLeftColor: getStoragePoolStatus(item.poolStatus).color }"
      >
        <!-- 存储池状态醒目卡片 -->
        <div
          class="pool-status-card"
          :class="`status-${getStoragePoolStatus(item.poolStatus).status}`"
        >
          <div class="status-card-left">
            <img
              class="status-img"
              :src="getStoragePoolStatus(item.poolStatus).imageUrl"
              alt="status"
            />
          </div>
          <div class="status-card-middle">
            <div class="status-label">存储池状态</div>
            <div
              class="status-value"
              :style="{ color: getStoragePoolStatus(item.poolStatus).color }"
            >
              {{ getStoragePoolStatus(item.poolStatus).statusTxt }}
            </div>
            <div class="status-pool-name">{{ item.poolName }}</div>
          </div>
          <!-- 右上角状态角标 -->
          <div
            class="status-card-badge"
            :style="{ backgroundColor: getStoragePoolStatus(item.poolStatus).color }"
          >
            {{ getStoragePoolStatus(item.poolStatus).statusTxt }}
          </div>
        </div>

        <!-- 容量概览 -->
        <div class="capacity-summary">
          <div class="capacity-item">
            <span class="capacity-value">{{ item.storageSize }}</span>
            <span class="capacity-label">总容量</span>
          </div>
          <div class="capacity-divider"></div>
          <div class="capacity-item">
            <span class="capacity-value">{{ item.freeSize }}</span>
            <span class="capacity-label">未分配</span>
          </div>
          <div class="capacity-divider"></div>
          <div class="capacity-item">
            <span class="capacity-value">{{ item.useRatio }}%</span>
            <span class="capacity-label">已使用</span>
          </div>
        </div>

        <!-- 状态指示点（WARN/ERROR 时呼吸灯） -->
        <span
          class="status-dot"
          :style="{ backgroundColor: getStoragePoolStatus(item.poolStatus).color }"
          :class="{
            'pulse-warn':
              getStoragePoolStatus(item.poolStatus).status === 'WARN' ||
              getStoragePoolStatus(item.poolStatus).status === 'ERROR'
          }"
        ></span>

        <!-- 详情按钮 -->
        <el-button type="primary" link class="detail-btn" @click="goToStorageSpace">
          详情
          <ElIcon class="detail-icon"><ArrowRight /></ElIcon>
        </el-button>
      </div>

      <!-- 存储卷列表 -->
      <div class="volume-list">
        <div class="volume-list-title">存储卷</div>
        <div class="volume-grid">
          <volumeProgress
            v-for="(volume, vIndex) in item.storageSpaceList"
            :key="vIndex"
            :volume-name="volume.spaceName"
            :free-size="volume.freeSize"
            :total-size="volume.spaceSize"
            :precent="volume.useRatio"
            :file-system="volume.fileSystem"
          />
        </div>
        <ElEmpty
          v-if="!item.storageSpaceList || item.storageSpaceList.length === 0"
          :image-size="60"
          description="暂无存储卷"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ArrowRight } from '@element-plus/icons-vue'
  import volumeProgress from './volume-progress.vue'
  import { Disk } from '@/typings/disk'
  import { fetchGetStoragePoolList } from '@/api/system-manage'
  import { getStoragePoolStatus } from '@utils/tools'

  const router = useRouter()

  const storagePoolList = ref<Disk.Device.StoragePool[]>([])

  onMounted(() => {
    refreshStorageSpaceData()
  })

  const refreshStorageSpaceData = () => {
    fetchGetStoragePoolList().then((res) => {
      if (res) {
        storagePoolList.value = res.records
      }
    })
  }

  /** 跳转到存储管理 → 存储空间页面 */
  const goToStorageSpace = () => {
    router.push('/storage-manager/storage-space')
  }
</script>

<style scoped>
  /* ===== 存储池行间距 ===== */
  .pool-row {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #ebeef5;
  }
  .pool-row:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  /* ===== 顶部信息栏：状态卡 + 容量 + 指示点 ===== */
  .pool-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 16px;
    margin-bottom: 18px;
    border-left: 4px solid #4caf50;
    border-radius: 0 8px 8px 0;
    background: #fafbfc;
    transition: border-color 0.3s;
    flex-wrap: wrap;
  }

  /* ===== 存储池状态醒目卡片 ===== */
  .pool-status-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    border-radius: 10px;
    background: #f8f9fc;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    min-width: 240px;
    transition:
      background 0.3s,
      border-color 0.3s;
  }

  .status-card-left {
    flex-shrink: 0;
  }

  .status-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .status-card-middle {
    flex: 1;
    min-width: 0;
  }

  .status-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 2px;
  }

  .status-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
  }

  .status-pool-name {
    font-size: 13px;
    color: #606266;
    margin-top: 2px;
  }

  /* 右上角状态角标 */
  .status-card-badge {
    position: absolute;
    top: 0;
    right: 0;
    padding: 4px 16px 4px 20px;
    font-size: 12px;
    color: #fff;
    border-radius: 0 10px 0 12px;
    font-weight: 500;
    letter-spacing: 1px;
  }

  /* 不同状态的背景色 */
  .pool-status-card.status-OK {
    background: #f0f9f0;
    border: 1px solid #c8e6c9;
  }
  .pool-status-card.status-WARN {
    background: #fef7f0;
    border: 1px solid #ffe0b2;
  }
  .pool-status-card.status-ERROR {
    background: #fef0f0;
    border: 1px solid #ffcdd2;
  }

  /* ===== 容量概览 ===== */
  .capacity-summary {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    min-width: 200px;
  }

  .capacity-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .capacity-value {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    line-height: 1;
  }

  .capacity-label {
    font-size: 12px;
    color: #909399;
  }

  .capacity-divider {
    width: 1px;
    height: 32px;
    background: #dcdfe6;
  }

  /* 详情按钮 */
  .detail-btn {
    flex-shrink: 0;
    font-size: 13px;

    .detail-icon {
      margin-left: 2px;
      font-size: 12px;
    }
  }

  /* 状态指示点 */
  .status-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
    margin-left: auto;
  }

  /* 警告/异常呼吸灯动画 */
  .status-dot.pulse-warn {
    animation: pool-pulse-warn 2s ease-in-out infinite;
  }

  @keyframes pool-pulse-warn {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(236, 111, 48, 0.6);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(236, 111, 48, 0);
    }
  }

  /* ===== 存储卷列表 ===== */
  .volume-list {
    padding: 0 4px;
  }

  .volume-list-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }

  .volume-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  /* ===== 响应式 ===== */
  @media (max-width: 768px) {
    .pool-header {
      flex-direction: column;
      align-items: stretch;
      border-left: none;
      border-top: 4px solid #4caf50;
      border-radius: 0 0 8px 8px;
      padding: 12px;
    }

    .pool-status-card {
      min-width: auto;
    }

    .capacity-summary {
      justify-content: space-around;
    }

    .status-dot {
      margin-left: 0;
      align-self: center;
    }

    .volume-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
