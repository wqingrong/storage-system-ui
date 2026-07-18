<template>
  <div class="art-full-height">
    <div class="tree-container">
      <div class="right-content art-full-height" style="margin-bottom: 40px">
        <ElCard class="art-table-card" shadow="never">
          <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
            <template #left>
              <ElSpace wrap>
                <ElButton @click="showGroupDialog('add')">新增用户组</ElButton>
                <ElButton @click="handleDeleteGroups"
                  >删除用户组({{ selectedGroupRows.length }})</ElButton
                >
              </ElSpace>
            </template>
          </ArtTableHeader>

          <!-- 表格滚动区域：由 el-table height 属性自身管理滚动 -->
          <div class="table-scroll-wrapper">
            <ElTable
              ref="groupTableRef"
              v-loading="loading"
              :data="data"
              row-key="groupName"
              style="width: 100%"
              height="100%"
              @selection-change="handleSelectionChange"
              @expand-change="handleExpandChange"
            >
              <ElTableColumn type="selection" width="50" />
              <ElTableColumn type="expand" width="50">
                <template #default="{ row }">
                  <div class="expand-user-list">
                    <div class="expand-loading" v-if="expandLoadingMap[row.groupName]">
                      <ElIcon class="is-loading"><Loading /></ElIcon>
                      <span>加载中...</span>
                    </div>
                    <template v-else>
                      <div class="expand-header">
                        <span class="expand-title">组成员列表</span>
                        <span class="expand-count"
                          >共 {{ expandUserTotalMap[row.groupName] || 0 }} 人</span
                        >
                        <ElButton
                          class="expand-refresh-btn"
                          size="small"
                          text
                          :loading="expandLoadingMap[row.groupName]"
                          @click="refreshGroupUsers(row.groupName)"
                        >
                          <ElIcon><Refresh /></ElIcon>
                        </ElButton>
                      </div>
                      <ElTable
                        v-if="(expandUserDataMap[row.groupName]?.records?.length || 0) > 0"
                        :data="expandUserDataMap[row.groupName]?.records || []"
                        size="small"
                        class="nested-user-table"
                      >
                        <ElTableColumn prop="userName" label="用户名" width="120" />
                        <ElTableColumn prop="userAlias" label="别名" width="120" />
                        <ElTableColumn prop="userId" label="UID" width="80" />
                        <ElTableColumn prop="userPhone" label="手机号" width="130" />
                        <ElTableColumn prop="userEmail" label="邮箱" min-width="160" />
                        <ElTableColumn prop="userDesc" label="描述" min-width="120" />
                        <ElTableColumn label="操作" width="70" fixed="right">
                          <template #default="scope">
                            <ArtButtonTable type="edit" @click="showEditUserDialog(scope.row)" />
                          </template>
                        </ElTableColumn>
                      </ElTable>
                      <ElEmpty v-else :image-size="40" description="该组暂无成员" />
                      <!-- 组成员分页 -->
                      <div
                        v-if="(expandUserTotalMap[row.groupName] || 0) > 0"
                        class="expand-pagination"
                      >
                        <ElPagination
                          v-model:current-page="expandPaginationMap[row.groupName].current"
                          v-model:page-size="expandPaginationMap[row.groupName].size"
                          :total="expandUserTotalMap[row.groupName] || 0"
                          :page-sizes="[5, 10, 20, 50]"
                          layout="total, sizes, prev, pager, next"
                          small
                          @size-change="handleGroupUserPageChange(row.groupName)"
                          @current-change="handleGroupUserPageChange(row.groupName)"
                        />
                      </div>
                    </template>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="gid" label="GID" width="80" />
              <ElTableColumn prop="groupName" label="组名" width="150" />
              <ElTableColumn prop="groupAlias" label="组别名" width="150" />
              <ElTableColumn prop="groupDesc" label="描述信息" min-width="160" />
              <ElTableColumn prop="totalPeople" label="成员人数" width="100" />
              <ElTableColumn label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <ArtButtonTable type="edit" @click="showGroupDialog('edit', row)" />
                </template>
              </ElTableColumn>
            </ElTable>
          </div>

          <!-- 分页 - 固定在底部中央 -->
          <div class="pagination-wrapper">
            <ElPagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.size"
              :total="pagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </ElCard>
      </div>
    </div>
    <!-- 用户弹窗 -->
    <UserDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :user-data="currentUserData"
      @refreshData="handleUserDialogRefresh"
    />
    <!-- 用户组弹窗 -->
    <GroupDialog
      v-model:visible="dialogAddGroupVisible"
      :type="dialogType"
      :groupData="currentGroupItem"
      @groupAddSubmit="handleAddGroupDialogSubmit"
      @groupEditSubmit="handleEditGroupDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import {
    fetchAddGroup,
    fetchDelGroups,
    fetchEditGroup,
    fetchGetGroupList,
    fetchQueryUserList
  } from '@/api/system-manage'
  import UserDialog from '@views/storage-system/users-manager/users/modules/user-dialog.vue'
  import SysGroup = Api.Sys.SysGroup
  import GroupDialog from '@views/storage-system/users-manager/groups/modules/group-dialog.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { ElMessageBox } from 'element-plus'
  import { Loading, Refresh } from '@element-plus/icons-vue'

  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const dialogAddGroupVisible = ref(false)
  let currentGroupItem = ref<SysGroup>()
  const selectedGroupRows = ref<SysGroup[]>([])
  const groupTableRef = ref()
  // 当前正在编辑的用户数据
  const currentUserData = ref<any>({})
  // 记录正在编辑的用户所属的组名，用于编辑后刷新
  const editingGroupName = ref('')

  defineOptions({ name: 'GroupsManager' })

  // ===== 手风琴展开：用户列表 + 分页缓存 =====
  // 用户数据缓存：records + total
  const expandUserDataMap = ref<Record<string, { records: any[]; total: number }>>({})
  // 总人数缓存（快速访问）
  const expandUserTotalMap = ref<Record<string, number>>({})
  // 每组独立的分页参数
  const expandPaginationMap = ref<Record<string, { current: number; size: number }>>({})
  // 加载状态
  const expandLoadingMap = ref<Record<string, boolean>>({})

  /** 获取某组的分页参数（无则创建默认值） */
  const getGroupPagination = (groupName: string) => {
    if (!expandPaginationMap.value[groupName]) {
      expandPaginationMap.value[groupName] = { current: 1, size: 10 }
    }
    return expandPaginationMap.value[groupName]
  }

  /** 加载指定组的用户列表（按分页） */
  const loadGroupUsers = (groupName: string) => {
    if (expandLoadingMap.value[groupName]) return

    const pg = getGroupPagination(groupName)
    expandLoadingMap.value[groupName] = true
    fetchQueryUserList({
      userName: '',
      userAlias: '',
      current: pg.current,
      size: pg.size,
      orderBy: '',
      sort: '',
      groupName
    } as any)
      .then((res) => {
        expandUserDataMap.value[groupName] = {
          records: res?.records || [],
          total: res?.total || 0
        }
        expandUserTotalMap.value[groupName] = res?.total || 0
      })
      .finally(() => {
        expandLoadingMap.value[groupName] = false
      })
  }

  /** 展开行变化回调 */
  const handleExpandChange = (row: SysGroup, expandedRows: SysGroup[]) => {
    const isExpanding = expandedRows.some((r) => r.groupName === row.groupName)
    if (!isExpanding) return
    // 已加载过则跳过
    if (expandUserDataMap.value[row.groupName]) return
    loadGroupUsers(row.groupName)
  }

  /** 刷新某组的用户列表 */
  const refreshGroupUsers = (groupName: string) => {
    loadGroupUsers(groupName)
  }

  /** 组成员分页变化 */
  const handleGroupUserPageChange = (groupName: string) => {
    loadGroupUsers(groupName)
  }

  const showGroupDialog = (type: Form.DialogType, row?: SysGroup): void => {
    dialogType.value = type
    dialogAddGroupVisible.value = true
    if (type === 'edit') {
      currentGroupItem.value = row
    }
  }

  /** 用户弹窗编辑完成后的回调：刷新对应组成员列表 */
  const handleUserDialogRefresh = () => {
    dialogVisible.value = false
    if (editingGroupName.value) {
      loadGroupUsers(editingGroupName.value)
      editingGroupName.value = ''
    }
  }

  /** 打开编辑用户弹窗 */
  const showEditUserDialog = (userData: any) => {
    currentUserData.value = userData
    dialogType.value = 'edit'
    // 记录当前展开的组名，编辑完成后刷新
    editingGroupName.value = userData.masterGroup?.groupName || userData.groupName || ''
    dialogVisible.value = true
  }

  const handleAddGroupDialogSubmit = async (formData: Api.Dto.SysGroupDto) => {
    fetchAddGroup(formData).then(() => {
      refreshData()
    })
    dialogAddGroupVisible.value = false
  }

  const handleEditGroupDialogSubmit = async (formData: Api.Dto.SysGroupDto) => {
    fetchEditGroup(formData).then(() => {
      dialogAddGroupVisible.value = false
      refreshData()
    })
  }

  const handleDeleteGroups = () => {
    let deleteGroupDtoList = ref<Api.Dto.DeleteSysGroupDto[]>([])
    if (selectedGroupRows.value.length > 0) {
      for (let i = 0; i < selectedGroupRows.value.length; i++) {
        deleteGroupDtoList.value.push({
          groupName: selectedGroupRows.value[i].groupName,
          gid: selectedGroupRows.value[i].gid
        })
      }

      ElMessageBox.confirm(
        `确定要删除选中的${deleteGroupDtoList.value.length}条数据吗？`,
        '删除用户组',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        fetchDelGroups(deleteGroupDtoList.value).then(() => {
          for (const item of deleteGroupDtoList.value) {
            delete expandUserDataMap.value[item.groupName]
            delete expandUserTotalMap.value[item.groupName]
            delete expandPaginationMap.value[item.groupName]
          }
          refreshData()
        })
      })
    }
  }

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
      apiFn: fetchGetGroupList,
      apiParams: {
        current: 1,
        size: 20,
        groupName: '',
        gid: 0,
        orderBy: '',
        sort: ''
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'expand', width: 50 },
        { prop: 'gid', label: 'GID', width: 80 },
        { prop: 'groupName', label: '组名', width: 150 },
        { prop: 'groupAlias', label: '组别名', width: 150 },
        { prop: 'groupDesc', label: '描述信息', minWidth: 160 },
        { prop: 'totalPeople', label: '成员人数', width: 100 },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => showGroupDialog('edit', row)
              })
            ])
        }
      ]
    }
  })

  const handleSelectionChange = (selection: Api.Sys.SysGroup[]): void => {
    selectedGroupRows.value = selection
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

      :deep(.el-card__body) {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
    }

    /* 表格滚动区域：由 el-table[height=100%] 自身管理滚动 */
    .table-scroll-wrapper {
      flex: 1;
      min-height: 0;
    }

    /* 分页固定在底部中央，不随表格滚动 */
    .pagination-wrapper {
      display: flex;
      justify-content: center;
      padding: 12px 0 4px;
      flex-shrink: 0;
      border-top: 1px solid #ebeef5;
      background: #fff;
    }
  }

  /* ===== 展开行：用户列表 ===== */
  .expand-user-list {
    padding: 12px 24px 16px 50px;
    background: #f9fafb;
  }

  .expand-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 0;
    color: #909399;
    font-size: 14px;
  }

  .expand-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .expand-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }

  .expand-count {
    font-size: 12px;
    color: #909399;
  }

  .expand-refresh-btn {
    margin-left: auto;
    font-size: 14px;
  }

  .nested-user-table {
    border-radius: 6px;
    border: 1px solid #e4e7ed;
  }

  .expand-pagination {
    display: flex;
    justify-content: center;
    padding: 12px 0 4px;
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
