<template>
  <div class="analysis-dashboard">
    <ElRow :gutter="20" class="mt-20">
      <ElCol :span="12">
        <CpuAvgUsage :cpuStatusInfo="CPUStatusInfo" />
      </ElCol>

      <ElCol :span="12">
        <CpuItemStatus :cpuStatusInfo="CPUStatusInfo" />
      </ElCol>
    </ElRow>
    <ElRow :gutter="20" class="mt-20">
      <ElCol :span="12">
        <MemoryMonitor :memoryInfo="memoryInfo" />
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import CpuItemStatus from './modules/cpu-item-status.vue'
  import CpuAvgUsage from './modules/cpu-avg-usage.vue'
  import MemoryMonitor from './modules/memory-monitor.vue'
  import { fetchGetCPUStatusInfo, fetchGetMemoryInfo } from '@/api/monitor-manager'
  defineOptions({ name: 'BasicAnalysis' })
  const CPUStatusInfo = ref<Api.Monitor.CPUStatusInfo>({
    avgUsageRate: 0,
    avgIdle: 0,
    currentTime: '',
    cpuItemStatusInfoList: []
  })

  const memoryInfo = ref<Api.Monitor.MemoryInfo>({
    totalSize: '',
    usedSize: '',
    freeSize: '',
    availableSize: '',
    usageRate: 0,
    currentTime: '',
    swapeMemoryInfo: {
      totalSize: '',
      usedSize: '',
      freeSize: '',
      availableSize: '',
      usageRate: 0,
      currentTime: ''
    }
  })
  const loadingCpuStatusInfo = () => {
    fetchGetCPUStatusInfo().then((res) => {
      CPUStatusInfo.value = res
    })
  }

  const loadingMemoryInfo = () => {
    fetchGetMemoryInfo().then((res) => {
      memoryInfo.value = res
    })
  }

  const timoutPlan = () => {
    loadingCpuStatusInfo()
    loadingMemoryInfo()
  }
  let timer = null
  const startTimer = () => {
    if (timer) {
      return
    }
    timer = setInterval(() => {
      timoutPlan()
    }, 5000)
  }
  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onMounted(() => {
    loadingCpuStatusInfo()
    loadingMemoryInfo()
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
