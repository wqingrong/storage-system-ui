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
          <ArtTable
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            @selection-change="handleSelectionChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
          </ArtTable>
        </ElCard>
      </div>
    </div>
    <!-- 用户弹窗 -->
    <UserDialog v-model:visible="dialogVisible" :type="dialogType" @submit="handleDialogSubmit" />
    <!--    用户组弹出-->
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
    fetchGetGroupList
  } from '@/api/system-manage'
  import UserDialog from './modules/user-dialog.vue'
  import SysGroup = Api.Sys.SysGroup
  import GroupDialog from '@views/storage-system/users-manager/groups/modules/group-dialog.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { ElMessageBox } from 'element-plus'

  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const dialogAddGroupVisible = ref(false)
  let currentGroupItem = ref<SysGroup>()
  const selectedGroupRows = ref<SysGroup[]>([])

  // 当前选中的用户组选项
  defineOptions({ name: 'GroupsManager' })

  const showGroupDialog = (type: Form.DialogType, row?: SysGroup): void => {
    dialogType.value = type
    dialogAddGroupVisible.value = true
    if (type === 'edit') {
      currentGroupItem.value = row
    }
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    dialogVisible.value = false
  }

  // 添加用户组请求接口
  const handleAddGroupDialogSubmit = async (formData: Api.Dto.SysGroupDto) => {
    fetchAddGroup(formData).then(() => {
      // 触发刷新操作
      refreshData()
    })
    dialogAddGroupVisible.value = false
  }

  // 编辑用户组信息接口
  const handleEditGroupDialogSubmit = async (formData: Api.Dto.SysGroupDto) => {
    fetchEditGroup(formData).then(() => {
      dialogAddGroupVisible.value = false
      refreshData()
    })
  }

  // 删除选中的用户组...
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
        {
          type: 'selection'
        },
        {
          prop: 'gid',
          label: 'gid'
        },
        {
          prop: 'groupName',
          label: '组名'
        },
        {
          prop: 'groupAlias',
          label: '组别名'
        },
        {
          prop: 'groupDesc',
          label: '描述信息'
        },
        {
          prop: 'totalPeople',
          label: '成员人数'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right', // 固定列
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

  /**
   * 处理表格行选择变化
   */
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
