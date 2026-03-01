<template>
  <div class="custom-card total-revenue-card art-custom-card">
    <div class="custom-card-header">
      <span class="title">CPU各核心利用率</span>
    </div>
    <div class="custom-card-body">
      <ArtBarChart
        height="100%"
        :data="revenueData"
        :xAxisData="cpuList"
        :showLegend="true"
        :showAxisLine="false"
        barWidth="18%"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    cpuStatusInfo?: Partial<Api.Monitor.CPUStatusInfo>
  }
  const props = defineProps<Props>()
  interface RevenueDataItem {
    name: string
    data: number[]
  }

  const revenueData = ref<RevenueDataItem[]>([
    {
      name: 'cpu利用率',
      data: []
    }
  ])
  const cpuList = ref<string[]>([])

  const updateData = () => {
    // 清空现有数据
    cpuList.value = []
    revenueData.value[0].data = []

    if (props.cpuStatusInfo?.cpuItemStatusInfoList) {
      props.cpuStatusInfo.cpuItemStatusInfoList.forEach((item) => {
        if (item) {
          cpuList.value.push(item.cpuIndex)
          revenueData.value[0].data.push(item.usageRate)
        }
      })
    }
  }
  // 监听 props 变化，当父组件传入新数据时更新
  watch(
    () => props.cpuStatusInfo,
    () => {
      updateData()
    },
    {
      deep: true, // 深度监听对象内部变化
      immediate: true // 立即执行一次
    }
  )
</script>

<style lang="scss" scoped>
  .total-revenue-card {
    height: 400px;

    .custom-card-body {
      height: calc(100% - 108px);
      padding: 20px;
    }
  }

  @media screen and (max-width: $device-phone) {
    .total-revenue-card {
      height: 300px;
    }
  }
</style>
