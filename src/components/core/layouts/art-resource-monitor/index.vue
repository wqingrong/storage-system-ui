<template>
  <div>
    <!-- 折叠态：可拖拽悬浮条 -->
    <div
      v-if="!expanded"
      class="resource-float-bar"
      :style="floatBarStyle"
      @mousedown="startFloatDrag"
    >
      <span class="float-item cpu">
        <span class="dot cpu-dot" />
        CPU {{ cpuInfo.avgUsageRate }}%
      </span>
      <span class="float-item mem">
        <span class="dot mem-dot" />
        MEM {{ memInfo.usageRate }}%
      </span>
      <span class="float-item net">
        <span class="dot net-dot" />
        ↑{{ netUpload }} ↓{{ netDownload }}
      </span>
    </div>

    <!-- 展开态：可拖拽、可调整宽高的弹窗 -->
    <div v-else class="resource-panel" :style="panelStyle" @mousedown="bringToFront">
      <!-- 标题栏（拖拽区） -->
      <div class="panel-header" @mousedown="startDrag">
        <span class="panel-title">资源监控</span>
        <div class="panel-actions">
          <ElButton link size="small" @click="toggleCollapse">
            <span class="collapse-icon">{{ collapsed ? '▤' : '▢' }}</span>
          </ElButton>
          <ElButton link size="small" @click="expanded = false"> ✕ </ElButton>
        </div>
      </div>

      <!-- 内容区 -->
      <div v-show="!collapsed" class="panel-body">
        <ElTabs v-model="activeTab" class="monitor-tabs">
          <ElTabPane label="CPU / 内存" name="cpu-mem">
            <div class="tab-content">
              <div class="metric-header">
                CPU {{ cpuInfo.avgUsageRate }}% &nbsp;|&nbsp; 内存 {{ memInfo.usageRate }}%
              </div>
              <div class="chart-wrap">
                <ArtLineChart
                  height="100%"
                  :data="combinedCpuMemChartData"
                  :x-axis-data="cpuMemXAxis"
                  :show-legend="true"
                  :show-axis-label="false"
                  :show-axis-line="false"
                  :show-x-axis-label="false"
                  :show-split-line="true"
                  :colors="['#409eff', '#67c23a']"
                />
              </div>
              <div class="mem-stats">
                <div class="mem-stat">
                  <span class="mem-label">总内存</span>
                  <span class="mem-value">{{ memInfo.totalSize }}</span>
                </div>
                <div class="mem-stat">
                  <span class="mem-label">已用</span>
                  <span class="mem-value">{{ memInfo.usedSize }}</span>
                </div>
                <div class="mem-stat">
                  <span class="mem-label">可用</span>
                  <span class="mem-value">{{ memInfo.availableSize }}</span>
                </div>
              </div>
            </div>
          </ElTabPane>

          <ElTabPane label="网络" name="network">
            <div class="tab-content network-tab">
              <div class="metric-header">
                总上行 {{ netUpload }} &nbsp; 总下行 {{ netDownload }}
              </div>
              <div class="chart-wrap network-combined-chart">
                <ArtLineChart
                  height="100%"
                  :data="combinedNetChartData"
                  :x-axis-data="netTotalXAxis"
                  :show-legend="true"
                  :show-axis-label="false"
                  :show-axis-line="false"
                  :show-x-axis-label="false"
                  :show-split-line="true"
                  :y-axis-unit="'KB'"
                  :tool-tip-unit="'KB'"
                  :colors="combinedNetColors"
                />
              </div>
              <!-- 各网卡当前速率 -->
              <div class="nic-info-list">
                <div v-for="device in netDeviceList" :key="device" class="nic-info-row">
                  <span
                    class="nic-dot"
                    :style="{ background: nicColorMap[device]?.up || '#999' }"
                  />
                  <span class="nic-label">{{ device }}</span>
                  <span class="nic-up"
                    >↑ {{ kbConvertAdapter(lastNetData.get(device)?.tx || 0) }}</span
                  >
                  <span
                    class="nic-dot"
                    :style="{ background: nicColorMap[device]?.down || '#666' }"
                  />
                  <span class="nic-down"
                    >↓ {{ kbConvertAdapter(lastNetData.get(device)?.rx || 0) }}</span
                  >
                </div>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>

      <!-- 调整大小手柄 -->
      <div class="resize-handle" @mousedown.stop="startResize" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
  import type { LineDataItem } from '@/types/component/chart'
  import { echarts } from '@/utils/echarts'
  import { websocketStore } from '@/store/modules/websocket'
  import { kbConvertAdapter } from '@utils/tools'

  defineOptions({ name: 'ArtResourceMonitor' })

  // ===== 展开/折叠/层级 =====
  const expanded = ref(false)
  const collapsed = ref(false)
  const zIndex = ref(5000)
  let zCounter = 5000

  const bringToFront = () => {
    zCounter++
    zIndex.value = zCounter
  }

  const toggleCollapse = () => {
    collapsed.value = !collapsed.value
    if (collapsed.value) {
      panelWidth.value = 400
      panelHeight.value = 48
    } else {
      panelWidth.value = 600
      panelHeight.value = 600
    }
  }

  // ===== 折叠态悬浮条位置 =====
  const floatBarX = ref(0) // onMounted 中动态计算
  const floatBarY = ref(12)

  const floatBarStyle = computed(() => ({
    left: floatBarX.value + 'px',
    top: floatBarY.value + 'px'
  }))

  // ===== 位置 / 尺寸（最大 600×600） =====
  const panelX = ref(window.innerWidth - 620)
  const panelY = ref(60)
  const panelWidth = ref(600)
  const panelHeight = ref(600)

  const panelStyle = computed(() => ({
    left: panelX.value + 'px',
    top: panelY.value + 'px',
    width: panelWidth.value + 'px',
    height: panelHeight.value + 'px',
    zIndex: zIndex.value
  }))

  // ===== 拖拽 =====
  let dragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragOrigX = 0
  let dragOrigY = 0

  const startDrag = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-actions')) return
    dragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragOrigX = panelX.value
    dragOrigY = panelY.value
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (e: MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    panelX.value = Math.max(0, Math.min(window.innerWidth - panelWidth.value, dragOrigX + dx))
    panelY.value = Math.max(0, Math.min(window.innerHeight - 40, dragOrigY + dy))
  }

  const stopDrag = () => {
    dragging = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  // ===== 折叠态悬浮条拖拽（点击展开 / 拖动移位） =====
  let floatDragging = false
  let floatDragStartX = 0
  let floatDragStartY = 0
  let floatDragOrigX = 0
  let floatDragOrigY = 0
  let floatHasMoved = false

  const startFloatDrag = (e: MouseEvent) => {
    floatDragging = true
    floatHasMoved = false
    floatDragStartX = e.clientX
    floatDragStartY = e.clientY
    floatDragOrigX = floatBarX.value
    floatDragOrigY = floatBarY.value
    document.addEventListener('mousemove', onFloatDrag)
    document.addEventListener('mouseup', stopFloatDrag)
  }

  const onFloatDrag = (e: MouseEvent) => {
    if (!floatDragging) return
    const dx = e.clientX - floatDragStartX
    const dy = e.clientY - floatDragStartY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      floatHasMoved = true
    }
    floatBarX.value = Math.max(0, Math.min(window.innerWidth - 200, floatDragOrigX + dx))
    floatBarY.value = Math.max(0, Math.min(window.innerHeight - 40, floatDragOrigY + dy))
  }

  const stopFloatDrag = () => {
    floatDragging = false
    document.removeEventListener('mousemove', onFloatDrag)
    document.removeEventListener('mouseup', stopFloatDrag)
    // 未拖动视为点击 → 展开面板
    if (!floatHasMoved) {
      expanded.value = true
    }
  }

  // ===== 调整大小 =====
  let resizing = false
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeOrigW = 0
  let resizeOrigH = 0

  const startResize = (e: MouseEvent) => {
    resizing = true
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeOrigW = panelWidth.value
    resizeOrigH = panelHeight.value
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)
  }

  const onResize = (e: MouseEvent) => {
    if (!resizing) return
    panelWidth.value = Math.max(400, Math.min(600, resizeOrigW + (e.clientX - resizeStartX)))
    panelHeight.value = Math.max(300, Math.min(600, resizeOrigH + (e.clientY - resizeStartY)))
  }

  const stopResize = () => {
    resizing = false
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
  }

  // 窗口 resize 时修正悬浮条不超出屏幕
  const clampFloatBar = () => {
    floatBarX.value = Math.max(0, Math.min(window.innerWidth - 200, floatBarX.value))
    floatBarY.value = Math.max(0, Math.min(window.innerHeight - 40, floatBarY.value))
  }

  // ===== Tab =====
  const activeTab = ref('cpu-mem')

  // ===== CPU 数据 =====
  const cpuInfo = ref<Api.Monitor.CPUStatusInfo>({
    avgUsageRate: 0,
    avgIdle: 0,
    currentTime: '',
    cpuItemStatusInfoList: []
  })

  const cpuChartData = ref<LineDataItem[]>([
    { name: 'CPU利用率%', data: [], areaStyle: { startOpacity: 0.08, endOpacity: 0 } }
  ])

  // ===== 内存数据 =====
  const memInfo = ref<Api.Monitor.MemoryInfo>({
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

  const memChartData = ref<LineDataItem[]>([
    { name: '内存利用率%', data: [], areaStyle: { startOpacity: 0.08, endOpacity: 0 } }
  ])

  // CPU 和内存共用 X 轴
  const cpuMemXAxis = ref<string[]>([])

  const combinedCpuMemChartData = computed<LineDataItem[]>(() => [
    ...cpuChartData.value,
    ...memChartData.value
  ])

  // ===== WebSocket 数据（CPU/内存 + 网络） =====
  const netUpload = ref('0 KB/s')
  const netDownload = ref('0 KB/s')

  // 汇总图表
  const netTotalChartData = ref<LineDataItem[]>([
    { name: 'tx 上行', data: [] },
    { name: 'rx 下行', data: [] }
  ])
  const netTotalXAxis = ref<string[]>([])

  // 各网卡独立数据
  class NetworkSpeedStats {
    device = ''
    rx = 0
    tx = 0
    unit = ''
    time = ''
  }
  class WatchNetworkData {
    device = ''
    chartData: LineDataItem[] = []
    xAxiosData: string[] = []
  }

  const netDeviceList = ref<string[]>([])
  const lastNetData = ref<Map<string, NetworkSpeedStats>>(new Map())
  const netDeviceMap = ref<Map<string, WatchNetworkData>>(new Map())

  // 每网口一对待定颜色（上行亮色 / 下行暗色）
  const NIC_COLOR_PAIRS = [
    { up: '#2ECC71', down: '#1a7a40' },
    { up: '#3f47e8', down: '#23288a' },
    { up: '#e67e22', down: '#a05515' },
    { up: '#9b59b6', down: '#6a3d7d' },
    { up: '#1abc9c', down: '#0e6b5c' },
    { up: '#e74c3c', down: '#a02020' },
    { up: '#3498db', down: '#1d5fa0' },
    { up: '#f39c12', down: '#b0700c' }
  ]

  const nicColorMap = computed(() => {
    const map: Record<string, { up: string; down: string }> = {}
    netDeviceList.value.forEach((dev, i) => {
      map[dev] = NIC_COLOR_PAIRS[i % NIC_COLOR_PAIRS.length]
    })
    return map
  })

  const combinedNetColors = computed(() => {
    const colors: string[] = []
    netDeviceList.value.forEach((dev) => {
      const pair = nicColorMap.value[dev]
      if (pair) {
        colors.push(pair.up, pair.down)
      }
    })
    return colors
  })

  const combinedNetChartData = computed<LineDataItem[]>(() => {
    const series: LineDataItem[] = []
    netDeviceList.value.forEach((dev) => {
      const deviceData = netDeviceMap.value.get(dev)
      const txData = deviceData?.chartData?.find((c) => c.name === 'tx 上行')?.data || []
      const rxData = deviceData?.chartData?.find((c) => c.name === 'rx 下行')?.data || []
      series.push({ name: `${dev} 上行`, data: [...txData] })
      series.push({ name: `${dev} 下行`, data: [...rxData] })
    })
    return series
  })

  const setupWebSocket = () => {
    try {
      const wsStore = websocketStore()
      const { on, send } = wsStore.getWS()

      // 订阅 CPU/内存 和 网络 数据
      send({ type: 'witch_cpu_memory_net', timestamp: Date.now() })
      on('message', (data: any) => {
        switch (data.type) {
          case 'cpu_memory_net': {
            const { cpuInfo: cpu, memoryInfo: mem, netInfo: devices } = data.data || {}
            const time = cpu?.currentTime || mem?.currentTime || ''
            if (time) {
              cpuMemXAxis.value.push(time)
              if (cpuMemXAxis.value.length > 100) cpuMemXAxis.value.shift()
            }
            if (cpu) {
              cpuInfo.value = cpu
              cpuChartData.value[0].data.push(cpu.avgUsageRate)
              if (cpuChartData.value[0].data.length > 100) cpuChartData.value[0].data.shift()
            }
            if (mem) {
              memInfo.value = mem
              memChartData.value[0].data.push(mem.usageRate)
              if (memChartData.value[0].data.length > 100) memChartData.value[0].data.shift()
            }
            if (devices) {
              if (devices.length === 0) break

              let totalRx = 0
              let totalTx = 0
              let latestTime = ''

              devices.forEach((item: any) => {
                const stats = new NetworkSpeedStats()
                Object.assign(stats, item)
                lastNetData.value.set(stats.device, stats)

                totalRx += stats.rx
                totalTx += stats.tx
                latestTime = stats.time || latestTime

                if (!netDeviceList.value.includes(stats.device)) {
                  netDeviceList.value.push(stats.device)
                }

                if (netDeviceMap.value.has(stats.device)) {
                  const fieldsMap = new Map([
                    ['tx 上行', 'tx'],
                    ['rx 下行', 'rx']
                  ])
                  const target = netDeviceMap.value.get(stats.device)
                  if (target) {
                    target.chartData.forEach((chartItem) => {
                      const field = fieldsMap.get(chartItem.name)
                      if (field) {
                        chartItem.data.push(stats[field as keyof NetworkSpeedStats] as number)
                        if (chartItem.data.length > 100) chartItem.data.shift()
                      }
                    })
                    target.xAxiosData.push(stats.time)
                    if (target.xAxiosData.length > 100) target.xAxiosData.shift()
                  }
                } else {
                  const watchData = new WatchNetworkData()
                  watchData.device = stats.device
                  watchData.chartData = [
                    { name: 'tx 上行', data: [stats.tx] },
                    { name: 'rx 下行', data: [stats.rx] }
                  ]
                  watchData.xAxiosData = [stats.time]
                  netDeviceMap.value.set(stats.device, watchData)
                }
              })

              netUpload.value = kbConvertAdapter(totalTx)
              netDownload.value = kbConvertAdapter(totalRx)
              if (latestTime) {
                netTotalXAxis.value.push(latestTime)
                if (netTotalXAxis.value.length > 100) netTotalXAxis.value.shift()
              }
              netTotalChartData.value[0].data.push(totalTx)
              netTotalChartData.value[1].data.push(totalRx)
              if (netTotalChartData.value[0].data.length > 100) {
                netTotalChartData.value[0].data.shift()
                netTotalChartData.value[1].data.shift()
              }
            }
            break
          }
          default:
            break
        }
      })
    } catch {
      // WebSocket 可能未初始化
    }
  }

  // 面板尺寸变化时驱动图表 resize（ResizeObserver + 短防抖）
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  let resizeObserver: ResizeObserver | null = null

  const resizeAllCharts = () => {
    const panel = document.querySelector('.resource-panel')
    if (!panel) return
    const containers = panel.querySelectorAll<HTMLElement>('.art-line-chart')
    containers.forEach((el) => {
      try {
        const instance = echarts.getInstanceByDom(el)
        if (instance && !instance.isDisposed()) {
          instance.resize()
        }
      } catch {
        // 忽略单次 resize 异常
      }
    })
  }

  onMounted(() => {
    setupWebSocket()
    // 计算折叠态悬浮条初始位置（贴右上角）
    nextTick(() => {
      const bar = document.querySelector('.resource-float-bar') as HTMLElement
      if (bar) {
        floatBarX.value = window.innerWidth - bar.offsetWidth - 16
      } else {
        floatBarX.value = window.innerWidth - 360
      }
    })
    // 窗口大小变化时修正悬浮条位置（防止拖出视野）
    window.addEventListener('resize', clampFloatBar)
  })

  // 面板展开后挂载 ResizeObserver，折叠/关闭时断开
  watch(expanded, (val) => {
    if (val) {
      nextTick(() => {
        const panel = document.querySelector('.resource-panel') as HTMLElement
        if (panel && !resizeObserver) {
          resizeObserver = new ResizeObserver(() => {
            if (resizeTimer) clearTimeout(resizeTimer)
            resizeTimer = setTimeout(resizeAllCharts, 50)
          })
          resizeObserver.observe(panel)
        }
      })
    } else {
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
    }
  })

  onUnmounted(() => {
    if (resizeTimer) clearTimeout(resizeTimer)
    if (resizeObserver) resizeObserver.disconnect()
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
    document.removeEventListener('mousemove', onFloatDrag)
    document.removeEventListener('mouseup', stopFloatDrag)
    window.removeEventListener('resize', clampFloatBar)
  })
</script>

<style lang="scss" scoped>
  // ===== 折叠态：右上角悬浮条 =====
  .resource-float-bar {
    position: fixed;
    z-index: 5000;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 20px;
    background: var(--el-bg-color);
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
    cursor: grab;
    font-size: 13px;
    white-space: nowrap;
    user-select: none;
    transition: box-shadow 0.2s;

    &:active {
      cursor: grabbing;
    }

    &:hover {
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
    }

    .float-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.cpu-dot {
        background: #409eff;
      }
      &.mem-dot {
        background: #67c23a;
      }
      &.net-dot {
        background: #e6a23c;
      }
    }
  }

  // ===== 展开态：可拖拽弹窗 =====
  .resource-panel {
    position: fixed;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    border-radius: 10px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
    overflow: hidden;
    user-select: none;
    border: 1px solid var(--el-border-color-light);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 16px;
    background: var(--el-color-primary-light-9);
    cursor: move;
    flex-shrink: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 6px;

      .collapse-icon {
        font-size: 15px;
      }
    }
  }

  .panel-body {
    flex: 1;
    overflow: auto;
  }

  .monitor-tabs {
    height: 100%;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 16px;
    }

    :deep(.el-tabs__content) {
      height: calc(100% - 40px);
      overflow-y: auto;
    }
  }

  .tab-content {
    padding: 16px;
  }

  .metric-header {
    font-size: 14px;
    margin-bottom: 12px;
    color: var(--el-text-color-regular);

    strong {
      font-size: 22px;
      margin-left: 4px;
      color: var(--el-color-primary);
    }
  }

  .chart-wrap {
    width: 100%;
    height: 380px;
    margin-bottom: 12px;
  }

  .section-card {
    padding: 14px 16px;
    margin-bottom: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    &:last-child {
      margin-bottom: 0;
    }

    .chart-wrap {
      margin-bottom: 0;
    }
  }

  // 内存统计
  .mem-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 16px;
    padding: 12px 0;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .mem-stat {
    text-align: center;

    .mem-label {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 6px;
    }

    .mem-value {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  // ===== 网络 - 合并图表 + 网卡速率列表 =====
  .network-tab {
    padding: 16px;
  }

  .network-combined-chart {
    width: 100%;
    height: 380px;
    margin-bottom: 30px;
  }

  .nic-info-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
  }

  .nic-info-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    padding: 6px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
  }

  .nic-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .nic-label {
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-right: 4px;
  }

  .nic-up {
    color: var(--el-text-color-secondary);
    margin-right: 8px;
  }

  .nic-down {
    color: var(--el-text-color-secondary);
  }

  // 调整大小手柄
  .resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;

    &::after {
      content: '';
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 12px;
      height: 12px;
      border-right: 2px solid var(--el-border-color);
      border-bottom: 2px solid var(--el-border-color);
    }
  }
</style>
