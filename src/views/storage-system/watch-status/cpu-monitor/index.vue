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
  </div>
</template>

<script setup lang="ts">
  import CpuItemStatus from './modules/cpu-item-status.vue'
  import CpuAvgUsage from './modules/cpu-avg-usage.vue'
  import { fetchGetCPUStatusInfo } from '@/api/monitor-manager'
  defineOptions({ name: 'BasicAnalysis' })
  const CPUStatusInfo = ref<Api.Monitor.CPUStatusInfo>({
    avgUsageRate: 0,
    avgIdle: 0,
    currentTime: '0',
    cpuItemStatusInfoList: []
  })
  const loadingCpuStatusInfo = () => {
    fetchGetCPUStatusInfo().then((res) => {
      CPUStatusInfo.value = res
    })
  }
  const timoutPlan = () => {
    loadingCpuStatusInfo()
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
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
