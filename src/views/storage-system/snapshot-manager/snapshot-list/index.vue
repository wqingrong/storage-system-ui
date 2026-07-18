<!-- 快照管理 - 快照列表 -->
<template>
  <div class="snapshot-page art-full-height">
    <!-- 搜索栏 -->
    <div class="table-filter-bar">
      <div class="filter-left">
        <ElInput
          v-model="searchParams.snapshotName"
          placeholder="搜索快照名称"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-model="searchParams.sourceVolume"
          placeholder="来源存储卷"
          clearable
          style="width: 180px; margin-left: 12px"
        >
          <ElOption
            v-for="vol in volumeOptions"
            :key="vol.value"
            :label="vol.label"
            :value="vol.value"
          />
        </ElSelect>
        <ElSelect
          v-model="searchParams.status"
          placeholder="快照状态"
          clearable
          style="width: 140px; margin-left: 12px"
        >
          <ElOption label="全部" value="" />
          <ElOption label="可用" value="available" />
          <ElOption label="回滚中" value="rolling" />
          <ElOption label="已失效" value="invalid" />
        </ElSelect>
        <ElButton type="primary" style="margin-left: 12px" @click="handleSearch">
          搜索
        </ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>
      <div class="filter-right">
        <ElButton type="primary" @click="handleCreate">
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
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <!-- 状态列 -->
        <template #status="{ row }">
          <ElTag
            :type="statusTagType(row.status)"
            size="small"
          >
            {{ statusLabel(row.status) }}
          </ElTag>
        </template>
        <!-- 快照大小 -->
        <template #snapshotSize="{ row }">
          <span>{{ row.snapshotSize || '-' }}</span>
        </template>
        <!-- 操作列 -->
        <template #action="{ row }">
          <ElButton type="primary" link size="small" @click="handleRollback(row)">
            回滚
          </ElButton>
          <ElButton type="primary" link size="small" @click="handleClone(row)">
            克隆
          </ElButton>
          <ElPopconfirm
            :title="`确定删除快照「${row.snapshotName}」吗？删除后数据将无法恢复。`"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <ElButton type="danger" link size="small">删除</ElButton>
            </template>
          </ElPopconfirm>
        </template>
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
        <ElFormItem label="快照名称" required>
          <ElInput v-model="createForm.snapshotName" placeholder="请输入快照名称" />
        </ElFormItem>
        <ElFormItem label="来源存储卷" required>
          <ElSelect
            v-model="createForm.sourceVolume"
            placeholder="请选择存储卷"
            style="width: 100%"
          >
            <ElOption
              v-for="vol in volumeOptions"
              :key="vol.value"
              :label="vol.label"
              :value="vol.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="快照描述">
          <ElInput
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选，输入快照描述信息"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!canCreate" @click="submitCreate">
          确认创建
        </ElButton>
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
    fetchCloneSnapshot
  } from '@/api/snapshot-service'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'SnapshotList' })

  // 存储卷选项（模拟数据，实际应从接口获取）
  const volumeOptions = ref<{ label: string; value: string }[]>([])

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
        size: 20
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'snapshotName',
          label: '快照名称',
          minWidth: 180
        },
        {
          prop: 'sourceVolume',
          label: '来源存储卷',
          width: 160
        },
        {
          prop: 'snapshotSize',
          label: '快照大小',
          width: 120,
          slot: 'snapshotSize'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          slot: 'status'
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 180
        },
        {
          prop: 'action',
          label: '操作',
          width: 200,
          slot: 'action',
          fixed: 'right'
        }
      ]
    }
  })

  onMounted(() => {
    loadVolumeOptions()
  })

  /** 加载存储卷选项 */
  const loadVolumeOptions = () => {
    // TODO: 对接实际接口获取存储卷列表
    volumeOptions.value = []
  }

  // ===== 搜索 =====
  const handleSearch = () => {
    getData()
  }

  const handleReset = () => {
    searchParams.snapshotName = ''
    searchParams.sourceVolume = ''
    searchParams.status = ''
    getData()
  }

  // ===== 状态映射 =====
  const statusTagType = (status: string) => {
    const map: Record<string, string> = {
      available: 'success',
      rolling: 'warning',
      invalid: 'info'
    }
    return map[status] || 'info'
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      available: '可用',
      rolling: '回滚中',
      invalid: '已失效'
    }
    return map[status] || status
  }

  // ===== 创建快照 =====
  const createDialogVisible = ref(false)
  const createForm = ref({
    snapshotName: '',
    sourceVolume: '',
    description: ''
  })

  const canCreate = computed(() => {
    return createForm.value.snapshotName.trim() && createForm.value.sourceVolume
  })

  const handleCreate = () => {
    createForm.value = { snapshotName: '', sourceVolume: '', description: '' }
    createDialogVisible.value = true
  }

  const submitCreate = async () => {
    try {
      await fetchCreateSnapshot(createForm.value)
      ElMessage.success('快照创建成功')
      createDialogVisible.value = false
      getData()
    } catch {
      ElMessage.error('创建失败')
    }
  }

  // ===== 回滚快照 =====
  const handleRollback = (row: Record<string, any>) => {
    ElMessageBox.confirm(
      `确定将存储卷回滚到快照「${row.snapshotName}」的状态吗？回滚后当前数据将被覆盖。`,
      '回滚确认',
      {
        confirmButtonText: '确定回滚',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        await fetchRollbackSnapshot({ snapshotId: row.id })
        ElMessage.success('回滚成功')
        getData()
      } catch {
        ElMessage.error('回滚失败')
      }
    }).catch(() => {
      ElMessage.info('已取消回滚操作')
    })
  }

  // ===== 克隆快照 =====
  const handleClone = (row: Record<string, any>) => {
    ElMessageBox.prompt('请输入克隆目标名称', '克隆快照', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '输入新的存储卷名称'
    }).then(async ({ value }) => {
      try {
        await fetchCloneSnapshot({ snapshotId: row.id, targetName: value })
        ElMessage.success('克隆成功')
        getData()
      } catch {
        ElMessage.error('克隆失败')
      }
    }).catch(() => {
      ElMessage.info('已取消克隆操作')
    })
  }

  // ===== 删除快照 =====
  const handleDelete = async (row: Record<string, any>) => {
    try {
      await fetchDeleteSnapshot({ snapshotId: row.id })
      ElMessage.success('删除成功')
      getData()
    } catch {
      ElMessage.error('删除失败')
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
    }

    .filter-right {
      display: flex;
      align-items: center;
    }
  }
</style>
