<template>
  <div
    v-for="(value, key) in diskList"
    :key="key"
    class="custom-card art-custom-card customer-satisfaction"
    style="margin-bottom: 40px"
  >
    <div class="custom-card-header">
      <span class="title">磁盘设备：/dev/{{ value }} 利用率{{ utilsMap.get(value) }}%</span>
    </div>
    <div class="custom-card-body">
      <ArtLineChart
        :data="diskMap.get(value)?.chartData || []"
        :xAxisData="diskMap.get(value)?.xAxiosData || []"
        :showLegend="false"
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
  defineOptions({ name: 'DiskIoStatWatch' })

  const wsStore = websocketStore()
  const { on } = wsStore.getWS()
  const diskList = ref<string[]>([])
  // 磁盘 IO 数据结构
  class DiskIoStats {
    public device: string = ''
    public rrqm_s: number = 0
    public wrqm_s: number = 0
    public r_s: number = 0
    public w_s: number = 0
    public r_mb_s: number = 0
    public w_mb_s: number = 0
    public avg_rq_sz: number = 0
    public avg_qu_sz: number = 0
    public await: number = 0
    public r_await: number = 0
    public w_await: number = 0
    public svctm: number = 0
    public util: number = 0
    public time: string = ''
  }

  // 图表数据结构
  class WatchDiskData {
    public device: string = ''
    public chartData: LineDataItem[] = []
    public xAxiosData: string[] = []
  }

  const colors = [
    '#FF6B6B', // 红
    '#4ECDC4', // 青
    '#45B7D1', // 蓝
    '#96CEB4', // 薄荷绿
    '#FECA57', // 黄
    '#FF9FF3', // 粉
    '#54A0FF', // 天蓝
    '#5F27CD', // 紫
    '#00D2D3', // 青绿
    '#FF9F43', // 橙
    '#C44569', // 玫瑰红
    '#2ECC71', // 绿
    '#E17055' // 砖红
  ]

  //  修复：必须用 ref 响应式 Map
  const diskMap = ref<Map<string, WatchDiskData>>(new Map())
  const utilsMap = ref<Map<string, number>>(new Map())
  on('message', (data: any) => {
    switch (data.type) {
      case 'io_watch':
        data.data.forEach((item: any) => {
          const iostats = new DiskIoStats()
          Object.assign(iostats, item)
          // ✅ 修复：逻辑颠倒！has 存在 = 更新，不存在 = 新增
          utilsMap.value.set(iostats.device, iostats.util)
          if (diskMap.value.has(iostats.device)) {
            // ============== 更新已有磁盘 ==============
            const fieldsMap = new Map([
              ['r_s 每秒读 IO 次数(次/秒)', 'r_s'],
              ['w_s 每秒写 IO 次数(次/秒', 'w_s'],
              ['r_mb_s 每秒读取量(MB/s)', 'r_mb_s'],
              ['w_mb_s 每秒写入量(MB/s)', 'w_mb_s'],
              ['avg_rq_sz 平均 IO 请求大小', 'avg_rq_sz'],
              ['avg_qu_sz 平均 IO 队列长度(个)', 'avg_qu_sz'],
              ['await 平均 IO 等待时间(ms)', 'await'],
              ['r_await 读等待时间(ms)', 'r_await'],
              ['w_await 写等待时间(ms)', 'w_await'],
              ['svctm 平均服务时间(ms)', 'svctm'],
              ['util 磁盘使用率(%)', 'util']
            ])

            const target = diskMap.value.get(iostats.device)
            if (!target) return
            target.chartData.forEach((chartItem) => {
              if (fieldsMap.has(chartItem.name)) {
                chartItem.data.push(
                  iostats[fieldsMap.get(chartItem.name) as keyof DiskIoStats] as number
                )
              }
            })

            target.xAxiosData.push(iostats.time)
          } else {
            const watchData = new WatchDiskData()
            watchData.device = iostats.device
            watchData.chartData.push(
              { name: 'r_s 每秒读 IO 次数(次/秒)', data: [iostats.r_s] },
              { name: 'w_s 每秒写 IO 次数(次/秒', data: [iostats.w_s] },
              { name: 'r_mb_s 每秒读取量(MB/s)', data: [iostats.r_mb_s] },
              { name: 'w_mb_s 每秒写入量(MB/s)', data: [iostats.w_mb_s] },
              { name: 'avg_rq_sz 平均 IO 请求大小', data: [iostats.avg_rq_sz] },
              { name: 'avg_qu_sz 平均 IO 队列长度(个)', data: [iostats.avg_qu_sz] },
              { name: 'await 平均 IO 等待时间(ms)', data: [iostats.await] },
              { name: 'r_await 读等待时间(ms)', data: [iostats.r_await] },
              { name: 'w_await 写等待时间(ms)', data: [iostats.w_await] },
              { name: 'svctm 平均服务时间(ms)', data: [iostats.svctm] },
              { name: 'util 磁盘使用率(%)', data: [iostats.util] }
            )

            watchData.xAxiosData.push(iostats.time)
            diskMap.value.set(iostats.device, watchData)
            if (!diskList.value.includes(iostats.device)) {
              diskList.value.push(iostats.device)
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
</style>
