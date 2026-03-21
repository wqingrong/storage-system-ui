<template>
  <div class="demo-collapse">
    <el-collapse v-for="item in diskDeviceList" :key="item.device" @change="handleChange(item)">
      <el-collapse-item
        name="1"
        :class="currentSelectItemDevice == item.device ? 'active-item' : ''"
      >
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
                width: 80%;
              "
            >
              <!-- 第一行：设置为flex布局并两端对齐 -->
              <div style="display: flex; justify-self: flex-start; width: 100%">
                <div style="width: 60%"
                  ><span
                    >硬盘 {{ item.device }} - ({{ item.serialNumber }}) ({{ item.model }})</span
                  ></div
                >
                <div style="width: 40%">
                  <span>{{ item.totalSize }}</span>
                </div>
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
        <div style="margin-left: 80px; width: 80%">
          <div class="detail-item">
            <div class="detail-label">
              <span>位置:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.devicePath }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>配置用途:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.use }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>健康状态:</span>
            </div>
            <div class="detail-value">
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
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>温度:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.temperature }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>硬盘操作:</span>
            </div>
            <div class="detail-value">
              <span>--</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>序列号:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.serialNumber }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>接口类型:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.interfaceType }}</span>
            </div>
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
  import { Disk } from '@/typings/disk'
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
  const currentSelectItemDevice = ref('')
  const handleChange = (item: Disk.Device.DiskDeviceDetail) => {
    if (currentSelectItemDevice.value === item.device) {
      currentSelectItemDevice.value = ''
    } else {
      currentSelectItemDevice.value = item.device
    }
  }
  onMounted(() => {
    console.log('>>>页面挂载...')
    fetchGetDiscDeviceDetailList().then((res) => {
      if (res) {
        diskDeviceList.value = res.records
      }
    })
  })
</script>
<style scoped>
  .active-item {
    background-color: #5e91e2 !important;
  }

  .detail-item {
    display: flex;
    justify-self: flex-start;
    width: 100%;
  }

  /* 标签居左，固定宽度让内容对齐 */
  .detail-label {
    width: 60%;
    color: #666;
    flex-shrink: 0; /* 防止标签被压缩 */
  }

  .detail-value {
    width: 40%;
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
