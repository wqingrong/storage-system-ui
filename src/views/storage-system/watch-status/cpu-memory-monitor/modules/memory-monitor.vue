<template>
  <div class="custom-card card art-custom-card customer-satisfaction">
    <div class="custom-card-header">
      <span class="title">内存利用率 {{ props.memoryInfo?.usageRate }}%</span>
    </div>
    <div class="custom-card-body">
      <ArtLineChart
        height="100%"
        :data="chartData"
        :xAxisData="xAxisData"
        :showLegend="true"
        :showAxisLabel="true"
        :showAxisLine="false"
        :showSplitLine="true"
      />
    </div>
    <div style="width: 100%">
      <div class="list">
        <div v-for="(item, index) in list" :key="index">
          <p>{{ item.num }}</p>
          <p class="subtitle">{{ item.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { LineDataItem } from '@/types/component/chart'

  interface Props {
    memoryInfo?: Partial<Api.Monitor.MemoryInfo>
  }
  const props = defineProps<Props>()

  interface UsageStatItem {
    name: string
    num: string
  }

  const AREA_STYLE_CONFIG = {
    startOpacity: 0.08,
    endOpacity: 0
  } as const

  const chartData = ref<LineDataItem[]>([
    {
      name: '内存平均使用率%',
      data: [],
      areaStyle: AREA_STYLE_CONFIG
    }
  ])
  /**
   * 内存使用信息
   */
  const list: UsageStatItem[] = [
    { name: '总内存', num: '' },
    { name: '已用容量', num: '' },
    { name: '可用容量', num: '' }
  ]
  const xAxisData = ref<string[]>([])
  const updateData = () => {
    if (props.memoryInfo?.currentTime) {
      xAxisData.value.push(props.memoryInfo.currentTime)
    }
    if (props.memoryInfo?.usageRate) {
      chartData.value[0].data.push(props.memoryInfo.usageRate)
    }
    list[0].num = props.memoryInfo?.totalSize
    list[1].num = props.memoryInfo?.usedSize
    list[2].num = props.memoryInfo?.availableSize
  }
  // 监听 props 变化，当父组件传入新数据时更新
  watch(
    () => props.memoryInfo,
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
      padding: 5px 20px 20px;
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

  .card {
    box-sizing: border-box;
    width: 100%;
    height: 420px;
    padding: 16px;

    .chart {
      box-sizing: border-box;
      width: 100%;
      height: 220px;
      padding: 10px;
      border-radius: calc(var(--custom-radius) / 2 + 4px) !important;
    }

    .list {
      display: flex;
      justify-content: space-between;
      width: 95%;
      align-items: center;
      margin: 0 auto;

      > div {
        flex: 0;

        p {
          font-weight: 400;

          &:first-of-type {
            font-size: 24px;
            color: var(--art-gray-900);
          }

          &:last-of-type {
            font-size: 13px;
          }
        }
      }
    }
  }

  .dark {
    .card {
      .chart {
        background: none;
      }
    }
  }

  @media screen and (max-width: $device-phone) {
    .dark {
      .card {
        .chart {
          padding: 15px 0 0 !important;
        }
      }
    }
  }
</style>
