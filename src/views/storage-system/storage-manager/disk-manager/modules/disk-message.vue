<template>
  <div class="demo-collapse">
    <el-collapse v-for="item in diskDeviceList" :key="item.device">
      <el-collapse-item name="1">
        <template #title>
          <div style="display: flex; flex-direction: row; align-items: center">
            <img
              style="width: 80px; height: 80px"
              :src="getDiskHealthStatusImage(item.healthStatus)"
            />
            <div
              style="
                display: flex;
                flex-direction: column;
                align-content: center;
                justify-content: center;
                width: 50%;
              "
            >
              <!-- 第一行：设置为flex布局并两端对齐 -->
              <div style="display: flex; justify-content: space-between; width: 100%">
                <span>硬盘 {{ item.device }} - ({{ item.serialNumber }}) ({{ item.model }})</span>
                <span>{{ item.totalSize }}</span>
              </div>
              <div>
                <span v-if="item.healthStatus === HealthStatus.OK" style="color: #4caf50"
                  >良好</span
                >
                <span v-else-if="item.healthStatus === HealthStatus.WARNING" style="color: #ec6f30"
                  >异常</span
                >
                <span v-else style="color: #e80536">损坏</span>
              </div>
            </div>
          </div>
        </template>
        <div style="margin-left: 80px; width: 50%">
          <div class="detail-item">
            <span>位置:</span>
            <span>{{ item.devicePath }}</span>
          </div>
          <div class="detail-item">
            <span>配置用途:</span>
            <span>{{ item.use }}</span>
          </div>
          <div class="detail-item">
            <span>硬盘状态:</span>
            <span v-if="item.healthStatus === HealthStatus.OK" class="detail-value status-good"
              >良好</span
            >
            <span
              v-else-if="item.healthStatus === HealthStatus.WARNING"
              class="detail-value status-warning"
              >异常</span
            >
            <span v-else class="detail-value status-bad">故障</span>
          </div>
          <div class="detail-item">
            <span>温度:</span>
            <span>{{ item.temperature }}</span>
          </div>
          <div class="detail-item">
            <span>硬盘操作:</span>
            <span>--</span>
          </div>
          <div class="detail-item">
            <span>序列号:</span>
            <span>{{ item.serialNumber }}</span>
          </div>
          <div class="detail-item">
            <span>接口类型:</span>
            <span>{{ item.interfaceType }}</span>
          </div>
          <div class="detail-item">
            <span>4K 原生硬盘:</span>
            <span>否</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { fetchGetDiscDeviceDetailList } from '@/api/system-manage'
  import { HealthStatus } from '@/enums/appEnum'
  // eslint-disable-next-line no-undef
  const diskDeviceList = ref<Disk.Device.DiskDeviceDetail[]>([])
  const getDiskHealthStatusImage = (status: string) => {
    if (status === HealthStatus.OK) {
      return new URL('/src/assets/img/disk-img/disk-ok.png', import.meta.url).href
    } else if (status === HealthStatus.WARNING) {
      return new URL('/src/assets/img/disk-img/disk-waring.png', import.meta.url).href
    } else {
      return new URL('/src/assets/img/disk-img/disk-error.png', import.meta.url).href
    }
  }

  onMounted(() => {
    fetchGetDiscDeviceDetailList().then((res) => {
      if (res) {
        diskDeviceList.value = res.records
      }
    })
  })
</script>
<style scoped>
  .detail-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  /* 标签居左，固定宽度让内容对齐 */
  .detail-label {
    color: #666;
    width: 80px; /* 固定标签宽度，让内容统一对齐 */
    flex-shrink: 0; /* 防止标签被压缩 */
  }

  .detail-value {
    color: #333;
  }

  /* 硬盘状态的样式（和示例一致） */
  .status-good {
    color: #4caf50;
    font-weight: 500;
  }
  .status-warning {
    color: #ec6f30;
    font-weight: 500;
  }
  .status-bad {
    color: #e80536;
    font-weight: 500;
  }
</style>
