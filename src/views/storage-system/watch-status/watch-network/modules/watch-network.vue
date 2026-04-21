<template>
  <div
    v-for="(value, key) in netDeviceList"
    :key="key"
    class="custom-card art-custom-card customer-satisfaction"
    style="margin-bottom: 40px"
  >
    <div class="custom-card-body">
      <div class="custom-card-header" style="display: flex; justify-content: start">
        <div class="title_net">网口: {{ value }}</div>
        <div class="title_net">上行速度: {{ kbConvertAdapter(lastData.get(value)?.tx || 0) }}</div>
        <div class="title_net">下行速度: {{ kbConvertAdapter(lastData.get(value)?.rx || 0) }}</div>
      </div>
      <ArtLineChart
        label="value"
        :data="netDeviceMap.get(value)?.chartData || []"
        :xAxisData="netDeviceMap.get(value)?.xAxiosData || []"
        :showLegend="true"
        :showAxisLabel="true"
        :showAxisLine="false"
        :showXAxisLabel="false"
        :showSplitLine="true"
        :colors="colors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { LineDataItem } from '@/types/component/chart'
  import { websocketStore } from '@/store/modules/websocket'
  import { ref } from 'vue'
  import { kbConvertAdapter } from '@utils/tools'
  defineOptions({ name: 'DiskIoStatWatch' })

  const wsStore = websocketStore()
  const { on } = wsStore.getWS()
  const diskList = ref<string[]>([])
  // 磁盘 IO 数据结构
  class NetworkSpeedStats {
    public device: string = ''
    public rx: number = 0
    public tx: number = 0
    public unit: string = ''
    public time: string = ''
  }
  const lastData = ref<Map<string, NetworkSpeedStats>>(new Map<string, NetworkSpeedStats>())
  // 图表数据结构
  class WatchNetworkData {
    public device: string = ''
    public chartData: LineDataItem[] = []
    public xAxiosData: string[] = []
  }

  const netDeviceList = ref<string[]>([])
  const netDeviceMap = ref<Map<string, WatchNetworkData>>(new Map())
  const colors = [
    '#2ECC71', // 绿
    '#3f47e8' // 蓝
  ]

  on('message', (data: any) => {
    switch (data.type) {
      case 'net_speed':
        data.data.forEach((item: any) => {
          const device = new NetworkSpeedStats()
          Object.assign(device, item)
          lastData.value.set(device.device, device)
          if (!netDeviceList.value.includes(device.device)) {
            netDeviceList.value.push(device.device)
          }
          if (netDeviceMap.value.has(device.device)) {
            // ============== 更新已有磁盘 ==============
            const fieldsMap = new Map([
              ['rx 下行 KB/S', 'rx'],
              ['tx 上行 KB/S', 'tx'],
              ['unit 单位', 'KB/S']
            ])

            const target = netDeviceMap.value.get(device.device)
            if (!target) return
            target.chartData.forEach((chartItem) => {
              if (fieldsMap.has(chartItem.name)) {
                chartItem.data.push(
                  device[fieldsMap.get(chartItem.name) as keyof NetworkSpeedStats] as number
                )
              }
            })

            target.xAxiosData.push(device.time)
          } else {
            const watchData = new WatchNetworkData()
            watchData.device = device.device
            watchData.chartData.push(
              { name: 'rx 下行 KB/S', data: [device.rx] },
              { name: 'tx 上行 KB/S', data: [device.tx] }
            )

            watchData.xAxiosData.push(device.time)
            netDeviceMap.value.set(device.device, watchData)
            if (!diskList.value.includes(device.device)) {
              diskList.value.push(device.device)
            }
          }
        })
        break
      default:
        break
    }
  })
</script>

<style lang="scss" scss>
  .customer-satisfaction {
    height: auto;

    .custom-card-body {
      height: calc(100% - 50px);
      padding: 10px 20px;
    }
  }

  @media screen and (max-width: 768px) {
    .customer-satisfaction {
      height: 300px;
    }
  }
  .title_net {
    margin-right: 10px;
    height: 50px;
    line-height: 50px;
  }
</style>
