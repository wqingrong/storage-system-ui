<!-- 用户管理 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 更多 useTable 使用示例请移步至 功能示例 下面的 高级表格示例或者查看官方文档 -->
<!-- useTable 文档：https://www.artd.pro/docs/zh/guide/hooks/use-table.html -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <LoggerSearch
      v-model="loggerSearchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></LoggerSearch>

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
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { fetchGetOperationList } from '@/api/system-manage'
  import LoggerSearch from './modules/logger-search.vue'

  defineOptions({ name: 'OperationLogger' })
  // 搜索表单
  const loggerSearchForm = ref({
    logType: '',
    operationMessage_Zh: '',
    operationOwner: ''
  })

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetOperationList,
      apiParams: {
        current: 1,
        size: 20,
        ...loggerSearchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' }, // 序号
        {
          prop: 'logType',
          label: '日志类型',
          width: 200
        },
        {
          prop: 'operationMessage_Zh',
          label: '日志信息',
          width: 600
        },
        {
          prop: 'operationOwner',
          label: '操作用户'
        },
        {
          prop: 'operationTime',
          label: '操作时间'
        }
      ]
    },
    // 数据处理
    transform: {}
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    console.log(params)
    // 搜索参数赋值
    Object.assign(searchParams, params)
    getData()
  }
</script>

<style lang="scss" scoped>
  .user-page {
    :deep(.user) {
      .avatar {
        width: 40px;
        height: 40px;
        margin-left: 0;
        border-radius: 6px;
      }

      > div {
        margin-left: 10px;
      }
    }
  }
</style>
