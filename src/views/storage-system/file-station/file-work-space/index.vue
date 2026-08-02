<template>
  <div class="art-full-height" @click="closeContextMenu">
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
      <div
        class="right-content art-full-height"
        :class="{ 'drop-zone-active': isDragOver }"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <!-- 拖拽上传遮罩 -->
        <Transition name="drop-overlay-fade">
          <div v-if="isDragOver" class="drop-overlay">
            <div class="drop-overlay__inner">
              <ElIcon class="drop-overlay__icon" :size="48"><UploadFilled /></ElIcon>
              <p class="drop-overlay__text">释放文件到此处上传</p>
            </div>
          </div>
        </Transition>

        <div class="menu-container" style="margin-bottom: 10px">
          <ElSpace wrap>
            <ElButton
              @click="handleNewDirectory"
              :disabled="hasCreateRestricted(pathHistory.at(-1))"
              >新建文件夹</ElButton
            >
            <ElButton
              @click="handleRenameFileInfo"
              :disabled="
                selectionFileInfoRows.length !== 1 || hasRestrictedPurpose(selectionFileInfoRows[0])
              "
              >重命名</ElButton
            >
            <ElButton
              @click="handleDeleteFileInfos"
              :disabled="
                selectionFileInfoRows.length === 0 ||
                selectionFileInfoRows.some((row) => hasRestrictedPurpose(row))
              "
              >删除</ElButton
            >
            <ElButton @click="handleSelectDirectory">路径选择器</ElButton>
          </ElSpace>
        </div>
        <ElCard class="art-table-card" shadow="never">
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
            :data="data"
            :columns="columns"
            :border="false"
            :pagination="pagination"
            resizable
            @sort-change="handleSortChange"
            @row-dblclick="dbClickWorkSpaceFile"
            @selection-change="handleSelectionFileInfo"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
            @row-contextmenu="handleRowContextMenu"
          >
          </ArtTable>
        </ElCard>
      </div>
    </div>

    <!-- 右键悬浮菜单 重构 -->
    <div
      v-if="contextMenuVisible"
      class="file-context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <div v-if="!hasRestrictedPurpose(rightClickRow)" class="menu-item" @click="contextMenuRename"
        >重命名</div
      >
      <div class="divider"></div>
      <div class="menu-item" @click="contextMenuComputeFileAttribute">属性</div>
      <div v-if="rightClickRow?.isDir" class="menu-item" @click="contextMenuOpenDir"
        >进入文件夹</div
      >
    </div>

    <create-dir-dialog
      v-model:visible="createDirVisible"
      type="create"
      :father-path="currentPathName ? currentPathName : ''"
      @create-directory="submitCreateDirectory"
    />
    <rename-dialog
      v-model:visible="renameVisible"
      :file-info="selectionFileInfoRows.length > 0 ? selectionFileInfoRows[0] : { name: '' }"
      @submit-rename="submitRename"
    />
    <!--   查看文件属性菜单信息-->
    <file-attribute-dialog
      v-model:visible="attributeVisible"
      :file-info="selectionFileInfoRows.length > 0 ? selectionFileInfoRows[0] : { name: '' }"
    />
    <select-file-dialog v-model:visible="selectDirVisible"> </select-file-dialog>

    <!--    删除文件弹窗组件-->
    <delete-task-dialog
      v-model:visible="deleteTaskDialoag.visible"
      :task-id="deleteTaskDialoag.taskId"
      @task-done="refreshData"
    >
    </delete-task-dialog>

    <!--    文件上传面板（右上角悬浮按钮 + 居中弹窗） -->
    <upload-panel
      :upload-list="uploadList"
      @cancel="handleCancelUpload"
      @remove="handleRemoveUpload"
      @retry="handleRetryUpload"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { ref, onMounted } from 'vue' // 加入 nextTick
  import {
    fetchGetDirInfoList,
    fetchGetFileInfoList,
    fetchGetStoragePathList,
    fetchNewFolder,
    fetchRenamePath
  } from '@/api/file-station-service'
  import { FileStoryField, SortType } from '@/enums/formEnum'
  import folder from '@imgs/svg/folder.svg'
  import { ElIcon, ElTag } from 'element-plus'
  import {
    Folder,
    Document,
    ArrowRight,
    ArrowLeft,
    Share,
    Timer,
    UploadFilled
  } from '@element-plus/icons-vue'
  import CreateDirDialog from '@views/storage-system/file-station/file-work-space/modules/create-dir-dialog.vue'
  import RenameDialog from '@views/storage-system/file-station/file-work-space/modules/rename-dialog.vue'
  import { fetchSubmitDeleteDirectory } from '@/api/task-service'
  import FileAttributeDialog from '@views/storage-system/file-station/file-work-space/modules/file-attribute-dialog.vue'
  import selectFileDialog from './modules/select-file-dialog.vue'
  import DeleteTaskDialog from '@views/storage-system/file-station/file-work-space/modules/delete-task-dialog.vue'
  import UploadPanel from '@views/storage-system/file-station/file-work-space/modules/upload-panel.vue'
  import { useChunkUpload } from '@/composables/useChunkUpload'
  import { Purpose } from '@/entity/file-station'

  /**
   * 检查文件/文件夹是否不能删除、不能重命名
   * snapshot / nfsShare / sambaShare 都不能删除和重命名
   */
  const hasRestrictedPurpose = (fileInfo?: FileInfo): boolean => {
    if (!fileInfo?.purposes || fileInfo.purposes.length === 0) return false
    return fileInfo.purposes.some(
      (p: Purpose) => p === Purpose.nfsShare || p === Purpose.sambaShare || p === Purpose.snapshot
    )
  }

  /**
   * 检查当前目录是否不能新建文件夹
   * 只有 snapshot 用途限制新建文件夹，nfsShare / sambaShare 允许新建
   */
  const hasCreateRestricted = (fileInfo?: FileInfo): boolean => {
    if (!fileInfo?.purposes || fileInfo.purposes.length === 0) return false
    return fileInfo.purposes.some((p: Purpose) => p === Purpose.snapshot)
  }

  // 右键菜单相关
  /**
   * 表格行右键菜单
   */
  // 右键菜单相关
  const contextMenuVisible = ref(false)
  const contextMenuX = ref(0)
  const contextMenuY = ref(0)
  const rightClickRow = ref<FileInfo | null>(null)
  const deleteTaskDialoag = ref({
    visible: false,
    taskId: ''
  })

  // 右键行触发
  const handleRowContextMenu = (row: FileInfo, column: any, event: MouseEvent) => {
    event.preventDefault()
    // 阻止冒泡，不会被外层点击立刻关闭
    event.stopPropagation()
    rightClickRow.value = row
    // 同步选中行，保证删除/重命名读取数据正常
    handleSelectionFileInfo([row])
    // 鼠标屏幕坐标，精准定位
    contextMenuX.value = event.clientX
    contextMenuY.value = event.clientY
    contextMenuVisible.value = true
  }

  // 空白处关闭菜单
  const closeContextMenu = () => {
    contextMenuVisible.value = false
    selectionFileInfoRows.value = []
  }

  // 右键菜单 - 重命名
  const contextMenuRename = () => {
    contextMenuVisible.value = false
    if (!rightClickRow.value) return
    if (hasRestrictedPurpose(rightClickRow.value)) {
      ElMessage.warning('该文件夹受保护，无法重命名')
      return
    }
    renameVisible.value = true
  }

  // 右键菜单 - 进入文件夹
  const contextMenuOpenDir = async () => {
    contextMenuVisible.value = false
    if (!rightClickRow.value || !rightClickRow.value.isDir) return
    await dbClickWorkSpaceFile(rightClickRow.value)
  }

  const contextMenuComputeFileAttribute = () => {
    attributeVisible.value = true
    contextMenuVisible.value = false
  }

  const createDirVisible = ref(false)
  const renameVisible = ref(false)
  const attributeVisible = ref(false)
  const selectDirVisible = ref(false)
  defineOptions({ name: 'TreeTable' })

  // ============================================================
  // 拖拽上传相关
  // ============================================================
  const isDragOver = ref(false)
  let dragCounter = 0 // 应对子元素触发的 dragleave 事件

  // 上传 composable（targetPathId 跟随当前目录动态变化）
  const {
    uploadList,
    addFilesFromDrop,
    cancelUpload,
    removeItem,
    retryUpload,
    setTargetPathId,
    setCurrentPath
  } = useChunkUpload({
    chunkSize: 5 * 1024 * 1024, // 5MB 每片
    concurrency: 2,
    targetPathId: '', // 每次 drop 时动态更新
    currentPath: ''
  })

  // 拖拽进入
  const handleDragEnter = (e: DragEvent) => {
    dragCounter++
    if (e.dataTransfer?.types.includes('Files')) {
      isDragOver.value = true
    }
  }

  // 拖拽经过
  const handleDragOver = (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  // 拖拽离开
  const handleDragLeave = (_e: DragEvent) => {
    dragCounter--
    if (dragCounter <= 0) {
      dragCounter = 0
      isDragOver.value = false
    }
  }

  // 释放文件 - 开始上传流程
  const handleDrop = async (event: DragEvent) => {
    isDragOver.value = false
    dragCounter = 0

    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return

    // 更新 targetPathId 为当前目录
    const currentDir = pathHistory.value.at(-1)
    if (currentDir?.id) {
      setTargetPathId(currentDir.id)
      setCurrentPath(currentDir.path || '')
    }

    addFilesFromDrop(event)

    // 上传完成后刷新文件列表
    // 监听上传状态变化，当没有活跃任务时自动刷新
    const checkComplete = setInterval(() => {
      const allDone = uploadList.value.every(
        (item) => item.status === 'done' || item.status === 'error' || item.status === 'cancelled'
      )
      if (uploadList.value.length > 0 && allDone) {
        clearInterval(checkComplete)
        refreshData()
      }
    }, 500)
  }

  // 取消上传
  const handleCancelUpload = (uid: string) => {
    cancelUpload(uid)
  }

  // 移除上传项
  const handleRemoveUpload = (uid: string) => {
    removeItem(uid)
  }

  // 重试上传
  const handleRetryUpload = (uid: string) => {
    retryUpload(uid)
  }

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
    totalBytes: number
    isDir: boolean
    path: string
    ownerName: string
    groupName: string
    permission: string
    modifyTime: string
    children: any
    extension: string
    purposes: Purpose[]

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
      totalBytes: number = 0,
      children: any = [],
      purposes: any = []
    ) {
      this.id = id
      this.name = name
      this.totalBytes = totalBytes
      this.size = size
      this.isDir = isDir
      this.path = path
      this.ownerName = ownerName
      this.groupName = groupName
      this.permission = permission
      this.modifyTime = modifyTime
      this.children = children
      this.extension = extension
      this.purposes = purposes
    }
  }

  const handleDeleteFileInfos = () => {
    console.log('点击了删除')
    if (selectionFileInfoRows.value.length > 0) {
      // 检查是否包含受保护的文件（nfsShare / sambaShare 不能删除）
      const restrictedFiles = selectionFileInfoRows.value.filter((row) => hasRestrictedPurpose(row))
      if (restrictedFiles.length > 0) {
        ElMessage.warning(
          `以下文件夹受保护，无法删除：${restrictedFiles.map((f) => f.name).join('、')}`
        )
        return
      }
      let deletePathList = []
      deletePathList = selectionFileInfoRows.value.map((item) => item.path)
      fetchSubmitDeleteDirectory({
        pathList: deletePathList
      }).then((res) => {
        deleteTaskDialoag.value.visible = true
        deleteTaskDialoag.value.taskId = res.taskId
      })
    }
  }

  const handleSelectDirectory = () => {
    selectDirVisible.value = true
  }

  // 新建文件夹的弹窗
  const handleNewDirectory = () => {
    if (hasCreateRestricted(pathHistory.value.at(-1))) {
      ElMessage.warning('快照目录受保护，无法新建文件夹')
      return
    }
    createDirVisible.value = true
  }

  // 点击确定创建文件夹
  const submitCreateDirectory = (params: any) => {
    fetchNewFolder(params).then((res) => {
      let nodeValue = new FileInfo()
      Object.assign(nodeValue, res)
      data.value.push(res)
      let node = treeRef.value.getNode(pathHistory.value.at(-1)?.id)
      if (node) {
        node.data.children.push(nodeValue)
      }
    })
  }

  const handleRenameFileInfo = () => {
    const target = selectionFileInfoRows.value[0]
    if (target && hasRestrictedPurpose(target)) {
      ElMessage.warning('该文件夹受保护，无法重命名')
      return
    }
    renameVisible.value = true
  }

  // 提交了确定重命名的请求参数
  const submitRename = (params: FileInfo) => {
    if (params) {
      let renameParams = {
        name: params.name,
        path: params.path,
        id: params.id
      }
      fetchRenamePath(renameParams)
        .then((res) => {
          let olderId = params.id
          let nodeValue = new FileInfo()
          Object.assign(nodeValue, res)
          // 更改树形节点
          if (nodeValue.isDir) {
            let node = treeRef.value.getNode(olderId)
            if (node) {
              Object.assign(node.data, res)
            }
          }
        })
        .catch(() => {
          handleNodeClick(pathHistory.value.at(-1)!, false)
        })
    }
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
    console.log('页面挂载>>')
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

  const loadingFetchGetFileInfo = async (params: any) => {
    if (params.path) return fetchGetFileInfoList(params)
    return { records: [] }
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
      apiFn: loadingFetchGetFileInfo,
      apiParams: {
        current: 1,
        size: 20,
        ...workSpaceFileInfoParams.value
      },
      columnsFactory: () => [
        {
          type: 'selection',
          width: 55,
          align: 'center',
          selectable: (row: FileInfo) => !hasRestrictedPurpose(row)
        },
        {
          prop: 'name',
          label: '文件名',
          sortable: 'custom',
          formatter: (row: any) => {
            // 根据用途决定图标：共享 > 快照 > 文件夹/文件
            const purposes: Purpose[] = row.purposes || []
            const isShare = purposes.some(
              (p: Purpose) => p === Purpose.nfsShare || p === Purpose.sambaShare
            )
            const isSnapshot = purposes.some((p: Purpose) => p === Purpose.snapshot)

            let iconColor: string
            let iconName: any

            if (isShare) {
              iconColor = '#409EFF'
              iconName = Share
            } else if (isSnapshot) {
              iconColor = '#67C23A'
              iconName = Timer
            } else if (row.isDir) {
              iconColor = '#E6A23C'
              iconName = Folder
            } else {
              iconColor = '#909399'
              iconName = Document
            }

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
          prop: 'purposes',
          label: '用途',
          formatter: (row: any) => {
            const purposes: Purpose[] = row.purposes || []
            if (purposes.length === 0) return h('span', {}, '-')

            const labelMap: Record<string, string> = {
              [Purpose.nfsShare]: 'NFS',
              [Purpose.sambaShare]: 'SMB',
              [Purpose.snapshot]: '快照'
            }
            const typeMap: Record<string, string> = {
              [Purpose.nfsShare]: 'info',
              [Purpose.sambaShare]: 'info',
              [Purpose.snapshot]: 'success'
            }

            return h(
              'div',
              { style: 'display: flex; flex-wrap: wrap; gap: 4px;' },
              purposes.map((p: Purpose) =>
                h(ElTag, { size: 'small', type: typeMap[p] }, () => labelMap[p] || p)
              )
            )
          }
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
  .file-context-menu {
    position: fixed;
    z-index: 99999;
    width: 120px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    padding: 4px 0;

    .menu-item {
      padding: 7px 16px;
      font-size: 13px;
      cursor: pointer;
      &:hover {
        background-color: #f5f7fa;
        color: #409eff;
      }
    }

    .divider {
      height: 1px;
      margin: 4px 0;
      background-color: #e4e7ed;
    }
  }

  /* ============================================================
     拖拽上传区域样式
  ============================================================ */
  .right-content {
    position: relative;
  }

  .drop-zone-active {
    outline: 2px dashed #409eff;
    outline-offset: -4px;
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    z-index: 999;
    background: rgba(64, 158, 255, 0.08);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    pointer-events: none;

    &__inner {
      text-align: center;
    }

    &__icon {
      color: #409eff;
      margin-bottom: 8px;
    }

    &__text {
      font-size: 16px;
      color: #409eff;
      font-weight: 500;
      margin: 0;
    }
  }

  // 拖拽遮罩过渡动画
  .drop-overlay-fade-enter-active,
  .drop-overlay-fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .drop-overlay-fade-enter-from,
  .drop-overlay-fade-leave-to {
    opacity: 0;
  }
</style>
