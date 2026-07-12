<template>
  <div>
    <div>
      <div class="menu-container" style="margin-bottom: 10px">
        <ElSpace wrap>
          <ElButton @click="handleNewShareClick">新增</ElButton>
          <ElButton @click="handleEditShareClick" :disabled="currentShareFolder === undefined"
            >编辑</ElButton
          >
          <ElButton @click="handleDeleteShareClick" :disabled="currentShareFolder === undefined"
            >删除</ElButton
          >
        </ElSpace>
      </div>
      <el-empty
        v-if="shareFolderList === null || shareFolderList.length === 0"
        :image-size="300"
        description="未创建共享文件夹"
      />
      <div
        v-else
        v-for="item in shareFolderList"
        :key="item.folder.folderName"
        class="storage-info-container"
        :style="
          currentShareFolder?.folder.folderPath === item.folder.folderPath
            ? 'background: #e6f2fd;'
            : ''
        "
      >
        <!-- 标题区域 -->
        <div
          class="header-section"
          @dblclick="toggleExpand(item)"
          @click="handleCurrentShareFolder(item)"
        >
          <div class="title-with-icon">
            <ThemeSvg :src="folder" style="width: 35px; height: 35px" />
            <span class="main-title">{{ item.folder.folderName }}</span>
          </div>
          <div class="header-actions">
            <el-button
              type="text"
              :icon="item.isExpanded ? 'ArrowUp' : 'ArrowDown'"
              @click="toggleExpand(item)"
              class="expand-btn"
            >
              {{ item.isExpanded ? '收起' : '展开' }}
            </el-button>
          </div>
        </div>
        <!-- 信息卡片（可展开收起） -->
        <el-collapse-transition>
          <div v-show="item.isExpanded" class="info-grid-wrapper">
            <div class="info-grid">
              <!--              存储空间-->
              <div class="info-item">
                <div class="info-label">
                  <span>存储空间：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.storageSpace?.spaceName }}</span>
                </div>
              </div>
              <!--              共享路径-->
              <div class="info-item">
                <div class="info-label">
                  <span>路径：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.folder?.folderPath }}</span>
                </div>
              </div>
              <!-- 回收站 -->
              <div class="info-item">
                <div class="info-label">
                  <span>回收站：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.sambaShareFolderConfig.recycle?.recyclePath }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
    <!--    弹窗-->
    <new-share-folder-dialog
      v-model:visible="newShareDialogVisible"
      :type="newShareDialogType"
      :share-folder="currentShareFolder"
      @refreshData="refreshShareFolderList"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElCollapseTransition, ElMessageBox } from 'element-plus'
  import folder from '@imgs/svg/folder.svg'
  import newShareFolderDialog from './modules/new-share-folder-dialog.vue'
  import ShareFolder = Api.Sys.ShareFolder
  import { fetchDeleteShare, fetchGetShareFolderList } from '@/api/share-folder'
  const newShareDialogVisible = ref(false)
  const newShareDialogType = ref('add')
  // 展开状态
  const shareFolderList = ref<Api.Sys.ShareFolder[]>([])
  const currentShareFolder = ref<Api.Sys.ShareFolder>()
  const refreshShareFolderList = () => {
    fetchGetShareFolderList().then((res) => {
      if (res.records) {
        shareFolderList.value = res.records
      }
    })
  }
  // 点击当前的共享目录
  const handleCurrentShareFolder = (item: ShareFolder) => {
    currentShareFolder.value = item
  }

  onMounted(() => {
    refreshShareFolderList()
  })

  // 切换展开/收起
  const toggleExpand = (item: ShareFolder) => {
    item.isExpanded = !item.isExpanded
  }
  // 点击了创建的的按钮
  const handleNewShareClick = () => {
    newShareDialogVisible.value = true
    newShareDialogType.value = 'add'
  }

  const handleEditShareClick = () => {
    newShareDialogVisible.value = true
    newShareDialogType.value = 'edit'
  }

  //  点击删除按钮的回调...
  const handleDeleteShareClick = () => {
    if (currentShareFolder.value) {
      ElMessageBox.confirm(
        `您是否确认将${currentShareFolder.value?.folder.folderName}文件夹删除?`,
        '删除警告',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          fetchDeleteShare(currentShareFolder.value).then(() => {
            currentShareFolder.value = undefined
            refreshShareFolderList()
          })
        })
        .catch(() => {})
    }
  }
</script>

<style scoped lang="scss">
  .storage-info-container {
    margin-top: 10px;
    background: #ffffff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 10px;
    max-width: 100%;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    transition: all 0.3s ease;
  }

  // 头部样式
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
  }

  .title-with-icon {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-icon {
    color: #409eff;
    font-size: 24px;
  }

  .main-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    line-height: 1;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .expand-btn {
    color: #909399;
    font-size: 14px;

    &:hover {
      color: #409eff;
      background-color: transparent;
    }
  }

  // 描述区域
  .description-section {
    margin-bottom: 24px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #409eff;
    transition: all 0.3s ease;

    &.collapsed {
      margin-bottom: 0;
      opacity: 0.8;
    }
  }

  // 信息网格布局
  .info-grid-wrapper {
    overflow: hidden;
  }

  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    padding: 8px 0;
  }

  // 信息项样式
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #e6f2fd;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;

    &:hover {
      background: #f5f7fa;
      border-color: #dcdfe6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &:active {
      transform: translateY(0);
      transition: transform 0.1s ease;
    }
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    width: 50%;
    .item-icon {
      color: #909399;
      font-size: 16px;
    }
  }

  .info-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    width: 50%;
    .status-icon {
      font-size: 14px;
    }
  }

  // 状态样式
  .status-enabled {
    color: #67c23a;

    .status-icon {
      color: #67c23a;
    }
  }

  .status-disabled {
    color: #f56c6c;

    .status-icon {
      color: #f56c6c;
    }
  }

  .status-active {
    color: #409eff;

    .status-icon {
      color: #409eff;
    }
  }

  // 文件大小样式
  .size-value {
    color: #303133;
    font-weight: 600;
  }

  .size-number {
    font-size: 16px;
  }

  .size-unit {
    font-size: 12px;
    color: #909399;
    margin-left: 2px;
  }

  // 额外操作区域
  .additional-actions {
    margin-top: 20px;
    animation: fadeIn 0.3s ease;
  }

  .actions-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #dcdfe6, transparent);
    margin: 16px 0;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  // 动画效果
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 展开/收起动画
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .expand-enter-to,
  .expand-leave-from {
    opacity: 1;
    max-height: 500px;
  }

  // 响应式调整
  @media (max-width: 768px) {
    .storage-info-container {
      padding: 16px;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .header-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .main-title {
      font-size: 18px;
    }

    .action-buttons {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .info-value {
      align-self: flex-end;
    }

    .action-buttons {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
</style>
