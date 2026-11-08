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
              :loading="deleteSubmitting"
              :disabled="
                selectionFileInfoRows.length === 0 ||
                selectionFileInfoRows.some((row) => hasRestrictedPurpose(row))
              "
              >删除</ElButton
            >
            <ElButton @click="handleSelectDirectory">路径选择器</ElButton>
            <ElButton type="primary" :disabled="!currentDir?.id" @click="openFilePicker">
              <ElIcon style="margin-right: 4px"><UploadFilled /></ElIcon>
              上传文件
            </ElButton>
            <!-- 隐藏的文件选择器：与拖拽上传共用同一套任务队列 -->
            <input
              ref="fileInputRef"
              type="file"
              multiple
              class="hidden-file-input"
              @change="handleFilesPicked"
            />
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
      :file-info="renameOrigin ?? { name: '' }"
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
      @task-done="handleDeleteTaskDone"
    >
    </delete-task-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { ref, onMounted, onActivated, onUnmounted } from 'vue' // 加入 nextTick
  import {
    fetchGetDirInfoList,
    fetchGetFileInfoList,
    fetchGetStoragePathList,
    fetchNewFolder,
    fetchRenamePath
  } from '@/api/file-station-service'
  import { FileStoryField, SortType } from '@/enums/formEnum'
  import folder from '@imgs/svg/folder.svg'
  import { ElIcon, ElMessageBox, ElTag } from 'element-plus'
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
  import { useChunkUpload } from '@/composables/useChunkUpload'
  import type { FolderCreatedEvent, UploadTarget } from '@/composables/useChunkUpload'
  import { Purpose } from '@/entity/file-station'
  import type { RenamePathReq } from '@/entity/file-station'

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
    beginRename(rightClickRow.value)
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
  // 文件上传：队列化调度，最多 2 个任务同时执行
  // 上传状态是全局单例，离开本页面后仍在后台继续；面板挂在全局布局上
  // ============================================================
  const isDragOver = ref(false)
  let dragCounter = 0 // 应对子元素触发的 dragleave 事件
  const fileInputRef = ref<HTMLInputElement>()

  const { stats, addFiles, addFromDrop, setTarget, onFolderCreated } = useChunkUpload({
    // 每片 5MB，与后端分片落盘逻辑匹配
    chunkSize: 5 * 1024 * 1024,
    // 任务级并发：最多 2 个任务同时跑，其余排队
    concurrency: 2,
    // 单个任务内并行 2 个分片
    chunkConcurrency: 2
  })

  // 上传过程中新建的目录，实时补进左侧树（仅当左侧树正停在该父目录时才插入）
  const stopFolderCreatedSync = onFolderCreated((event: FolderCreatedEvent) => {
    insertDirNode(event.parentId, {
      id: event.id,
      name: event.name,
      path: event.path,
      isDir: true
    })
  })
  onUnmounted(() => stopFolderCreatedSync())

  /** 当前所在目录 */
  const currentDir = computed(() => pathHistory.value.at(-1))

  /**
   * 解析当前上传目标
   * 上传目标在任务入队时就快照到任务上，后续切换目录不会影响已入队的任务
   */
  function resolveUploadTarget(): UploadTarget | null {
    const dir = currentDir.value
    if (!dir?.id) {
      ElMessage.warning('请先选择要上传到的目录')
      return null
    }
    const target: UploadTarget = { id: dir.id, path: dir.path }
    setTarget(target)
    return target
  }

  /** 打开系统文件选择器 */
  const openFilePicker = () => {
    fileInputRef.value?.click()
  }

  /** 选择文件后加入队列 */
  const handleFilesPicked = (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    // 清空 value，允许重复选择同一个文件
    input.value = ''
    if (files.length === 0) return
    const target = resolveUploadTarget()
    if (!target) return
    addFiles(files, target)
  }

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
  const handleDragLeave = () => {
    dragCounter--
    if (dragCounter <= 0) {
      dragCounter = 0
      isDragOver.value = false
    }
  }

  // 释放文件 → 加入上传队列
  const handleDrop = (event: DragEvent) => {
    isDragOver.value = false
    dragCounter = 0

    if (!event.dataTransfer) return
    const target = resolveUploadTarget()
    if (!target) return

    // dataTransfer.items 在 addFromDrop 内部同步读取，避免异步后失效
    void addFromDrop(event, target)
  }

  // 队列全部结束后自动刷新当前目录（只刷新一次，不做轮询）
  watch(
    () => stats.value.active,
    (active, previous) => {
      if (previous > 0 && active === 0 && stats.value.done > 0) {
        refreshData()
      }
    }
  )

  // 本页面被 keep-alive 缓存：从其它页面切回来时不会重新挂载，
  // 若有后台上传任务，回到页面时刷新一次当前目录，保证能看到新传的文件
  onActivated(() => {
    if (stats.value.total > 0 && searchParams.path) refreshData()
  })

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

  /** 删除请求提交中，避免确认框被连点重复触发两次删除任务 */
  const deleteSubmitting = ref(false)

  /**
   * 删除确认文案：
   * 只列前几个名字，数量多时用「等 N 项」收尾，避免弹窗被撑爆
   */
  function buildDeleteConfirmText(rows: FileInfo[]): string {
    const names = rows.map((row) => row.name).filter(Boolean)
    const dirCount = rows.filter((row) => row.isDir).length
    const fileCount = rows.length - dirCount

    const typeParts: string[] = []
    if (dirCount > 0) typeParts.push(`${dirCount} 个文件夹`)
    if (fileCount > 0) typeParts.push(`${fileCount} 个文件`)

    const preview =
      names.length <= 3 ? names.join('、') : `${names.slice(0, 3).join('、')} 等 ${names.length} 项`

    return [`即将删除 ${typeParts.join('、')}：`, preview, '', '删除后将无法恢复，是否继续？'].join(
      '\n'
    )
  }

  const handleDeleteFileInfos = async () => {
    if (deleteSubmitting.value) return
    if (selectionFileInfoRows.value.length === 0) return

    // 检查是否包含受保护的文件（nfsShare / sambaShare / snapshot 不能删除）
    const restrictedFiles = selectionFileInfoRows.value.filter((row) => hasRestrictedPurpose(row))
    if (restrictedFiles.length > 0) {
      ElMessage.warning(
        `以下文件夹受保护，无法删除：${restrictedFiles.map((f) => f.name).join('、')}`
      )
      return
    }

    // 确认期间用户可能改了选中项，这里先快照
    const rows = selectionFileInfoRows.value.map((row) => ({ ...row }))

    try {
      await ElMessageBox.confirm(buildDeleteConfirmText(rows), '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        customClass: 'file-delete-confirm',
        // 不自动聚焦「确定删除」，避免回车误删
        autofocus: false,
        // 点遮罩/按 ESC 都按「取消」处理，不误删
        distinguishCancelAndClose: true
      })
    } catch {
      // 用户取消或关闭弹窗，什么都不做
      return
    }

    deleteSubmitting.value = true
    try {
      const res = await fetchSubmitDeleteDirectory({ pathList: rows.map((item) => item.path) })
      // 记下这批要删除的节点，删除任务成功结束后同步左侧树
      pendingDeleteRows.value = rows
      deleteTaskDialoag.value.visible = true
      deleteTaskDialoag.value.taskId = res.taskId
    } catch {
      // 提交失败：不留下待同步的节点，避免影响下一次删除
      pendingDeleteRows.value = []
    } finally {
      deleteSubmitting.value = false
    }
  }

  /**
   * 删除任务结束：
   * 只有全部成功才同步左侧树（否则以服务端状态为准，只刷新列表）
   */
  const handleDeleteTaskDone = (_taskId: string, outcome?: { success?: boolean }) => {
    const rows = pendingDeleteRows.value
    pendingDeleteRows.value = []

    if (!outcome?.success || rows.length === 0) {
      refreshData()
      return
    }

    // 1. 左侧树移除对应目录节点
    rows.filter((row) => row.isDir).forEach((row) => removeDirNode(row.id))

    // 2. 若当前所在目录被删掉，回退到最近的存活目录
    if (!resetPathIfDeleted(rows)) refreshData()
    selectionFileInfoRows.value = []
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
      const nodeValue = Object.assign(new FileInfo(), res)
      data.value.push(res)
      // 左树同步：插到当前所在目录的节点下（节点未加载时忽略，展开时会从服务端拿到）
      const parentId = pathHistory.value.at(-1)?.id
      if (parentId) insertDirNode(parentId, nodeValue)
    })
  }

  /**
   * 打开重命名弹窗时的对象快照。
   *
   * 请求参数里的 path / id 必须是「重命名之前」的值，而弹窗会带着新名字回传，
   * 所以这里先存一份原始数据，提交时用快照拼请求体，避免把新名字当旧路径发出去。
   */
  const renameOrigin = ref<FileInfo | null>(null)

  /** 打开重命名弹窗（唯一入口，保证快照一定被建立） */
  function beginRename(row?: FileInfo | null): void {
    if (!row?.path || !row.id) return
    if (hasRestrictedPurpose(row)) {
      ElMessage.warning('该文件夹受保护，无法重命名')
      return
    }
    renameOrigin.value = { ...row }
    renameVisible.value = true
  }

  const handleRenameFileInfo = () => {
    beginRename(selectionFileInfoRows.value[0])
  }

  /**
   * 提交重命名
   *
   * 请求体严格对齐后端 entity.RenameFileParam：{ name, path, id }
   *   name = 新名称（仅名称），path / id = 重命名前的完整路径与 id
   */
  const submitRename = async (payload: FileInfo) => {
    const origin = renameOrigin.value
    if (!origin) return

    const newName = String(payload?.name ?? '').trim()
    if (!newName) {
      ElMessage.warning('名称不能为空')
      return
    }
    // 没改动就不发请求
    if (newName === origin.name) {
      renameOrigin.value = null
      return
    }
    // 与弹窗内的校验保持一致，防止绕过校验直接提交非法名称
    if (/[\\/:*?"<>|]/.test(newName)) {
      ElMessage.warning('名称不能包含 \\ / : * ? " < > |')
      return
    }

    const body: RenamePathReq = { name: newName, path: origin.path, id: origin.id }
    if (!body.path || !body.id) {
      ElMessage.warning('缺少路径信息，请刷新列表后重试')
      refreshData()
      return
    }

    try {
      const res = await fetchRenamePath(body)
      const renamed = Object.assign(new FileInfo(), res)
      // 后端 GetTargetPathFileInfo 不返回 purposes，沿用原用途标记，避免文件夹丢了共享/快照标识
      if (!renamed.purposes?.length) renamed.purposes = origin.purposes ?? []

      // 目录：重命名后 id（加密路径）会变，必须整体替换树节点
      if (renamed.isDir) replaceDirNode(origin.id, renamed)
      // 当前视图正好在该目录（或其子目录）时，路径历史里的 id 已全部失效
      if (!followRenamedPath(origin, renamed)) refreshData()
    } catch {
      // 失败原因由 http 拦截器统一提示，这里只把列表拉回真实状态
      refreshData()
    } finally {
      renameOrigin.value = null
    }
  }
  // 多选选中的文件列表
  const selectionFileInfoRows = ref<FileInfo[]>([])
  /** 本轮删除涉及的节点（删除任务结束后用于同步左树） */
  const pendingDeleteRows = ref<FileInfo[]>([])
  const treeData = ref<any[]>([])
  const treeRef = ref() // 加这行

  const pathHistory = ref<FileInfo[]>([]) // 路径历史栈
  const forwardStack = ref<FileInfo[]>([]) // 前进栈
  const currentPathName = computed(() => pathHistory.value.at(-1)?.path) // 当前路径名

  // ============================================================
  // 左侧目录树 ⇄ 工作区 同步
  //
  // 两个必须注意的点：
  //   1. 目录节点 id 是后端对「明文路径」AES 加密后的字符串，重命名会改变
  //      自身及所有子孙的 id，所以增/删/改必须直接操作树，不能只重拉列表。
  //   2. el-tree 的 childNodes 只在 setData / insertChild 时构建，
  //      直接改 data.children 数组不会渲染出节点，必须走 append / remove API。
  // ============================================================

  /** 找到树里已注册的节点（父节点加载过，子节点才会注册） */
  function findTreeNode(id?: string) {
    if (!id) return undefined
    return treeRef.value?.getNode(id)
  }

  /**
   * 父目录节点下已加载的子节点数组；返回 null 表示该节点还没展开过，
   * 此时不做增量插入，等用户展开时由服务端返回最新的目录列表。
   */
  function loadedChildrenOf(parentId: string): any[] | null {
    const children = findTreeNode(parentId)?.data?.children
    return Array.isArray(children) ? children : null
  }

  /** 按名称找到插入位置，保持与右侧列表一致的名称升序 */
  function findInsertRef(parentNode: any, name: string): any | null {
    const target = String(name ?? '')
    const hit = (parentNode?.childNodes ?? []).find(
      (child: any) => String(child.data?.name ?? '').localeCompare(target, 'zh-Hans-CN') > 0
    )
    return hit?.data ?? null
  }

  /**
   * 在指定父目录节点下插入一个目录节点
   *
   * @returns 是否插入成功（父节点未加载时返回 false）
   */
  function insertDirNode(parentId: string, info: Partial<FileInfo>): boolean {
    const tree = treeRef.value
    const parentNode = findTreeNode(parentId)
    const children = loadedChildrenOf(parentId)
    if (!tree || !parentNode || !children) return false
    if (info.id && children.some((item: FileInfo) => item.id === info.id)) return false

    // 新节点子级留空：展开时按新路径去服务端拉取
    const nodeData = { ...new FileInfo(), ...info, isDir: true, children: [] }
    const ref = findInsertRef(parentNode, nodeData.name)
    if (ref) tree.insertBefore(nodeData, ref)
    else tree.append(nodeData, parentNode.data)

    parentNode.expand?.()
    return true
  }

  /** 从树中移除目录节点；节点未加载时无需处理，下次展开自然是服务端最新数据 */
  function removeDirNode(id: string): void {
    const tree = treeRef.value
    if (!tree) return
    if (tree.getNode(id)) {
      tree.remove(id)
      return
    }
    const index = treeData.value.findIndex((item: any) => item.id === id)
    if (index >= 0) treeData.value.splice(index, 1)
  }

  /**
   * 用新数据替换目录节点（重命名）。
   * 重命名后 id 会变，必须删掉旧节点再按新数据插入：只改字段会让 node-key
   * 停在旧值，之后按新 id 查节点、选中高亮都会失效。子节点一并丢弃，
   * 等展开时按新路径重拉（子孙的加密路径前端无法重算）。
   */
  function replaceDirNode(oldId: string, info: FileInfo): void {
    const tree = treeRef.value
    const node = findTreeNode(oldId)
    if (!tree || !node) return

    const parentData = node.parent?.data
    const isRootLevel = Array.isArray(parentData)

    // 记下原来的下一个兄弟节点，替换后插回同一位置，避免根级目录被挪到末尾
    const siblings: any[] = node.parent?.childNodes ?? []
    const nextData = siblings[siblings.indexOf(node) + 1]?.data ?? null

    tree.remove(oldId)

    const nodeData = { ...new FileInfo(), ...info, isDir: true, children: [] }
    if (nextData) {
      tree.insertBefore(nodeData, nextData)
    } else if (isRootLevel) {
      tree.append(nodeData)
    } else {
      tree.append(nodeData, parentData)
    }
  }

  /**
   * 重命名的目录正好是当前所在路径或其祖先时，路径历史里的 id 已全部失效
   * （子孙的加密路径无法在前端重算），直接把历史重置到重命名后的目录。
   *
   * @returns 是否发生了路径回退（true 表示已经刷新过列表）
   */
  function followRenamedPath(before: FileInfo, after: FileInfo): boolean {
    const inRenamedBranch = (path: string): boolean =>
      path === before.path || path.startsWith(`${before.path}/`)
    if (!pathHistory.value.some((item) => inRenamedBranch(item.path))) return false

    const kept = pathHistory.value.filter((item) => !inRenamedBranch(item.path))
    kept.push(after)
    pathHistory.value = kept
    forwardStack.value = []
    treeRef.value?.setCurrentKey(after.id, true)
    void handleNodeClick(after, false)
    return true
  }

  /**
   * 当前所在目录被删除时，回退到最近的存活上级目录。
   *
   * @returns 是否发生了回退（true 表示已经刷新过列表）
   */
  function resetPathIfDeleted(rows: FileInfo[]): boolean {
    const deletedIds = new Set(rows.map((row) => row.id))
    const deletedPaths = rows.map((row) => row.path)
    const isDeleted = (item: FileInfo): boolean =>
      deletedIds.has(item.id) ||
      deletedPaths.some((p) => item.path === p || item.path.startsWith(`${p}/`))
    if (!pathHistory.value.some(isDeleted)) return false

    forwardStack.value = []
    const kept = pathHistory.value.filter((item) => !isDeleted(item))
    const target = kept.at(-1)
    if (!target) {
      // 整条路径都被删掉了，回到根列表重新开始
      pathHistory.value = []
      loadingRootPath()
      return true
    }

    pathHistory.value = kept
    treeRef.value?.setCurrentKey(target.id, true)
    void handleNodeClick(target, false)
    return true
  }

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
      // children 留空（undefined）表示"该节点子级还没加载过"，
      // 新增目录节点时靠它判断左侧树是否正停在这个位置
      node.children = res.records.map((item: FileInfo) => {
        return { ...new FileInfo(), ...item, children: undefined }
      })
    }
  }
  //  加载顶层的列表名称
  const loadingRootPath = () => {
    fetchGetStoragePathList().then((res) => {
      treeData.value = res.map((item: any) => {
        return { ...new FileInfo(), ...item, children: undefined }
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

  /* 隐藏的文件选择器 */
  .hidden-file-input {
    display: none;
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

<style lang="scss">
  /* 删除确认框：MessageBox 被 teleport 到 body，scoped 样式管不到，故用非 scoped */
  .file-delete-confirm {
    max-width: 460px;

    .el-message-box__message p {
      white-space: pre-line;
      line-height: 1.8;
      word-break: break-all;
    }
  }
</style>
