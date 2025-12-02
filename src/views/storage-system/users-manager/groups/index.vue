<template>
  <div class="art-full-height">
    <div class="tree-container">
      <div class="left-sidebar" style="width: 300px">
        <ElCard class="art-table-card" shadow="never" style="margin-top: 0">
          <template #header>
            <b>用户组</b>
          </template>
          <ElScrollbar>
            <group-list :groupList="groupsList" v-model:currentGroupItem="currentGroupItem" />
          </ElScrollbar>
        </ElCard>
      </div>
      <div class="right-content art-full-height">
        <ElSpace wrap>
          <ElButton @click="showGroupDialog('add')">新增用户组</ElButton>
        </ElSpace>
        <ElCard class="art-table-card" shadow="never">
          <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
            <template #left>
              <ElSpace wrap>
                <ElButton @click="handleDeleteGroup">删除用户组</ElButton>
                <ElButton @click="handleEditGroup">编辑用户组</ElButton>
                <ElButton @click="showAddUserDialog('add')" v-ripple>新增用户</ElButton>
              </ElSpace>
            </template>
          </ArtTableHeader>
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
  import { fetchGetUserList } from '@/api/system-manage'
  import UserDialog from './modules/user-dialog.vue'
  import UserListItem = Api.SystemManage.UserListItem
  import SysGroup = Api.Sys.SysGroup
  import GroupList from '@views/storage-system/users-manager/groups/modules/group-list.vue'
  import GroupDialog from '@views/storage-system/users-manager/groups/modules/group-dialog.vue'

  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const dialogAddGroupVisible = ref(false)
  const currentGroupItem = ref<SysGroup>() // 与用户组列表双重绑定的变量
  // 当前选中的用户组选项
  defineOptions({ name: 'GroupsManager' })

  const groupsList = ref<Api.Sys.SysGroup[]>([])
  groupsList.value = [
    {
      groupName: '用户组1',
      groupAlias: '用户组1的描述',
      groupDesc: '',
      createTime: '',
      gid: 1,
      totalPeople: 10
    },
    {
      groupName: '用户组2',
      groupAlias: '用户组2的描述',
      createTime: '',
      groupDesc: '',
      gid: 2,
      totalPeople: 10
    },
    {
      groupName: '用户组3',
      groupAlias: '用户组3的描述',
      createTime: '',
      groupDesc: '',
      gid: 3,
      totalPeople: 10
    },
    {
      groupName: '用户组4',
      groupAlias: '用户组4的描述',
      createTime: '',
      groupDesc: '',
      gid: 4,
      totalPeople: 10
    }
  ]
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

  const handleAddGroupDialogSubmit = async (formData: Api.Sys.SysGroup) => {
    try {
      console.log('信息提交的表单信息>>>>', formData)
      dialogAddGroupVisible.value = false
      // currentUserData.value = {}
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
      apiFn: fetchGetUserList,
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
