<template>
  <div class="art-full-height">
    <div class="tree-container">
      <div class="right-content art-full-height" style="margin-bottom: 40px">
        <ElCard class="art-table-card" shadow="never">
          <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
            <template #left>
              <ElSpace wrap>
                <ElButton @click="showGroupDialog('add')">新增用户组</ElButton>
                <ElButton @click="handleDeleteGroup">删除用户组</ElButton>
                <ElButton @click="handleEditGroup" :disabled="selectedGroupRows.length > 1"
                  >编辑用户组</ElButton
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
  import { fetchAddGroup, fetchGetGroupList } from '@/api/system-manage'
  import UserDialog from './modules/user-dialog.vue'
  import UserListItem = Api.SystemManage.UserListItem
  import SysGroup = Api.Sys.SysGroup
  import GroupDialog from '@views/storage-system/users-manager/groups/modules/group-dialog.vue'
  import { aesEncrypt, aseDecrypt } from '@utils/encryption'

  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const dialogAddGroupVisible = ref(false)
  const currentGroupItem = ref<SysGroup>()
  const selectedGroupRows = ref<SysGroup[]>([])

  // 当前选中的用户组选项
  defineOptions({ name: 'GroupsManager' })

  const groupsList = ref<Api.Sys.SysGroup[]>([])

  currentGroupItem.value = groupsList.value[0]
  /**
   * 显示用户弹窗
   */
  const showAddUserDialog = (type: Form.DialogType, row?: UserListItem): void => {
    console.log('打开弹窗:', { type, row })
    dialogType.value = type
    // currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const showGroupDialog = (type: Form.DialogType, row?: SysGroup): void => {
    dialogType.value = type
    dialogAddGroupVisible.value = true
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      // currentUserData.value = {}
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 添加用户组请求接口
  const handleAddGroupDialogSubmit = async (formData: Api.Dto.AddGroupDto) => {
    try {
      fetchAddGroup(formData).then((res) => {
        // 触发刷新操作
        refreshData()
        console.log('添加用户组成功', res)
      })
      dialogAddGroupVisible.value = false
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleEditGroupDialogSubmit = async (formData: Api.Sys.SysGroup) => {
    try {
      console.log('编辑提交的表单信息>>>>', formData)
      dialogAddGroupVisible.value = false
      // currentUserData.value = {}
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleDeleteGroup = () => {
    console.log('删除用户组')
    console.log(currentGroupItem.value)
  }

  const handleEditGroup = () => {
    console.log('编辑用户组')
    console.log(currentGroupItem.value)
    showGroupDialog('edit', currentGroupItem.value)
  }

  onMounted(() => {
    let aesEncrypt1 = aesEncrypt('wangqingrong')
    console.log('aes加密结果', aesEncrypt1)
    let s = aseDecrypt(aesEncrypt1)
    console.log('aes解密结果', s)
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
        { type: 'selection' }, // 勾选列
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
        }
      ]
    }
  })

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: Api.Sys.SysGroup[]): void => {
    selectedGroupRows.value = selection
    console.log('选中行数据:', selectedGroupRows.value)
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
