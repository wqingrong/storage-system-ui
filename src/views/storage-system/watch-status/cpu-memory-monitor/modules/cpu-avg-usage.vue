<template>
  <div class="custom-card art-custom-card customer-satisfaction">
    <div class="custom-card-header">
      <span class="title">CPU平均利用率 {{ props.cpuStatusInfo.avgUsageRate }} %</span>
    </div>
    <div class="custom-card-body">
      <ArtLineChart
        height="100%"
        :data="chartData"
        :xAxisData="xAxisData"
        :showLegend="true"
        :showAxisLabel="true"
        :showAxisLine="false"
        :showXAxisLabel="false"
        :showSplitLine="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { LineDataItem } from '@/types/component/chart'
  interface Props {
    cpuStatusInfo?: Partial<Api.Monitor.CPUStatusInfo>
  }
  /**
   */
  const AREA_STYLE_CONFIG = {
    startOpacity: 0.08,
    endOpacity: 0
  } as const

  const chartData = ref<LineDataItem[]>([
    {
      name: 'cpu平均利用率%',
      data: [],
      areaStyle: AREA_STYLE_CONFIG
    }
  ])

  const props = defineProps<Props>()
  /**
   */
  const xAxisData = ref<string[]>([])
  const updateData = () => {
    if (props.cpuStatusInfo?.currentTime) {
      xAxisData.value.push(props.cpuStatusInfo.currentTime)
    }
    if (props.cpuStatusInfo?.avgUsageRate) {
      chartData.value[0].data.push(props.cpuStatusInfo.avgUsageRate)
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
  .customer-satisfaction {
    height: 400px;

    .custom-card-body {
      height: calc(100% - 145px);
      padding: 60px 20px 10px;
    }
  }

  @media screen and (max-width: $device-phone) {
    .customer-satisfaction {
      height: 300px;

      .custom-card-body {
        height: calc(100% - 100px);
        padding-top: 20px;
      }
    }
  }
</style>
