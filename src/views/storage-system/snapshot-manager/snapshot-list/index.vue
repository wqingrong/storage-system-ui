<!-- 快照管理 - 快照列表 -->
<template>
  <div class="snapshot-page art-full-height">
    <!-- 搜索栏 -->
    <div class="table-filter-bar">
      <div class="filter-left">
        <span class="filter-label">数据集</span>
        <ElSelect
          v-model="searchParams.volumeName"
          placeholder="选择数据集"
          style="width: 220px"
          @change="handleVolumeChange"
        >
          <ElOption
            v-for="vol in volumeOptions"
            :key="vol.volumeName"
            :label="vol.volumeName"
            :value="vol.volumeName"
          />
        </ElSelect>
      </div>
      <div class="filter-right">
        <ElButton type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          删除({{ selectedRows.length }})
        </ElButton>
        <ElButton
          type="warning"
          :disabled="selectedRows.length !== 1"
          style="margin-left: 8px"
          @click="handleRollback"
        >
          回滚({{ selectedRows.length }})
        </ElButton>
        <ElButton type="primary" style="margin-left: 8px" @click="handleCreate">
          <ElIcon><Plus /></ElIcon>
          创建快照
        </ElButton>
      </div>
    </div>

    <ElCard class="art-table-card" shadow="never">
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 创建快照弹窗 -->
    <ElDialog
      v-model="createDialogVisible"
      title="创建快照"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm :model="createForm" label-width="100px">
        <ElFormItem label="数据集" required>
          <ElSelect v-model="createForm.volumeName" placeholder="请选择数据集" style="width: 100%">
            <ElOption
              v-for="vol in volumeOptions"
              :key="vol.volumeName"
              :label="vol.volumeName"
              :value="vol.volumeName"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!canCreate" @click="submitCreate"> 确认创建 </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import { useTable } from '@/composables/useTable'
  import {
    fetchSnapshotList,
    fetchCreateSnapshot,
    fetchDeleteSnapshot,
    fetchRollbackSnapshot,
    fetchGetZfsdDataSetList
  } from '@/api/snapshot-service'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Disk } from '@/typings/disk'

  defineOptions({ name: 'SnapshotList' })

  type SortDirection = 'asc' | 'desc'
  type SnapshotSortField = 'used' | 'refer' | 'creation'

  // interface SnapshotListParams {
  //   mountPath: string
  //   volumeName: string
  //   size: number
  //   current: number
  //   sortField: SnapshotSortField
  //   sortType: SortDirection
  // }

  type SnapshotStatus = 'available' | 'mounted' | 'deleted'

  interface ZFSSnapshot {
    id: string
    name: string
    dataset: string
    snapshotName: string
    snapPath: string
    used: number
    available: number
    referenced: number
    compressRatio: number
    creationTime: string
    mountPoint: string
    mounted: boolean
    status: SnapshotStatus
    isActive: boolean
    isReadOnly: boolean
    description: string
    clone_children: string[]
  }

  // 数据集选项
  const volumeOptions = ref<Disk.Device.StorageSpace[]>([])

  // 多选
  const selectedRows = ref<ZFSSnapshot[]>([])

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchSnapshotList,
      apiParams: {
        current: 1,
        size: 50,
        sortField: 'creation' as SnapshotSortField,
        sortType: 'desc' as SortDirection
      },
      immediate: false,
      columnsFactory: () => [
        { type: 'selection', width: 50 },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'name', label: '快照名称', minWidth: 300 },
        { prop: 'sizeFormat', label: '快照大小', width: 220 },
        { prop: 'status', label: '状态', width: 200, slot: 'status' },
        { prop: 'creationTime', label: '创建时间', width: 180 }
      ]
    }
  })

  onMounted(async () => {
    await loadVolumeOptions()
  })

  /** 加载数据集选项，默认选中第一个 */
  const loadVolumeOptions = async () => {
    try {
      const res = await fetchGetZfsdDataSetList(null)
      volumeOptions.value = res.records || []
      if (volumeOptions.value.length > 0) {
        const first = volumeOptions.value[0]
        searchParams.volumeName = first.volumeName
        searchParams.mountPath = first.mountPath
      }
    } finally {
      await getData()
    }
  }

  /** 数据集变更时重新加载列表 */
  const handleVolumeChange = (volumeName: string) => {
    const selected = volumeOptions.value.find((v) => v.volumeName === volumeName)
    if (selected) {
      searchParams.mountPath = selected.mountPath
    }
    getData()
  }

  // /** 格式化快照大小 */
  // const formatSnapshotSize = (bytes: number): string => {
  //   if (bytes === undefined || bytes === null) return '-'
  //   if (bytes === 0) return '0 B'
  //   const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  //   const k = 1024
  //   const i = Math.floor(Math.log(bytes) / Math.log(k))
  //   const size = (bytes / Math.pow(k, i)).toFixed(i > 0 ? 2 : 0)
  //   return `${size} ${units[i]}`
  // }

  /** 表格选中变更 */
  const handleSelectionChange = (selection: ZFSSnapshot[]) => {
    selectedRows.value = selection
  }

  /** 批量删除 */
  const handleBatchDelete = () => {
    if (selectedRows.value.length === 0) return
    const names = selectedRows.value.map((r) => r.snapshotName).join('、')
    ElMessageBox.confirm(
      `确定删除以下 ${selectedRows.value.length} 个快照吗？<br/>「${names}」<br/>删除后数据将无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
      .then(async () => {
        await fetchDeleteSnapshot(selectedRows.value)
        selectedRows.value = []
        await getData()
      })
      .catch(() => {
        ElMessage.info('已取消删除操作')
      })
  }

  /** 快照回滚 */
  const handleRollback = () => {
    if (selectedRows.value.length !== 1) return
    const names = selectedRows.value.map((r) => r.snapshotName).join('、')
    ElMessageBox.confirm(
      `确定将以下 ${selectedRows.value.length} 个快照进行回滚吗？<br/>「${names}」<br/>回滚后当前数据将被覆盖。`,
      '批量回滚确认',
      {
        confirmButtonText: '确定回滚',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
      .then(async () => {
        try {
          await fetchRollbackSnapshot(selectedRows.value[0])
          selectedRows.value = []
          await getData()
        } catch {
          ElMessage.error('批量回滚失败')
        }
      })
      .catch(() => {
        ElMessage.info('已取消回滚操作')
      })
  }

  // ===== 状态映射 =====
  // const statusTagType = (status: string) => {
  //   const map: Record<string, string> = {
  //     available: 'success',
  //     rolling: 'warning',
  //     invalid: 'info'
  //   }
  //   return map[status] || 'info'
  // }
  //
  // const statusLabel = (status: string) => {
  //   const map: Record<string, string> = {
  //     available: '可用',
  //     rolling: '回滚中',
  //     invalid: '已失效'
  //   }
  //   return map[status] || status
  // }

  // ===== 创建快照 =====
  const createDialogVisible = ref(false)
  const createForm = ref({
    snapshotName: '',
    volumeName: '',
    description: ''
  })

  const canCreate = computed(() => {
    return !!createForm.value.volumeName
  })

  const handleCreate = () => {
    createForm.value = { snapshotName: '', volumeName: '', description: '' }
    createDialogVisible.value = true
  }

  const submitCreate = async () => {
    try {
      await fetchCreateSnapshot(createForm.value)
      createDialogVisible.value = false
      await getData()
    } catch {
      ElMessage.error('创建失败')
    }
  }
</script>

<style lang="scss" scoped>
  .snapshot-page {
    padding: 0;

    .table-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding: 16px 16px 12px;
      background: var(--el-bg-color);
      border-radius: 4px;
    }

    .filter-left {
      display: flex;
      align-items: center;

      .filter-label {
        margin-right: 8px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        white-space: nowrap;
      }
    }

    .filter-right {
      display: flex;
      align-items: center;
    }
  }
</style>
