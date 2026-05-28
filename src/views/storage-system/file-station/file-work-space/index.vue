<template>
  <div class="art-full-height">
    <div class="tree-container">
      <div class="left-sidebar">
        <ElCard class="art-table-card" shadow="never" style="margin-top: 0">
          <template #header>
            <b>File Station</b>
          </template>
          <ElScrollbar style="width: 100%; overflow-x: auto">
            <div style="min-width: 300px; width: max-content">
              <ElTree
                ref="treeRef"
                :data="treeData"
                :props="treeProps"
                node-key="id"
                default-expand-all
                highlight-current
                @node-click="handleNodeClick"
              >
                <template #default="{ node }">
                  <ThemeSvg :src="folder" style="width: 18px; height: 18px" />
                  {{ node.label }}
                </template>
              </ElTree>
            </div>
          </ElScrollbar>
        </ElCard>
      </div>

      <div class="right-content art-full-height">
        <ElCard class="art-table-card" shadow="never">
          <ArtTableHeader
            v-model:columns="columnChecks"
            :loading="loading"
            @refresh="refreshData"
            layout="search, refresh, size, fullscreen, columns"
          >
          </ArtTableHeader>

          <ArtTable
            rowKey="id"
            :loading="loading"
            :data="data"
            :columns="columns"
            :border="false"
            :pagination="pagination"
            @sort-change="handleSortChange"
            @row-dblclick="dbClickWorkSpaceFile"
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
  import { ref, onMounted } from 'vue' // 加入 nextTick
  import {
    fetchGetDirInfoList,
    fetchGetFileInfoList,
    fetchGetStoragePathList
  } from '@/api/file-station-service'
  import { FileStoryField, SortType } from '@/enums/formEnum'
  import folder from '@imgs/svg/folder.svg'
  import { ElIcon } from 'element-plus'
  import { Folder, Document } from '@element-plus/icons-vue'

  defineOptions({ name: 'TreeTable' })

  interface FileListParams {
    path: string
    sortField: number
    sortType: string
  }

  const workSpaceFileInfoParams = ref<FileListParams>({
    path: '',
    sortField: 1,
    sortType: SortType.ASC
  })

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
    extension: string

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
      extension: string = '',
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
      this.extension = extension
    }
  }
  const treeData = ref([])
  const treeRef = ref() // 加这行

  const loadNodeChildren = async (node: FileInfo) => {
    if (node.children && node.children.length > 0) return

    const res = await fetchGetDirInfoList({
      path: node.path,
      size: 1,
      current: 1,
      sortField: FileStoryField.NAME,
      sortType: SortType.ASC
    })

    if (res.records) {
      node.children = res.records.map((item: FileInfo) => {
        return { ...new FileInfo(), ...item }
      })
    }
  }
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

  const handleNodeClick = async (data: any) => {
    // 节流...
    Object.assign(searchParams, { path: data.path })
    await refreshData()
    await loadNodeChildren(data)
  }

  const dbClickWorkSpaceFile = async (row: FileInfo) => {
    if (!row.isDir) return
    let targetNode = treeRef.value.getNode(row.id)

    if (targetNode) {
      await handleNodeClick(targetNode.data)
      treeRef.value.setCurrentKey(targetNode.data.id, true)
      scrollToTreeNode(targetNode.data.id)
      targetNode.expand()
    }
  }

  // 滚动到指定区域
  const scrollToTreeNode = (nodeId: string) => {
    // 获取树节点对应的 DOM 元素
    const nodeElement = document.querySelector(`[data-key="${nodeId}"]`)
    if (nodeElement) {
      nodeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }

  // 监听排序字段的变化
  const handleSortChange = (field: any) => {
    console.log(field)
    const sortParams = { sortField: FileStoryField.NAME, sortType: SortType.ASC }
    switch (field.prop) {
      case 'name':
        sortParams.sortField = FileStoryField.NAME
        break
      case 'size':
        sortParams.sortField = FileStoryField.SIZE
        break
      case 'modifyTime':
        sortParams.sortField = FileStoryField.MODIFY_TIME
        break
      default:
        break
    }
    if (field.order) {
      if (field.order === 'ascending') {
        sortParams.sortType = SortType.ASC
      }
      if (field.order === 'descending') {
        sortParams.sortType = SortType.DESC
        console.log('Desc')
      }
    }
    Object.assign(searchParams, sortParams)
    console.log('searchParams', searchParams)
    refreshData()
  }

  const {
    data,
    columns,
    columnChecks,
    loading,
    pagination,
    refreshData,
    searchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchGetFileInfoList,
      apiParams: {
        current: 1,
        size: 20,
        ...workSpaceFileInfoParams.value
      },
      columnsFactory: () => [
        {
          prop: 'name',
          label: '文件名',
          sortable: 'custom',
          formatter: (row: any) => {
            // 判断是文件夹还是文件
            const isFolder = row.isDir
            const iconColor = isFolder ? '#E6A23C' : '#909399'
            const iconName = isFolder ? Folder : Document

            return h('div', { style: 'display: flex; align-items: center; gap: 6px;' }, [
              // 图标
              h(
                ElIcon,
                {
                  color: iconColor,
                  style: 'width: 18px; height: 18px;font-size:18px'
                },
                () => h(iconName)
              ),

              // 文件名
              h('span', {}, row.name)
            ])
          }
        },
        {
          prop: 'extension',
          label: '类型',
          formatter: (row: any) => (row.isDir ? '文件夹' : row.extension)
        },
        {
          prop: 'permission',
          label: '权限'
        },
        {
          prop: 'size',
          label: '大小',
          sortable: 'custom'
        },
        {
          prop: 'modifyTime',
          label: '修改时间',
          sortable: 'custom'
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
      width: 300px;
      max-width: 800px;
      height: 100%;
      overflow: hidden; /* 重要 */
    }

    /* 让树节点不自动换行，才能横向滚动 */
    :deep(.el-tree-node__content) {
      white-space: nowrap;
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
