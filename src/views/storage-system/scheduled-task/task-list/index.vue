<!-- 定时任务 - 任务列表 -->
<template>
  <div class="task-page art-full-height">
    <!-- 搜索栏 -->
    <div class="table-filter-bar">
      <div class="filter-left">
        <ElInput
          v-model="searchParams.taskName"
          placeholder="搜索任务名称"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-model="searchParams.status"
          placeholder="任务状态"
          clearable
          style="width: 140px; margin-left: 12px"
        >
          <ElOption label="全部" value="" />
          <ElOption label="启用" value="enabled" />
          <ElOption label="禁用" value="disabled" />
        </ElSelect>
        <ElButton type="primary" style="margin-left: 12px" @click="handleSearch">
          搜索
        </ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>
      <div class="filter-right">
        <ElButton type="primary" @click="handleCreate">
          <ElIcon><Plus /></ElIcon>
          新建任务
        </ElButton>
      </div>
    </div>

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格 -->
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
          <ElTag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? '启用' : '禁用' }}
          </ElTag>
        </template>
        <!-- 最近执行结果 -->
        <template #lastResult="{ row }">
          <ElTag
            :type="row.lastResult === 'success' ? 'success' : row.lastResult === 'fail' ? 'danger' : 'info'"
            size="small"
          >
            {{ row.lastResult === 'success' ? '成功' : row.lastResult === 'fail' ? '失败' : '无记录' }}
          </ElTag>
        </template>
        <!-- 操作列 -->
        <template #action="{ row }">
          <ElButton type="primary" link size="small" @click="handleExecute(row)">
            立即执行
          </ElButton>
          <ElButton type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </ElButton>
          <ElPopconfirm
            title="确定删除该任务吗？"
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
  </div>
</template>

<script setup lang="ts">
  import { Plus } from '@element-plus/icons-vue'
  import { useTable } from '@/composables/useTable'
  import { fetchScheduledTaskList, fetchDeleteScheduledTask, fetchExecuteScheduledTask } from '@/api/scheduled-task-service'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'ScheduledTaskList' })

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
      apiFn: fetchScheduledTaskList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'taskName',
          label: '任务名称',
          minWidth: 180
        },
        {
          prop: 'cronExpression',
          label: 'Cron 表达式',
          width: 160
        },
        {
          prop: 'taskDescription',
          label: '任务描述',
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          slot: 'status'
        },
        {
          prop: 'lastRunTime',
          label: '上次执行时间',
          width: 180
        },
        {
          prop: 'nextRunTime',
          label: '下次执行时间',
          width: 180
        },
        {
          prop: 'lastResult',
          label: '执行结果',
          width: 100,
          slot: 'lastResult'
        },
        {
          prop: 'action',
          label: '操作',
          width: 220,
          slot: 'action',
          fixed: 'right'
        }
      ]
    }
  })

  /** 搜索 */
  const handleSearch = () => {
    getData()
  }

  /** 重置搜索 */
  const handleReset = () => {
    searchParams.taskName = ''
    searchParams.status = ''
    getData()
  }

  /** 新建任务 */
  const handleCreate = () => {
    ElMessage.info('新建任务功能开发中')
  }

  /** 编辑任务 */
  const handleEdit = (row: Record<string, any>) => {
    ElMessage.info(`编辑任务: ${row.taskName}`)
  }

  /** 删除任务 */
  const handleDelete = async (row: Record<string, any>) => {
    try {
      await fetchDeleteScheduledTask({ id: row.id })
      ElMessage.success('删除成功')
      getData()
    } catch {
      ElMessage.error('删除失败')
    }
  }

  /** 立即执行 */
  const handleExecute = async (row: Record<string, any>) => {
    try {
      await fetchExecuteScheduledTask({ id: row.id })
      ElMessage.success('任务已触发执行')
      getData()
    } catch {
      ElMessage.error('执行失败')
    }
  }
</script>

<style lang="scss" scoped>
  .task-page {
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