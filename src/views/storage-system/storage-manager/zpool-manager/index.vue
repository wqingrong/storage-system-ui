<template>
  <div class="zpool-manager">
    <!-- 顶部工具栏 -->
    <div class="menu-container">
      <ElSpace wrap>
        <ElButton type="primary" @click="handleCreateZpool">
          <ElIcon><Plus /></ElIcon>
          创建Zpool
        </ElButton>
        <ElButton @click="handleCreateStorageSpace">
          <ElIcon><Plus /></ElIcon>
          创建存储空间
        </ElButton>
        <ElButton :icon="Refresh" :loading="loading" @click="refreshZpoolData">刷新</ElButton>
      </ElSpace>
    </div>

    <div class="zpool-layout">
      <!-- 左侧：每个存储池一列，列内多张卡片 -->
      <div v-loading="loading" class="zpool-columns">
        <el-empty
          v-if="!loading && zpoolList.length === 0"
          class="zpool-empty"
          :image-size="300"
          description="未创建Zpool存储池"
        />
        <div v-for="pool in zpoolList" :key="pool.pool_name" class="zpool-column">
          <!-- 列头：池名 + 健康状态 + 更多操作 -->
          <div class="column-header">
            <span class="pool-name">{{ pool.pool_name }}</span>
            <span
              class="health-pill"
              :style="{
                color: getPoolHealthDisplay(pool).color,
                background: getPoolHealthDisplay(pool).color + '1f',
                border: '1px solid ' + getPoolHealthDisplay(pool).color + '4d'
              }"
            >
              {{ getPoolHealthDisplay(pool).label }}
            </span>
            <div class="column-actions" @click.stop="showMenu($event, pool)">
              <ElIcon><MoreFilled /></ElIcon>
            </div>
          </div>

          <!-- 存储池信息卡片：1基本信息/2容量/3健康/4磁盘运行状态 横向平铺 -->
          <div class="pool-card">
            <div class="card-sections">
              <!-- 1.基本信息 -->
              <div class="card-section">
                <div class="section-title">基本信息</div>
                <div class="info-item">
                  <span class="info-label">存储池等级</span>
                  <span class="info-value">{{ getPoolGrade(pool) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">磁盘数量</span>
                  <span class="info-value">{{ getDiskCountText(pool) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">单盘容量(约)</span>
                  <span class="info-value">{{ getPerDiskSize(pool) }}</span>
                </div>
              </div>

              <!-- 容量信息 -->
              <div class="card-section">
                <div class="section-title">容量信息</div>
                <div class="capacity-main">
                  <el-progress
                    type="circle"
                    :percentage="getUsagePct(pool)"
                    :color="getUsageColor(pool)"
                    :width="62"
                    :stroke-width="6"
                  />
                  <div class="capacity-detail">
                    <span
                      >已用 <b>{{ formatBytes(pool.used_bytes) }}</b></span
                    >
                    <span
                      >可用 <b>{{ formatBytes(pool.free_bytes) }}</b></span
                    >
                    <span
                      >总容量 <b>{{ formatBytes(pool.total_bytes) }}</b></span
                    >
                  </div>
                </div>
                <div class="pool-uuid" :title="pool.uuid">UUID: {{ pool.uuid }}</div>
              </div>

              <!-- 健康状态 -->
              <div class="card-section">
                <div class="section-title">健康状态</div>
                <div class="health-row">
                  <span class="health-value" :style="{ color: getPoolHealthDisplay(pool).color }">{{
                    getPoolHealthDisplay(pool).label
                  }}</span>
                  <span class="health-raw">({{ pool.health_state }})</span>
                </div>
                <!-- 健康问题明细 -->
                <div v-if="pool.health?.problems?.length" class="problem-list">
                  <div
                    v-for="(problem, index) in pool.health.problems"
                    :key="index"
                    class="problem-item"
                  >
                    <ElIcon class="problem-icon"><WarningFilled /></ElIcon>
                    <span class="problem-text">{{ problem.device }}: {{ problem.message }}</span>
                  </div>
                </div>
                <!-- 重建/校验进度 -->
                <div v-if="pool.resilver?.state === 'RUNNING'" class="active-task">
                  <span class="task-label">重建中</span>
                  <el-progress
                    class="task-progress"
                    :percentage="pool.resilver.progress_pct"
                    :stroke-width="6"
                    color="#ec6f30"
                  />
                </div>
                <div v-else-if="pool.scrub?.state === 'SCRUBBING'" class="active-task">
                  <span class="task-label">数据校验中</span>
                  <el-progress
                    class="task-progress"
                    :percentage="pool.scrub.progress_pct"
                    :stroke-width="6"
                    color="#2b8dfa"
                  />
                </div>
                <div v-else class="health-meta">
                  <span>上次校验: {{ formatTime(pool.last_scrub_complete) }}</span>
                </div>
              </div>

              <!-- 磁盘运行状态（内含查看磁盘列表按钮） -->
              <div class="card-section">
                <div class="section-title">磁盘运行状态</div>
                <div class="disk-run-stats">
                  <span v-for="stat in getDiskRunStats(pool)" :key="stat.state" class="run-stat">
                    <span class="state-dot" :style="{ background: stat.color }" />
                    {{ stat.label }} {{ stat.count }}
                  </span>
                </div>
                <!-- 查看磁盘列表（独立弹窗组件） -->
                <ElButton class="disk-list-btn" @click="openDiskList(pool)">
                  <ElIcon><List /></ElIcon>
                  查看磁盘列表
                </ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 磁盘列表弹窗组件（点击磁盘行，右侧显示磁盘详细信息） -->
    <el-dialog
      v-model="diskListDialogVisible"
      :title="diskListPool ? `磁盘列表 - ${diskListPool.pool_name}` : '磁盘列表'"
      width="1200px"
      append-to-body
      @close="closeDiskList"
    >
      <div v-if="diskListPool" class="disk-dialog-layout">
        <!-- 左：磁盘列表表格 -->
        <el-table
          :data="diskListRows"
          highlight-current-row
          class="disk-list-table"
          @row-click="handleTableRowClick"
        >
          <el-table-column label="磁盘名称" min-width="200">
            <template #default="{ row }">
              <span class="disk-name-cell">
                <span
                  class="state-dot"
                  :style="{ background: vdevStateDisplay(row.vdev.state).color }"
                />
                <span class="table-disk-name">{{ row.vdev.name }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="所属分组" width="110">
            <template #default="{ row }">{{ row.parentLabel }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span :style="{ color: vdevStateDisplay(row.vdev.state).color }">{{
                vdevStateDisplay(row.vdev.state).label
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="读" width="70" align="right">
            <template #default="{ row }">
              {{ vdevErrorStat(row.vdev).read_errors }}
            </template>
          </el-table-column>
          <el-table-column label="写" width="70" align="right">
            <template #default="{ row }">
              {{ vdevErrorStat(row.vdev).write_errors }}
            </template>
          </el-table-column>
          <el-table-column label="校验" width="70" align="right">
            <template #default="{ row }">
              <span :class="{ 'table-error': vdevErrorStat(row.vdev).checksum_errors > 0 }">{{
                vdevErrorStat(row.vdev).checksum_errors
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="慢IO" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.vdev.is_slow_io" type="warning" size="small">慢IO</el-tag>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 右：磁盘详细信息（点击磁盘行显示） -->
        <div class="disk-detail-panel">
          <div class="panel-title">磁盘详细信息</div>
          <template v-if="selectedDiskRow">
            <div class="panel-item">
              <div class="panel-label">所属存储池</div>
              <div class="panel-value">{{ diskListPool?.pool_name }}</div>
            </div>
            <div class="panel-item">
              <div class="panel-label">所属分组</div>
              <div class="panel-value">{{ selectedDiskRow.parentLabel }}</div>
            </div>
            <div class="panel-item">
              <div class="panel-label">磁盘名称</div>
              <div class="panel-value">{{ selectedDiskRow.vdev.name }}</div>
            </div>
            <div class="panel-item">
              <div class="panel-label">设备路径</div>
              <div class="panel-value">{{ selectedDiskRow.vdev.dev_path || '—' }}</div>
            </div>
            <div class="panel-item">
              <div class="panel-label">状态</div>
              <div class="panel-value">
                <span
                  class="state-dot"
                  :style="{ background: vdevStateDisplay(selectedDiskRow.vdev.state).color }"
                />
                <span :style="{ color: vdevStateDisplay(selectedDiskRow.vdev.state).color }">{{
                  vdevStateDisplay(selectedDiskRow.vdev.state).label
                }}</span>
                <span class="panel-raw">({{ selectedDiskRow.vdev.state }})</span>
              </div>
            </div>
            <div class="panel-item">
              <div class="panel-label">读 / 写 / 校验错误</div>
              <div class="panel-value" :class="{ 'has-error': hasVdevError(selectedDiskRow.vdev) }">
                {{ vdevErrorStat(selectedDiskRow.vdev).read_errors }} /
                {{ vdevErrorStat(selectedDiskRow.vdev).write_errors }} /
                {{ vdevErrorStat(selectedDiskRow.vdev).checksum_errors }}
              </div>
            </div>
            <div class="panel-item">
              <div class="panel-label">慢IO</div>
              <div class="panel-value">
                {{
                  selectedDiskRow.vdev.is_slow_io ? selectedDiskRow.vdev.slow_io_msg || '是' : '否'
                }}
              </div>
            </div>
            <div v-if="selectedDiskRow.vdev.aux" class="panel-item">
              <div class="panel-label">故障辅助原因</div>
              <div class="panel-value panel-aux">{{ selectedDiskRow.vdev.aux }}</div>
            </div>
            <!-- 操作按钮 -->
            <div class="panel-actions">
              <ElButton
                v-if="selectedDiskRow.vdev.state === 'ONLINE'"
                size="small"
                type="danger"
                plain
                @click="handleKickDisk(diskListPool, selectedDiskRow)"
                >踢盘
              </ElButton>
              <ElButton
                v-if="selectedDiskRow.vdev.state === 'REMOVED'"
                size="small"
                type="primary"
                plain
                @click="handleImportDisk(diskListPool, selectedDiskRow)"
                >引入
              </ElButton>
            </div>
          </template>
          <div v-else class="panel-empty-tip">点击左侧磁盘行查看详细信息</div>
        </div>
      </div>
    </el-dialog>

    <!-- 右键菜单组件 -->
    <ArtMenuRight
      ref="menuRef"
      :menu-items="menuItems"
      :submenu-width="140"
      :border-radius="10"
      @select="handleSelect"
    />
    <!-- 创建Zpool弹窗 -->
    <CreateZPool v-model:visible="createZPoolDialogVisible" />
    <!-- 创建存储空间弹窗 -->
    <CreateStorageSpace
      v-model:visible="createStorageSpaceDialogVisible"
      :filter-pool-type="'ZFS'"
      :default-vg-name="createSpaceDefaultVgName"
      @call-storage-method="handleCallStorageMethod"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import { fetchGetZPoolMap } from '@/api/zfs-service'
  import type { HealthLevel, PoolHealthState, VdevNode, ZFSPool } from '@/entity/zfs'
  import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
  import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
  import { List, MoreFilled, Plus, Refresh, WarningFilled } from '@element-plus/icons-vue'
  import {
    fetchDestroyZPool,
    fetchImportZPool,
    fetchPoolImportDisk,
    fetchPoolKickDisk,
    fetchStopZPool
  } from '@/api/storage-service'
  import { Api } from '@/typings/api'
  import { unitConvertAdapter } from '@utils/tools'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import CreateZPool from '@views/storage-system/storage-manager/disk-manager/modules/create-zpool.vue'
  import CreateStorageSpace from '@views/storage-system/storage-manager/storage-space/modules/create-storage-space.vue'

  defineOptions({ name: 'ZpoolManager' })

  // ZFS存储池列表(来自 /zfs/getZPoolMap)
  const zpoolList = ref<ZFSPool[]>([])
  // 列表加载状态
  const loading = ref(false)
  // 创建Zpool弹窗显隐
  const createZPoolDialogVisible = ref(false)
  // 创建存储空间弹窗显隐
  const createStorageSpaceDialogVisible = ref(false)
  // 创建存储空间弹窗默认选中的存储池
  const createSpaceDefaultVgName = ref('')

  /** 刷新Zpool存储池列表（拉取 /zfs/getZPoolMap 数据） */
  const refreshZpoolData = async () => {
    loading.value = true
    try {
      const poolMap = await fetchGetZPoolMap()
      // 接口返回 池名 → 池信息 的map，转成数组渲染；兜底兼容数组返回
      zpoolList.value = Array.isArray(poolMap) ? poolMap : Object.values(poolMap ?? {})
    } catch {
      zpoolList.value = []
    } finally {
      loading.value = false
    }
  }

  // ========== 定时轮询（keepAlive下切走页面时暂停） ==========
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const startPolling = () => {
    refreshZpoolData()
  }

  onMounted(startPolling)
  onActivated(startPolling)
  onDeactivated(stopPolling)
  onUnmounted(stopPolling)

  const handleCreateZpool = () => {
    createZPoolDialogVisible.value = true
  }

  // 工具栏创建存储空间（不指定默认存储池）
  const handleCreateStorageSpace = () => {
    createSpaceDefaultVgName.value = ''
    createStorageSpaceDialogVisible.value = true
  }

  // 在指定存储池上创建存储空间
  const handleZpoolCreateSpace = () => {
    createSpaceDefaultVgName.value = menuItemData.value.pool_name
    createStorageSpaceDialogVisible.value = true
  }

  // 创建存储空间成功后的回调，刷新列表
  const handleCallStorageMethod = (methodName: string) => {
    if (methodName === 'refreshStorageSpaceData') {
      refreshZpoolData()
    }
  }

  // 创建弹窗关闭后刷新列表
  watch(createZPoolDialogVisible, (newVal) => {
    if (!newVal) {
      refreshZpoolData()
    }
  })

  // ========== 右键菜单 ==========
  const menuRef = ref<InstanceType<typeof ArtMenuRight>>()
  const menuItemData = ref<ZFSPool>({} as ZFSPool)

  /**
   * 右键菜单选项配置（存储池）
   */
  const menuItems: MenuItemType[] = [
    {
      key: 'zpool_create_space',
      label: '创建存储空间',
      icon: '&#xe6cb;'
    },
    {
      key: 'zpool_import',
      label: 'Zpool启动',
      icon: '&#xe67a;'
    },
    {
      key: 'zpool_stop',
      label: 'Zpool停止',
      icon: '&#xe701;'
    },
    {
      key: 'zpool_destroy',
      label: 'Zpool销毁',
      icon: '&#xe6d4;',
      showLine: true
    }
  ]

  /**
   * 处理右键菜单项选择
   * @param item 选中的菜单项
   */
  const handleSelect = (item: MenuItemType) => {
    switch (item.key) {
      case 'zpool_create_space':
        // 在选中的存储池上创建存储空间
        handleZpoolCreateSpace()
        break
      case 'zpool_import':
        // Zpool启动
        fetchImportZPool(buildZPoolDto()).then(() => {
          refreshZpoolData()
        })
        break
      case 'zpool_stop':
        // Zpool停止
        fetchStopZPool(buildZPoolDto()).then(() => {
          refreshZpoolData()
        })
        break
      case 'zpool_destroy':
        // Zpool销毁（需二次确认）
        destroyZPool()
        break
      default:
        break
    }
  }

  // 组装Zpool操作DTO（ZFS池以池名作为devicePath）
  const buildZPoolDto = (): Api.Dto.ImportZPoolDto => {
    const poolItem = menuItemData.value
    return {
      UUID: poolItem.uuid,
      poolName: poolItem.pool_name,
      devicePath: poolItem.pool_name
    }
  }

  // Zpool销毁（需二次确认）
  const destroyZPool = () => {
    const poolItem = menuItemData.value
    ElMessageBox.confirm(
      `确定销毁Zpool存储池「${poolItem.pool_name}」吗？<br/>销毁后存储池上的数据将无法恢复。`,
      '销毁确认',
      {
        confirmButtonText: '确定销毁',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
      .then(() => {
        fetchDestroyZPool(buildZPoolDto()).then(() => {
          refreshZpoolData()
        })
      })
      .catch(() => {
        ElMessage.info('已取消销毁操作')
      })
  }

  /**
   * 显示右键菜单
   * @param e 鼠标事件
   * @param poolItem 存储池数据
   */
  const showMenu = (e: MouseEvent, poolItem: ZFSPool) => {
    e.preventDefault()
    e.stopPropagation()
    menuItemData.value = poolItem
    nextTick(() => {
      menuRef.value?.show(e)
    })
  }

  // ========== 健康状态展示 ==========
  interface HealthDisplay {
    /** 中文标签 */
    label: string
    /** 状态色 */
    color: string
  }

  const HEALTH_DISPLAY: Record<HealthLevel, HealthDisplay> = {
    HEALTHY: { label: '健康', color: '#4caf50' },
    DEGRADED: { label: '已降级', color: '#ec6f30' },
    FAULTED: { label: '故障', color: '#e80536' },
    UNKNOWN: { label: '未知', color: '#909399' }
  }

  // 后端未返回健康等级时，根据池原始状态兜底
  const healthStateToLevel = (state: PoolHealthState): HealthLevel => {
    switch (state) {
      case 'ONLINE':
        return 'HEALTHY'
      case 'DEGRADED':
        return 'DEGRADED'
      case 'FAULTED':
      case 'UNAVAIL':
      case 'SUSPENDED':
      case 'REMOVED':
        return 'FAULTED'
      default:
        return 'UNKNOWN'
    }
  }

  /** 获取存储池健康状态展示信息 */
  const getPoolHealthDisplay = (pool: ZFSPool): HealthDisplay => {
    const level = pool.health?.level ?? healthStateToLevel(pool.health_state)
    return HEALTH_DISPLAY[level]
  }

  // ========== vdev树结构展示 ==========
  /** 磁盘叶子节点（磁盘列表组件行数据） */
  interface DiskLeaf {
    /** 磁盘vdev节点 */
    vdev: VdevNode
    /** 所属分组节点 */
    parent: VdevNode | null
    /** 所属分组标签 */
    parentLabel: string
  }

  const VDEV_TYPE_LABEL: Record<string, string> = {
    root: 'ROOT',
    mirror: 'MIRROR',
    raidz: 'RAIDZ',
    raidz1: 'RAIDZ1',
    raidz2: 'RAIDZ2',
    raidz3: 'RAIDZ3',
    draid: 'DRAID',
    disk: 'DISK',
    log: 'LOG(ZIL)',
    cache: 'CACHE(L2ARC)',
    spare: 'SPARE',
    special: 'SPECIAL',
    unknown: 'VDEV'
  }

  const VDEV_STATE_DISPLAY: Record<string, HealthDisplay> = {
    ONLINE: { label: '在线', color: '#4caf50' },
    DEGRADED: { label: '降级', color: '#ec6f30' },
    FAULTED: { label: '故障', color: '#e80536' },
    UNAVAIL: { label: '不可用', color: '#e80536' },
    OFFLINE: { label: '离线', color: '#909399' },
    REMOVED: { label: '已移除', color: '#909399' },
    SPARE: { label: '备用', color: '#909399' },
    unknown: { label: '未知', color: '#909399' }
  }

  /** 收集vdev树中的全部磁盘叶子节点 */
  const collectDiskLeaves = (
    nodes: VdevNode[] | null,
    parent: VdevNode | null,
    acc: DiskLeaf[] = []
  ): DiskLeaf[] => {
    if (!nodes?.length) return acc
    for (const node of nodes) {
      const isGroup = !!node.children?.length && node.vdev_type !== 'disk'
      if (isGroup) {
        collectDiskLeaves(node.children, node, acc)
      } else {
        acc.push({
          vdev: node,
          parent,
          parentLabel: parent ? vdevTypeLabel(parent.vdev_type) : '顶层'
        })
      }
    }
    return acc
  }

  /** 存储池等级（顶层vdev组类型，如 MIRROR ×2 / RAIDZ1 + MIRROR） */
  const getPoolGrade = (pool: ZFSPool): string => {
    const root = pool.root_vdev
    if (!root) return '—'
    const groups = root.children?.length ? root.children : [root]
    const typeCounts = new Map<string, number>()
    for (const group of groups) {
      const isGroup = !!group.children?.length && group.vdev_type !== 'disk'
      const label = isGroup ? vdevTypeLabel(group.vdev_type) : '单盘'
      typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1)
    }
    return Array.from(typeCounts.entries())
      .map(([type, count]) => (count > 1 ? `${type} ×${count}` : type))
      .join(' + ')
  }

  /** 统计vdev下磁盘块数（分组宽度） */
  const countVdevLeaves = (node: VdevNode): number => {
    if (!node.children?.length) {
      return node.vdev_type === 'disk' ? 1 : 0
    }
    return node.children.reduce((sum, child) => sum + countVdevLeaves(child), 0)
  }

  /** vdev类型展示标签 */
  const vdevTypeLabel = (type: string): string => VDEV_TYPE_LABEL[type] ?? type.toUpperCase()

  /** vdev状态展示信息 */
  const vdevStateDisplay = (state: string): HealthDisplay =>
    VDEV_STATE_DISPLAY[state] ?? VDEV_STATE_DISPLAY.unknown

  /** vdev错误统计（缺失时兜底为0） */
  const vdevErrorStat = (vdev: VdevNode) =>
    vdev.error_stat ?? { read_errors: 0, write_errors: 0, checksum_errors: 0 }

  /** vdev是否存在错误 */
  const hasVdevError = (vdev: VdevNode): boolean => {
    const stat = vdev.error_stat
    if (!stat) return false
    return stat.read_errors + stat.write_errors + stat.checksum_errors > 0
  }

  // ========== 磁盘列表弹窗与磁盘操作 ==========
  // 磁盘列表弹窗显隐
  const diskListDialogVisible = ref(false)
  // 弹窗展示的存储池
  const diskListPool = ref<ZFSPool | null>(null)
  // 弹窗内当前选中的磁盘行（左侧详情面板数据）
  const selectedDiskRow = ref<DiskLeaf | null>(null)

  /** 弹窗内磁盘列表行数据 */
  const diskListRows = computed<DiskLeaf[]>(() => {
    const pool = diskListPool.value
    if (!pool) return []
    return collectDiskLeaves(
      pool.root_vdev?.children?.length
        ? pool.root_vdev.children
        : pool.root_vdev
          ? [pool.root_vdev]
          : null,
      null
    )
  })

  /** 打开磁盘列表弹窗 */
  const openDiskList = (pool: ZFSPool) => {
    diskListPool.value = pool
    selectedDiskRow.value = null
    diskListDialogVisible.value = true
  }

  /** 关闭磁盘列表弹窗（清空选中，详情随弹窗一并销毁） */
  const closeDiskList = () => {
    diskListDialogVisible.value = false
    selectedDiskRow.value = null
  }

  /** 点击磁盘行：左侧面板显示该磁盘详细信息 */
  const handleTableRowClick = (row: DiskLeaf) => {
    selectedDiskRow.value = row
  }

  /** 踢盘：将磁盘从存储池中踢出（需二次确认） */
  const handleKickDisk = (pool: ZFSPool | null, leaf: DiskLeaf) => {
    if (!pool) return
    ElMessageBox.confirm(
      `确定将磁盘「${leaf.vdev.name}」从存储池「${pool.pool_name}」中踢出吗？`,
      '踢盘确认',
      {
        confirmButtonText: '确定踢盘',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(() => {
        fetchPoolKickDisk({
          poolName: pool.pool_name,
          poolType: 'ZFS',
          grade: leaf.parent?.vdev_type ?? '',
          diskDevice: leaf.vdev.dev_path || leaf.vdev.name,
          raidDevice: leaf.parent?.dev_path ?? '',
          serialNumber: '',
          wwn: ''
        }).then(() => {
          refreshZpoolData()
        })
      })
      .catch(() => {
        ElMessage.info('已取消踢盘操作')
      })
  }

  /** 引入：将已移除磁盘重新引入存储池（需二次确认） */
  const handleImportDisk = (pool: ZFSPool | null, leaf: DiskLeaf) => {
    if (!pool) return
    ElMessageBox.confirm(
      `确定将磁盘「${leaf.vdev.name}」重新引入存储池「${pool.pool_name}」吗？`,
      '引入确认',
      {
        confirmButtonText: '确定引入',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(() => {
        fetchPoolImportDisk({
          poolName: pool.pool_name,
          poolType: 'ZFS',
          grade: leaf.parent?.vdev_type ?? '',
          raidDevicePath: leaf.parent?.dev_path ?? '',
          diskDeviceBasic: leaf.vdev
        }).then(() => {
          refreshZpoolData()
        })
      })
      .catch(() => {
        ElMessage.info('已取消引入操作')
      })
  }

  // ========== 容量展示 ==========
  /** 存储池使用率(%) */
  const getUsagePct = (pool: ZFSPool): number => {
    if (!pool.total_bytes) return 0
    return Math.min(100, Math.round((pool.used_bytes / pool.total_bytes) * 100))
  }

  /** 使用率对应进度条颜色 */
  const getUsageColor = (pool: ZFSPool): string => {
    const pct = getUsagePct(pool)
    if (pct >= 90) return '#e80536'
    if (pct >= 70) return '#e6a23c'
    return '#4caf50'
  }

  /** 字节数格式化为可读容量 */
  const formatBytes = (bytes: number): string => unitConvertAdapter(bytes ?? 0, 'bytes')

  /** 存储池磁盘数量展示文本 */
  const getDiskCountText = (pool: ZFSPool): string => {
    const count = pool.root_vdev ? countVdevLeaves(pool.root_vdev) : 0
    return count > 0 ? `${count} 块盘` : '—'
  }

  /** 数据vdev有效宽度合计（用于估算单盘容量，log/cache/spare不计入） */
  const sumDataWidth = (nodes: VdevNode[]): number => {
    let total = 0
    for (const node of nodes) {
      const width = countVdevLeaves(node)
      if (width === 0) continue
      switch (node.vdev_type) {
        case 'log':
        case 'cache':
        case 'spare':
          // 不计入数据容量
          break
        case 'mirror':
          total += 1
          break
        case 'raidz2':
          total += Math.max(1, width - 2)
          break
        case 'raidz3':
          total += Math.max(1, width - 3)
          break
        case 'raidz':
        case 'raidz1':
        case 'draid':
          total += Math.max(1, width - 1)
          break
        default:
          total += width
          break
      }
    }
    return total
  }

  /** 估算单盘容量（假设同组磁盘等大：总可用容量 / 数据vdev有效宽度） */
  const getPerDiskSize = (pool: ZFSPool): string => {
    const root = pool.root_vdev
    if (!pool.total_bytes || !root) return '—'
    const width = sumDataWidth(root.children?.length ? root.children : [root])
    if (width <= 0) return '—'
    return `约 ${formatBytes(pool.total_bytes / width)}`
  }

  /** 磁盘运行状态统计项 */
  interface DiskRunStat {
    state: string
    label: string
    color: string
    count: number
  }

  /** 磁盘运行状态统计（按状态汇总全部磁盘） */
  const getDiskRunStats = (pool: ZFSPool): DiskRunStat[] => {
    const leaves = collectDiskLeaves(
      pool.root_vdev?.children?.length
        ? pool.root_vdev.children
        : pool.root_vdev
          ? [pool.root_vdev]
          : null,
      null
    )
    const countMap = new Map<string, number>()
    for (const leaf of leaves) {
      const state = leaf.vdev.state ?? 'unknown'
      countMap.set(state, (countMap.get(state) ?? 0) + 1)
    }
    return Array.from(countMap.entries()).map(([state, count]) => ({
      state,
      count,
      label: vdevStateDisplay(state).label,
      color: vdevStateDisplay(state).color
    }))
  }

  /** RFC3339时间格式化为本地展示时间 */
  const formatTime = (iso: string | null): string => {
    if (!iso) return '从未'
    const date = new Date(iso)
    if (isNaN(date.getTime())) return iso
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
</script>

<style scoped>
  .menu-container {
    margin: 10px;
  }

  /* 整体布局：左侧存储池列 + 右侧磁盘详情面板 */
  .zpool-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px;
  }

  /* 每个存储池一列，横向排列铺满整个宽度（超出横向滚动） */
  .zpool-columns {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
    min-width: 0;
    min-height: 200px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .zpool-empty {
    width: 100%;
    flex-shrink: 0;
  }

  .zpool-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1 1 0;
    min-width: 640px;
  }

  /* 列头：池名 + 健康状态 + 更多操作 */
  .column-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px;
  }

  .pool-name {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .health-pill {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 20px;
    flex-shrink: 0;
  }

  .column-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: auto;
    border-radius: 4px;
    cursor: pointer;
    font-size: 20px;
  }

  .column-actions:hover {
    background: #f0f2f5;
  }

  /* 列内卡片通用样式 */
  .pool-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  }

  /* 卡片信息横向平铺(1基本信息/2容量/3健康/4磁盘运行状态) */
  .card-sections {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
  }

  /* 卡片内分区 */
  .card-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .card-section + .card-section {
    border-left: 1px solid #f0f2f5;
    padding-left: 12px;
  }

  /* 基本信息行 */
  .info-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 0;
    font-size: 13px;
  }

  .info-label {
    color: #909399;
  }

  .info-value {
    color: #303133;
    font-weight: 500;
  }

  /* 磁盘运行状态统计 */
  .disk-run-stats {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 12px;
    color: #606266;
  }

  .run-stat {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  /* 查看磁盘列表按钮 */
  .disk-list-btn {
    width: 100%;
    margin-top: 4px;
  }

  /* 健康状态行 */
  .health-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .health-value {
    font-weight: 600;
  }

  .health-raw {
    color: #c0c4cc;
    font-size: 12px;
  }

  .health-meta {
    font-size: 12px;
    color: #909399;
  }

  /* 健康问题明细 */
  .problem-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    background: #fdf6ec;
    border-radius: 6px;
  }

  .problem-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #e6a23c;
  }

  .problem-icon {
    flex-shrink: 0;
  }

  .problem-text {
    word-break: break-all;
  }

  /* 重建/校验进度 */
  .active-task {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .task-label {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
  }

  .task-progress {
    flex: 1;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
  }

  /* 容量信息 */
  .capacity-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .capacity-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #909399;
    min-width: 0;
  }

  .capacity-detail b {
    color: #303133;
  }

  .pool-uuid {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: #c0c4cc;
  }

  /* 磁盘列表弹窗表格 */
  .state-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .table-disk-name {
    margin-left: 8px;
    font-size: 13px;
    color: #303133;
    word-break: break-all;
  }

  .table-error {
    font-weight: 600;
    color: #e80536;
  }

  /* 磁盘名称单元格 */
  .disk-name-cell {
    display: inline-flex;
    align-items: center;
  }

  /* 磁盘列表弹窗内左右布局（左侧详情面板 + 右侧表格） */
  .disk-dialog-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .disk-list-table {
    flex: 1;
    min-width: 0;
  }

  /* 左侧磁盘详细信息面板 */
  .disk-detail-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 280px;
    flex-shrink: 0;
    padding: 12px;
    background: #fafbfc;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  }

  .panel-title {
    padding-bottom: 6px;
    border-bottom: 1px solid #f0f2f5;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #f0f2f5;
  }

  .panel-empty-tip {
    padding: 24px 0;
    font-size: 12px;
    color: #c0c4cc;
    text-align: center;
  }

  .panel-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .panel-label {
    font-size: 12px;
    color: #909399;
  }

  .panel-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #303133;
    word-break: break-all;
  }

  .panel-value.has-error {
    font-weight: 600;
    color: #e80536;
  }

  .panel-raw {
    font-size: 12px;
    color: #c0c4cc;
  }

  .panel-aux {
    color: #e6a23c;
  }
</style>
