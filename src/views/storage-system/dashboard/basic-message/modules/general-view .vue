<template>
  <div class="storage-overview-container">
    <div class="overview-grid">
      <div class="overview-item">
        <div class="item-icon">
          <i class="el-icon-menu"></i>
        </div>
        <div class="item-content">
          <div class="item-number">{{ generalView?.systemRunTime || '' }}</div>
          <div class="item-label"></div>
        </div>
      </div>
    </div>

    <div class="overview-grid">
      <!-- 阵列 -->
      <div class="overview-item">
        <div class="item-icon">
          <i class="el-icon-menu"></i>
        </div>
        <div class="item-content">
          <div class="item-number">{{ generalView?.raidNumber || 0 }}</div>
          <div class="item-label">阵列</div>
        </div>
      </div>

      <!-- 硬盘 -->
      <div class="overview-item">
        <div class="item-icon">
          <i class="el-icon-hdd"></i>
        </div>
        <div class="item-content">
          <div class="item-number">{{ generalView?.diskNumber || 0 }}</div>
          <div class="item-label">硬盘</div>
        </div>
      </div>

      <!-- 存储池 -->
      <div class="overview-item">
        <div class="item-icon">
          <i class="el-icon-data-line"></i>
        </div>
        <div class="item-content">
          <div class="item-number">{{ generalView?.raidNumber || 0 }}</div>
          <div class="item-label">存储池</div>
        </div>
      </div>

      <!-- 存储卷 -->
      <div class="overview-item">
        <div class="item-icon">
          <i class="el-icon-box"></i>
        </div>
        <div class="item-content">
          <div class="item-number">{{ generalView?.volumeNumber }}</div>
          <div class="item-label">存储卷</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 无逻辑，纯展示组件
  import { fetchGetGeneralView } from '@/api/dashboard-service'
  import { Api } from '@/typings/api'
  const generalView = ref<Api.Dashboard.GeneralView>()
  fetchGetGeneralView().then((res) => {
    console.log('>>', res)
    generalView.value = res
  })
</script>

<style scoped>
  .storage-overview-container {
    padding: 20px;
    height: 80%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  }

  .overview-grid {
    height: 50%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 24px;
  }

  .overview-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 6px;
    transition: background-color 0.3s;
  }

  .overview-item:hover {
    background-color: #f5f7fa;
  }

  .item-icon {
    font-size: 32px;
    color: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-number {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    line-height: 1;
  }

  .item-label {
    font-size: 14px;
    color: #606266;
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .overview-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .item-number {
      font-size: 20px;
    }

    .item-icon {
      font-size: 28px;
    }
  }

  @media (max-width: 480px) {
    .overview-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
