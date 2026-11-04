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

    <!-- 未导入Zpool列表 -->
    <div v-if="unImportPoolList.length" class="unimport-section">
      <div class="unimport-header">
        <span class="unimport-title">未导入Zpool</span>
        <span class="unimport-count">
          共 <b>{{ unImportPoolList.length }}</b> 个存储池
        </span>
      </div>
      <div class="unimport-list">
        <div v-for="pool in unImportPoolList" :key="pool.UUID" class="unimport-item">
          <span class="unimport-pool-name">{{ pool.poolName }}</span>
          <span class="unimport-pool-uuid" :title="pool.UUID">UUID: {{ pool.UUID }}</span>
          <span class="unimport-disk-count">
            {{ pool.raidDetailInfo?.diskDeviceList?.length ?? 0 }} 块盘
          </span>
          <span class="unimport-grade">{{ pool.raidDetailInfo?.grade || '—' }}</span>
          <ElButton
            type="primary"
            size="small"
            :loading="importingUuid === pool.UUID"
            @click="handleImportUnImportPool(pool)"
          >
            导入
          </ElButton>
        </div>
      </div>
    </div>

    <div class="zpool-layout">
      <!-- 每个存储池占一整行，纵向排列 -->
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

          <!-- 存储池信息卡片：上(基本信息/健康状态/磁盘运行状态)/下(数据集列表) -->
          <div class="pool-card">
            <!-- 上部：基本信息 + 健康状态 + 磁盘运行状态 横向平铺（分隔符分格） -->
            <div class="card-top">
              <!-- 1.基本信息 -->
              <div class="card-section">
                <div class="section-title">基本信息</div>
                <div class="pool-uuid" :title="pool.uuid">UUID: {{ pool.uuid }}</div>

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
                <div class="info-item">
                  <span class="info-label">存储池总容量</span>
                  <span class="info-value">{{ formatBytes(pool.total_bytes) }}</span>
                </div>
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
                  </div>
                </div>
              </div>

              <!-- 2.健康状态 -->
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

              <!-- 3.磁盘运行状态（分隔符分格在健康状态后面） -->
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

            <!-- 数据集列表：一次显示全部，以卡片形式在下方排列 -->
            <div class="dataset-section">
              <div class="dataset-section-header">
                <div class="section-title">数据集列表</div>
                <span class="dataset-count">
                  共 <b>{{ pool.data_sets?.length ?? 0 }}</b> 个 · 已挂载
                  <b>{{ mountedDatasetCount(pool) }}</b> 个
                </span>
              </div>
              <!-- 数据集卡片：图标+名称+挂载状态 / 容量进度 / 更多操作 / 详细信息 -->
              <div v-if="pool.data_sets?.length" class="dataset-list">
                <div v-for="ds in pool.data_sets" :key="ds.name" class="dataset-item">
                  <!-- 卡片头部 -->
                  <div class="dataset-head">
                    <img class="dataset-icon" :src="datasetIcon" alt="" />
                    <div class="dataset-head-main">
                      <div class="dataset-title" :title="ds.name">
                        存储空间:{{ getDatasetDisplayName(ds) }}
                      </div>
                      <div
                        class="dataset-status"
                        :class="ds.is_mount ? 'is-mounted' : 'is-unmounted'"
                      >
                        {{ ds.is_mount ? '已挂载' : '未挂载' }}
                      </div>
                    </div>
                    <div class="dataset-capacity">
                      <div class="dataset-capacity-top">
                        <el-progress
                          class="dataset-progress"
                          :percentage="getDatasetUsePct(ds)"
                          :color="getUsageColorByPct(getDatasetUsePct(ds))"
                          :stroke-width="4"
                          :show-text="false"
                        />
                        <span class="dataset-ratio">{{ getDatasetUsePct(ds) }}%</span>
                      </div>
                      <div class="dataset-capacity-bottom">
                        <span class="dataset-total">{{ formatBytes(ds.total_bytes) }}</span>
                        <span class="dataset-free">| {{ formatBytes(ds.free_bytes) }}可用</span>
                      </div>
                    </div>
                    <div class="dataset-more" @click.stop="showDatasetMenu($event, ds)">
                      <ElIcon><MoreFilled /></ElIcon>
                    </div>
                  </div>
                  <!-- 卡片详细信息 -->
                  <div class="dataset-detail">
                    <div class="dataset-detail-row">
                      <span class="dataset-detail-label">文件系统:</span>
                      <span class="dataset-detail-value">{{ getDatasetFileSystem(ds) }}</span>
                    </div>
                    <div class="dataset-detail-row">
                      <span class="dataset-detail-label">数据集:</span>
                      <span class="dataset-detail-value">{{ getDatasetPath(ds) }}</span>
                    </div>
                    <div class="dataset-detail-row">
                      <span class="dataset-detail-label">挂载点:</span>
                      <span class="dataset-detail-value">{{ ds.mount_point || '—' }}</span>
                    </div>
                    <div class="dataset-detail-row">
                      <span class="dataset-detail-label">挂载状态:</span>
                      <span class="dataset-detail-value">{{ getDatasetMountState(ds) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="dataset-empty">暂无数据集</div>
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
                v-if="isFaultedDisk(selectedDiskRow.vdev)"
                size="small"
                type="warning"
                plain
                @click="handleReplaceDisk(diskListPool, selectedDiskRow)"
                >替换
              </ElButton>
              <ElButton
                v-if="
                  selectedDiskRow.vdev.state === 'REMOVED' || isFaultedDisk(selectedDiskRow.vdev)
                "
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

    <!-- 替换故障盘弹窗（选择空闲磁盘） -->
    <DiskSelectedDialog
      v-model:viable="replaceDialogVisible"
      v-model:pool-item="replacePoolItem"
      v-model:option-disk-item="replaceDiskItem"
      v-model:option="replaceOption"
      :raid-grade="replaceGrade"
      :raid-device-path="replaceRaidDevicePath"
      @refresh-storage-list="handleReplaceDiskSuccess"
    />
    <!-- 右键菜单组件 -->
    <ArtMenuRight
      ref="menuRef"
      :menu-items="menuItems"
      :menu-width="170"
      :submenu-width="140"
      :item-height="34"
      :border-radius="10"
      @select="handleSelect"
    />
    <!-- 创建Zpool弹窗 -->
    <CreateZPool v-model:visible="createZPoolDialogVisible" />
    <!-- 创建ZFS存储空间弹窗 -->
    <CreateZfsStorageSpace
      v-model:visible="createStorageSpaceDialogVisible"
      :default-pool-name="createSpaceDefaultPoolName"
      @call-storage-method="handleCallStorageMethod"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import {
    fetchDestroyDataset,
    fetchDestroyZPool,
    fetchGetZPoolMap,
    fetchImportZPool,
    fetchMountVolume,
    fetchStopZPool,
    fetchUnImportZPoolList,
    fetchUnmountVolume
  } from '@/api/zfs-service'
  import type { HealthLevel, PoolHealthState, VdevNode, ZFSDataSet, ZFSPool } from '@/entity/zfs'
  import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
  import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
  import { List, MoreFilled, Plus, Refresh, WarningFilled } from '@element-plus/icons-vue'
  import { fetchPoolImportDisk, fetchPoolKickDisk } from '@/api/storage-service'
  import { Disk } from '@/typings/disk'
  import { unitConvertAdapter } from '@utils/tools'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import CreateZPool from '@views/storage-system/storage-manager/disk-manager/modules/create-zpool.vue'
  import CreateZfsStorageSpace from './modules/create-zfs-storage-space.vue'
  import DiskSelectedDialog from '@views/storage-system/storage-manager/storage-space/modules/disk-selected-dialog.vue'

  defineOptions({ name: 'ZpoolManager' })

  // ZFS存储池列表(来自 /zfs/getZPoolMap)
  const zpoolList = ref<ZFSPool[]>([])
  // 未导入Zpool列表(来自 /zfs/unImportZPoolList)
  const unImportPoolList = ref<Disk.Device.StoragePool[]>([])
  // 正在导入的池UUID(按钮loading态)
  const importingUuid = ref('')
  // 列表加载状态
  const loading = ref(false)
  // 创建Zpool弹窗显隐
  const createZPoolDialogVisible = ref(false)
  // 创建存储空间弹窗显隐
  const createStorageSpaceDialogVisible = ref(false)
  // 创建存储空间弹窗默认选中的存储池名称
  const createSpaceDefaultPoolName = ref('')

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
    // 未导入列表独立刷新，失败不影响已导入列表展示
    refreshUnImportZPoolList()
  }

  /** 刷新未导入Zpool列表（拉取 /zfs/unImportZPoolList 数据） */
  const refreshUnImportZPoolList = async () => {
    try {
      const list = await fetchUnImportZPoolList()
      unImportPoolList.value = Array.isArray(list) ? list : []
    } catch {
      unImportPoolList.value = []
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
  // keepAlive 下首次挂载会同时触发 mounted 和 activated，跳过紧随其后的首次 activated，避免重复请求
  let isFirstActivated = true
  onActivated(() => {
    if (isFirstActivated) {
      isFirstActivated = false
      return
    }
    startPolling()
  })
  onDeactivated(stopPolling)
  onUnmounted(stopPolling)

  const handleCreateZpool = () => {
    createZPoolDialogVisible.value = true
  }

  // 工具栏创建存储空间（不指定默认存储池）
  const handleCreateStorageSpace = () => {
    createSpaceDefaultPoolName.value = ''
    createStorageSpaceDialogVisible.value = true
  }

  // 在指定存储池上创建存储空间
  const handleZpoolCreateSpace = () => {
    createSpaceDefaultPoolName.value = menuItemData.value.pool_name
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
  // 当前操作的数据集
  const menuDataset = ref<ZFSDataSet | null>(null)
  // 菜单作用对象：存储池 / 数据集
  const menuContainer = ref<'zpool' | 'dataset'>('zpool')

  /**
   * 右键菜单选项配置（存储池）
   */
  const ZPOOL_MENU_ITEMS: MenuItemType[] = [
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
   * 右键菜单选项配置（数据集）
   * 已挂载时不允许再次挂载，未挂载时不允许卸载
   * 销毁仅允许在卸载后进行
   */
  const menuItems = computed<MenuItemType[]>(() => {
    if (menuContainer.value === 'dataset') {
      const mounted = !!menuDataset.value?.is_mount
      return [
        {
          key: 'dataset_mount',
          label: '存储空间挂载',
          icon: '&#xe67a;',
          disabled: mounted
        },
        {
          key: 'dataset_unmount',
          label: '存储空间卸载',
          icon: '&#xe701;',
          disabled: !mounted
        },
        {
          key: 'dataset_destroy',
          label: '存储空间销毁',
          icon: '&#xe6d4;',
          showLine: true,
          disabled: mounted
        }
      ]
    }
    return ZPOOL_MENU_ITEMS
  })

  /** 显示数据集「更多操作」菜单 */
  const showDatasetMenu = (e: MouseEvent, ds: ZFSDataSet) => {
    e.preventDefault()
    e.stopPropagation()
    menuContainer.value = 'dataset'
    menuDataset.value = ds
    nextTick(() => {
      menuRef.value?.show(e)
    })
  }

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
        // Zpool启动(导入，对接 /zfs/importZPool)
        fetchImportZPool(menuItemData.value.uuid, menuItemData.value.pool_name).then(() => {
          refreshZpoolData()
        })
        break
      case 'zpool_stop':
        // Zpool停止(对接 /zfs/stopZPool)
        fetchStopZPool({ pool_name: menuItemData.value.pool_name }).then(() => {
          refreshZpoolData()
        })
        break
      case 'zpool_destroy':
        // Zpool销毁（需二次确认）
        destroyZPool()
        break
      case 'dataset_mount':
        // 存储空间挂载(对接 /zfs/mountVolume)
        if (menuDataset.value) handleDatasetMount(menuDataset.value)
        break
      case 'dataset_unmount':
        // 存储空间卸载(对接 /zfs/unmountVolume，需二次确认)
        if (menuDataset.value) handleDatasetUnmount(menuDataset.value)
        break
      case 'dataset_destroy':
        // 存储空间销毁(对接 /zfs/destroyDataset，仅卸载后可操作)
        if (menuDataset.value) handleDatasetDestroy(menuDataset.value)
        break
      default:
        break
    }
  }

  /** 导入未导入的Zpool（需二次确认，按UUID导入） */
  const handleImportUnImportPool = (pool: Disk.Device.StoragePool) => {
    ElMessageBox.confirm(`确定导入Zpool存储池「${pool.poolName}」吗？`, '导入确认', {
      confirmButtonText: '确定导入',
      cancelButtonText: '取消',
      type: 'info'
    })
      .then(() => {
        importingUuid.value = pool.UUID
        fetchImportZPool(pool.UUID, pool.poolName)
          .then(() => {
            ElMessage.success(`Zpool存储池「${pool.poolName}」导入成功`)
            refreshZpoolData()
          })
          .finally(() => {
            importingUuid.value = ''
          })
      })
      .catch(() => {
        ElMessage.info('已取消导入操作')
      })
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
        // 对接zfs模块销毁接口(/zfs/destroyZPool)，按池名销毁
        fetchDestroyZPool({ pool_name: poolItem.pool_name }).then(() => {
          ElMessage.success(`Zpool存储池「${poolItem.pool_name}」销毁成功`)
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
    menuContainer.value = 'zpool'
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

  // ========== 故障盘替换/引入 ==========
  // 替换故障盘弹窗显隐
  const replaceDialogVisible = ref(false)
  // 替换弹窗关联的存储池（仅需名称/类型，软RAID详情由外部传入）
  const replacePoolItem = ref<{ poolName: string; poolType: string }>({
    poolName: '',
    poolType: 'ZFS'
  })
  // 待替换的故障盘vdev
  const replaceDiskItem = ref<VdevNode | null>(null)
  // 替换弹窗操作类型
  const replaceOption = ref('zfsReplaceDisk')
  // 故障盘所属分组（raid等级/设备路径）
  const replaceGrade = ref('')
  const replaceRaidDevicePath = ref('')

  /** 磁盘是否处于故障状态（故障/不可用，支持替换和引入） */
  const isFaultedDisk = (vdev: VdevNode): boolean =>
    vdev.state === 'FAULTED' || vdev.state === 'UNAVAIL'

  /** 替换：打开磁盘选择弹窗，选择新盘替换故障盘 */
  const handleReplaceDisk = (pool: ZFSPool | null, leaf: DiskLeaf) => {
    if (!pool) return
    replacePoolItem.value = { poolName: pool.pool_name, poolType: 'ZFS' }
    replaceDiskItem.value = leaf.vdev
    replaceGrade.value = leaf.parent?.vdev_type ?? ''
    replaceRaidDevicePath.value = leaf.parent?.dev_path ?? ''
    replaceDialogVisible.value = true
  }

  /** 替换成功后：刷新存储池数据并关闭磁盘列表弹窗 */
  const handleReplaceDiskSuccess = () => {
    refreshZpoolData()
    closeDiskList()
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

  /** 使用率百分比对应进度条颜色 */
  const getUsageColorByPct = (pct: number): string => {
    if (pct >= 90) return '#e80536'
    if (pct >= 70) return '#e6a23c'
    return '#4caf50'
  }

  /** 使用率对应进度条颜色 */
  const getUsageColor = (pool: ZFSPool): string => getUsageColorByPct(getUsagePct(pool))

  /** 数据集使用率(%)：优先按已用/总容量计算，总容量缺失时回退use_ratio(兼容0~1或0~100两种口径) */
  const getDatasetUsePct = (ds: ZFSDataSet): number => {
    if (ds.total_bytes > 0) {
      return Math.min(100, Math.round((ds.used_bytes / ds.total_bytes) * 100))
    }
    const ratio = ds.use_ratio ?? 0
    const pct = ratio > 1 ? ratio : ratio * 100
    return Math.min(100, Math.max(0, Math.round(pct)))
  }

  /** 已挂载的数据集数量 */
  const mountedDatasetCount = (pool: ZFSPool): number =>
    pool.data_sets?.filter((ds) => ds.is_mount).length ?? 0

  // ========== 数据集卡片展示 ==========
  // 数据集卡片图标（蓝色三维方块）
  const datasetIcon = new URL('/src/assets/img/svg/storage-space.svg', import.meta.url).href

  /** 数据集展示名称（取数据集路径末段，如 zpool1/data-set1 → data-set1） */
  const getDatasetDisplayName = (ds: ZFSDataSet): string =>
    ds.name?.split('/').pop() || ds.name || '—'

  /** 数据集文件系统（后端未返回类型时按 ZFS 展示） */
  const getDatasetFileSystem = (ds: ZFSDataSet): string => (ds.type ? ds.type.toUpperCase() : 'ZFS')

  /** 数据集完整路径（device_path 优先，缺失时回退 name） */
  const getDatasetPath = (ds: ZFSDataSet): string => ds.device_path || ds.name || '—'

  /** 数据集挂载状态原始值（与 zfs 命令输出保持一致） */
  const getDatasetMountState = (ds: ZFSDataSet): string => (ds.is_mount ? 'MOUNTED' : 'UNMOUNTED')

  // ========== 数据集操作 ==========
  /** 挂载数据集(对接 /zfs/mountVolume) */
  const handleDatasetMount = (ds: ZFSDataSet) => {
    fetchMountVolume(ds).then(() => {
      refreshZpoolData()
    })
  }

  /** 卸载数据集(对接 /zfs/unmountVolume，需二次确认) */
  const handleDatasetUnmount = (ds: ZFSDataSet) => {
    ElMessageBox.confirm(
      `确定卸载数据集「${ds.name}」吗？<br/>卸载后该数据集将不可访问。`,
      '卸载确认',
      {
        confirmButtonText: '确定卸载',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
      .then(() => {
        fetchUnmountVolume(ds).then(() => {
          refreshZpoolData()
        })
      })
      .catch(() => {
        ElMessage.info('已取消卸载操作')
      })
  }

  /** 销毁数据集(对接 /zfs/destroyDataset，仅卸载后可操作，需二次确认) */
  const handleDatasetDestroy = (ds: ZFSDataSet) => {
    ElMessageBox.confirm(
      `确定销毁数据集「${ds.name}」吗？<br/>销毁后数据集上的数据将无法恢复。`,
      '销毁确认',
      {
        confirmButtonText: '确定销毁',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
      .then(() => {
        fetchDestroyDataset(ds).then(() => {
          refreshZpoolData()
        })
      })
      .catch(() => {
        ElMessage.info('已取消销毁操作')
      })
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

  /* 未导入Zpool列表 */
  .unimport-section {
    margin: 0 10px 10px;
    padding: 12px 14px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  }

  .unimport-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .unimport-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .unimport-count {
    font-size: 12px;
    color: #909399;
  }

  .unimport-count b {
    color: #e6a23c;
  }

  .unimport-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .unimport-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    background: #fafbfc;
    border: 1px solid #f0f2f5;
    border-radius: 6px;
    font-size: 13px;
  }

  .unimport-pool-name {
    font-weight: 500;
    color: #303133;
  }

  .unimport-pool-uuid {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 360px;
    color: #c0c4cc;
    font-size: 12px;
  }

  .unimport-disk-count {
    color: #606266;
    font-size: 12px;
  }

  .unimport-grade {
    padding: 0 8px;
    border-radius: 10px;
    background: #f0f2f5;
    color: #606266;
    font-size: 12px;
    line-height: 20px;
  }

  .unimport-item .el-button {
    margin-left: auto;
    flex-shrink: 0;
  }

  /* 整体布局：左侧存储池列 + 右侧磁盘详情面板 */
  .zpool-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px;
  }

  /* 每个存储池占一整行，纵向排列铺满整个宽度 */
  .zpool-columns {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    min-width: 0;
    min-height: 200px;
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
    width: 100%;
    min-width: 0;
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

  /* 卡片上部：基本信息 + 健康状态 横向平铺 */
  .card-top {
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

  /* 数据集为空提示 */
  .dataset-empty {
    padding: 12px 0;
    font-size: 12px;
    color: #c0c4cc;
    text-align: center;
  }

  /* 数据集列表区：一次显示全部，以卡片形式在下方排列 */
  .dataset-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f0f2f5;
  }

  /* 数据集列表标题行：标题 + 数量统计 */
  .dataset-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dataset-count {
    font-size: 12px;
    color: #909399;
  }

  .dataset-count b {
    color: #303133;
  }

  /* 数据集卡片列表（全部展示，不做内部滚动） */
  .dataset-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dataset-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* 卡片头部：图标 + 名称/挂载状态 + 容量进度 + 更多操作 */
  .dataset-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dataset-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    object-fit: contain;
  }

  .dataset-head-main {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .dataset-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }

  .dataset-status {
    font-size: 12px;
    line-height: 18px;
  }

  .dataset-status.is-mounted {
    color: #4caf50;
  }

  .dataset-status.is-unmounted {
    color: #ec6f30;
  }

  /* 容量进度区（宽度在原有基础上加宽 50px，进度条更长） */
  .dataset-capacity {
    display: flex;
    flex: 0 0 calc(40% + 50px);
    flex-direction: column;
    gap: 4px;
    max-width: 370px;
    min-width: 210px;
  }

  .dataset-capacity-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dataset-progress {
    flex: 1;
    min-width: 0;
  }

  /* 进度条轨道与圆角（与设计稿一致） */
  .dataset-progress :deep(.el-progress-bar__outer) {
    background: #e9edf5;
    border-radius: 3px;
  }

  .dataset-progress :deep(.el-progress-bar__inner) {
    border-radius: 3px;
  }

  .dataset-ratio {
    flex-shrink: 0;
    font-size: 12px;
    color: #303133;
  }

  .dataset-capacity-bottom {
    font-size: 12px;
    color: #909399;
  }

  .dataset-total {
    color: #2b8dfa;
  }

  .dataset-free {
    margin-left: 2px;
  }

  /* 更多操作（点击弹出右键菜单） */
  .dataset-more {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: auto;
    border-radius: 4px;
    flex-shrink: 0;
    cursor: pointer;
    font-size: 20px;
    color: #606266;
  }

  .dataset-more:hover {
    background: #f0f2f5;
  }

  /* 数据集详细信息（灰底，标签40% 值60% 两列对齐） */
  .dataset-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    background: #f4f6f9;
    border-radius: 4px;
  }

  .dataset-detail-row {
    display: flex;
    font-size: 12px;
    line-height: 22px;
  }

  .dataset-detail-label {
    width: 40%;
    flex-shrink: 0;
    color: #666;
  }

  .dataset-detail-value {
    width: 60%;
    color: #333;
    word-break: break-all;
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
