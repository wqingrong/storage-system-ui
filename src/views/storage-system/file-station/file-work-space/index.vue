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
                @node-click="(treeNode) => handleNodeClick(treeNode, true)"
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
          <div class="menu-container" style="margin-bottom: 10px">
            <ElSpace wrap>
              <ElButton @click="handleNewDirectory">新建文件夹</ElButton>
              <ElButton @click="handleRenameFileInfo" :disabled="selectionFileInfoRows.length !== 1"
                >重命名</ElButton
              >
              <ElButton
                @click="handleDeleteFileInfos"
                :disabled="selectionFileInfoRows.length === 0"
                >删除</ElButton
              >
            </ElSpace>
          </div>
          <ArtTableHeader
            v-model:columns="columnChecks"
            :loading="loading"
            @refresh="refreshData"
            layout="search, refresh, size, fullscreen, columns"
          >
            <template #left>
              <div class="art-table-breadcrumb">
                <!-- 返回上一级按钮 -->
                <el-button
                  text
                  :disabled="pathHistory.length <= 1"
                  @click="goBack"
                  :icon="ArrowLeft"
                />

                <!-- 前进下一级按钮 -->
                <el-button
                  text
                  :disabled="forwardStack.length === 0"
                  @click="goForward"
                  :icon="ArrowRight"
                />

                <!-- 当前路径显示 -->
                <span class="path-name">{{ currentPathName }}</span>
              </div>
            </template>
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
            @selection-change="handleSelectionFileInfo"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
          </ArtTable>
        </ElCard>
      </div>
    </div>
    <create-dir-dialog
      v-model:visible="createDirVisible"
      type="create"
      :father-path="currentPathName ? currentPathName : ''"
      @create-directory="submitCreateDirectory"
    />
    <rename-dialog
      v-model:visible="renameVisible"
      :file-info="selectionFileInfoRows.length > 0 ? selectionFileInfoRows[0] : null"
      @submit-rename="submitRename"
    />
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
  import { Folder, Document, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
  import CreateDirDialog from '@views/storage-system/file-station/file-work-space/modules/create-dir-dialog.vue'
  import RenameDialog from '@views/storage-system/file-station/file-work-space/modules/rename-dialog.vue'
  import { fetchSubmitDeleteDirectory } from '@/api/task-service'

  const createDirVisible = ref(false)
  const renameVisible = ref(false)
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

  const handleDeleteFileInfos = () => {
    console.log('点击了删除')
    fetchSubmitDeleteDirectory({
      name: '',
      path: ''
    }).then((res) => {
      console.log('res>>', res)
    })
  }

  // 新建文件夹的弹窗
  const handleNewDirectory = () => {
    createDirVisible.value = true
  }

  // 点击确定创建文件夹
  const submitCreateDirectory = (params: any) => {
    console.log('点击提交创建文件夹的表单', params)
  }

  const handleRenameFileInfo = () => {
    renameVisible.value = true
  }

  const submitRename = (params: FileInfo) => {
    console.log('重命名参数', params)
  }
  // 多选选中的文件列表
  const selectionFileInfoRows = ref<FileInfo[]>([])
  const treeData = ref([])
  const treeRef = ref() // 加这行

  const pathHistory = ref<FileInfo[]>([]) // 路径历史栈
  const forwardStack = ref<FileInfo[]>([]) // 前进栈
  const currentPathName = computed(() => pathHistory.value.at(-1)?.path) // 当前路径名

  // 返回上一级
  const goBack = () => {
    if (pathHistory.value.length <= 1) {
      ElMessage.warning('已经是最顶层目录')
      return
    }
    // 把当前路径压入前进栈
    forwardStack.value.push(pathHistory.value.pop()!)
    // 刷新数据（切换到上一级目录）
    handleNodeClick(pathHistory.value.at(-1)!, false)
  }

  // 前进下一级
  const goForward = () => {
    if (forwardStack.value.length === 0) {
      ElMessage.warning('没有可前进的目录')
      return
    }
    const nextNode = forwardStack.value.pop()!
    pathHistory.value.push(nextNode)
    handleNodeClick(nextNode, false)
  }

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
      if (treeData.value.length > 0) {
        handleNodeClick(treeData.value[0], true)
      }
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

  const handleNodeClick = async (data: any, isHistory: boolean) => {
    // 节流...
    Object.assign(searchParams, { path: data.path })
    await refreshData()
    await loadNodeChildren(data)
    if (isHistory) pathHistory.value.push(data)
  }

  const dbClickWorkSpaceFile = async (row: FileInfo) => {
    if (!row.isDir) return
    let targetNode = treeRef.value.getNode(row.id)

    if (targetNode) {
      await handleNodeClick(targetNode.data, true)
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
      }
    }
    Object.assign(searchParams, sortParams)
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
          type: 'selection',
          width: 55,
          align: 'center'
        },
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

  // 当前选中的行数据
  const handleSelectionFileInfo = (selectionRows: FileInfo[]) => {
    selectionFileInfoRows.value = selectionRows
  }
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
  /* 面包屑样式：和表头对齐、紧凑美观 */
  .art-table-breadcrumb {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 32px;
  }

  /* 当前路径文字样式 */
  .path-name {
    margin-left: 4px;
    font-size: 13px;
    color: #303133;
    font-weight: 500;
  }
</style>
