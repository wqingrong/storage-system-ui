<!-- 基础表格 -->
<template>
  <div class="process-page art-full-height">
    <ElCard class="art-table-card" shadow="never" style="margin-top: 0">
      <!-- 顶部筛选排序栏 -->
      <div class="table-filter-bar">
        <div class="filter-item">
          <span class="filter-label">排序字段：</span>
          <ElSelect
            v-model="sortField"
            size="small"
            @change="handleFilterChange"
            style="width: 120px"
          >
            <ElOption label="内存利用率" value="memory" />
            <ElOption label="cpu利用率" value="cpu" />
          </ElSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">每页条数：</span>
          <ElSelect
            v-model="pageSize"
            size="small"
            @change="handleFilterChange"
            style="width: 100px"
          >
            <ElOption label="10" value="10" />
            <ElOption label="10" value="10" />
            <ElOption label="20" value="20" />
            <ElOption label="50" value="50" />
          </ElSelect>
        </div>
      </div>

      <!-- 表格 -->
      <ArtTable
        rowKey="pid"
        :show-table-header="false"
        :loading="loading"
        :data="data"
        :columns="columns"
      >
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useTable } from '@/composables/useTable'
  import { fetchGetSystemProgress } from '@/api/monitor-manager'

  defineOptions({ name: 'SystemProgressMonitor' })

  // 顶部筛选状态
  const sortField = ref<string>('memory')
  const pageSize = ref<number>(20)
  let timer: number | null = null

  // 表格封装
  const { data, columns, loading, searchParams, fetchData } = useTable({
    core: {
      apiFn: fetchGetSystemProgress,
      apiParams: {
        sort_field: sortField.value,
        head_size: pageSize.value
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' }, // 序号
        {
          prop: 'pid',
          label: '进程ID',
          width: 100
        },
        {
          prop: 'user',
          label: '用户',
          width: 100
        },
        {
          prop: 'cpuRatio',
          label: 'CPU利用率 %',
          width: 140
        },
        {
          prop: 'memoryRatio',
          label: '内存利用率 %',
          width: 140
        },
        {
          prop: 'memoryUsage',
          label: '使用内存',
          width: 120
        },
        {
          prop: 'progressCmd',
          label: '进程',
          minWidth: 320
        }
      ]
    }
  })

  // 筛选变更，重新请求接口
  const handleFilterChange = () => {
    // 刷新列表
    searchParams.sort_field = sortField.value
    searchParams.head_size = pageSize.value
    fetchData()
  }

  // 开启3秒轮询
  const startPolling = () => {
    timer = window.setInterval(() => {
      fetchData()
    }, 5000)
  }

  // 清除轮询定时器
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // 组件挂载启动轮询
  onMounted(() => {
    startPolling()
  })

  // 组件销毁停止轮询，防止内存泄漏
  onUnmounted(() => {
    stopPolling()
  })
</script>

<style scoped>
  .table-filter-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
  }
  .filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .filter-label {
    font-size: 14px;
    color: #606266;
  }
  /* 进程命令单行截断 */
  .cmd-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    cursor: pointer;
  }
</style>
