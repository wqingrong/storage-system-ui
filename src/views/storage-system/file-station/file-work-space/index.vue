<template>
  <div class="art-full-height">
    <div class="tree-container">
      <div class="left-sidebar">
        <ElCard class="art-table-card" shadow="never" style="margin-top: 0">
          <template #header>
            <b>分类树</b>
          </template>
          <ElScrollbar>
            <ElTree
              :data="treeData"
              :props="treeProps"
              node-key="id"
              default-expand-all
              highlight-current
              @node-click="handleNodeClick"
            />
          </ElScrollbar>
        </ElCard>
      </div>

      <div class="right-content art-full-height">
        <UserSearch v-model="defaultFilter" />

        <ElCard class="art-table-card" shadow="never">
          <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
            <template #left>
              <ElSpace wrap>
                <ElButton @click="showButtons = !showButtons" v-ripple type="primary" plain
                  >{{ showButtons ? '收起' : '展开' }}按钮组</ElButton
                >
                <ElButton v-show="showButtons" v-ripple v-for="value in 12" :key="value"
                  >表格自适应</ElButton
                >
              </ElSpace>
            </template>
          </ArtTableHeader>

          <ArtTable
            rowKey="id"
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
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { fetchGetUserList } from '@/api/system-manage'
  import UserSearch from '@views/system/user/modules/user-search.vue'
  import { fetchGetDirInfoList, fetchGetStoragePathList } from '@/api/file-station-service'
  import { FileStoryField, SortType } from '@/enums/formEnum'

  defineOptions({ name: 'TreeTable' })

  const showButtons = ref(false)

  interface FileListParams {
    path: string
    pageSize: number
    currentPage: number
    sortField: number
    sortType: string
  }

  class FileInfo {
    id: string
    name: string
    size: string
    isDir: boolean
    path: string
    ownerName: string
    groupName: string
    permission: string
    modifyTime: string
    children: any

    // 构造函数：new 时自动初始化所有字段
    constructor(
      id: string = '',
      name: string = '',
      size: string = '',
      isDir: boolean = false,
      path: string = '',
      ownerName: string = '',
      groupName: string = '',
      permission: string = '',
      modifyTime: string = '',
      children: any = []
    ) {
      this.id = id
      this.name = name
      this.size = size
      this.isDir = isDir
      this.path = path
      this.ownerName = ownerName
      this.groupName = groupName
      this.permission = permission
      this.modifyTime = modifyTime
      this.children = children
    }
  }
  const treeData = ref([])

  //  加载顶层的列表名称
  const loadingRootPath = () => {
    fetchGetStoragePathList().then((res) => {
      treeData.value = res.map((item: any) => {
        return { ...new FileInfo(), ...item }
      })
    })
  }
  onMounted(() => {
    loadingRootPath()
  })
  // 树形数据 - 组织架构示例

  const treeProps = {
    children: 'children',
    label: 'name'
  }

  const handleNodeClick = (data: any) => {
    if (data.children.length > 0) return
    fetchGetDirInfoList({
      path: data.path,
      pageSize: 1,
      currentPage: 1,
      sortField: FileStoryField.NAME,
      sortType: SortType.ASC
    }).then((res) => {
      if (res.fileInfoList) {
        data.children = res.fileInfoList.map((item: any) => {
          return { ...new FileInfo(), ...item }
        })
      }
    })
  }

  // 表单搜索初始值
  const defaultFilter = ref({
    name: undefined
  })

  const {
    data,
    columns,
    columnChecks,
    loading,
    pagination,
    refreshData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      // apiFn: fetchGetUserList,
      apiParams: {
        current: 1,
        size: 20,
        userName: '',
        userPhone: '',
        userEmail: ''
      },
      columnsFactory: () => [
        {
          prop: 'id',
          label: 'ID'
        },
        {
          prop: 'nickName',
          label: '昵称'
        },
        {
          prop: 'userGender',
          label: '性别',
          sortable: true,
          formatter: (row) => row.userGender || '未知'
        },
        {
          prop: 'userPhone',
          label: '手机号'
        },
        {
          prop: 'userEmail',
          label: '邮箱'
        }
      ]
    }
  })
</script>

<style lang="scss" scoped>
  .tree-container {
    box-sizing: border-box;
    display: flex;
    gap: 16px;
    height: 100%;

    .left-sidebar {
      flex-shrink: 0;
      width: 230px;
      height: 100%;
    }

    .right-content {
      flex-grow: 1;
      min-width: 0;
      height: 100%;
    }

    .art-table-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }

  @media screen and (max-width: $device-ipad) {
    .tree-container {
      display: block;
      gap: 0;
      height: auto;

      .left-sidebar {
        width: 100%;
        height: auto;
        margin-bottom: 20px;
      }
    }
  }
</style>
