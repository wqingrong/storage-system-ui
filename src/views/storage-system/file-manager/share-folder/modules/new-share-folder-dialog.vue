<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '新建共享目录' : '编辑编辑共享目录'"
    width="30%"
    align-center
    class="dialog"
  >
    <ElForm ref="formRef" :model="sysShareFolderFormDto" :rules="rules" label-width="80px">
      <div v-if="currentStep == 0">
        <ElFormItem label="存储空间" prop="storageSpace">
          <el-select
            v-model="sysShareFolderFormDto.mountPath"
            :disabled="props.type === 'edit' || sysShareFolderFormDto.folderPath.length > 0"
            placeholder="其选择存储空间"
          >
            <el-option
              v-for="item in storageSpaceList.records"
              :key="item.mountStatus"
              :label="item.spaceName"
              :value="item.mountPath"
            />
          </el-select>
        </ElFormItem>
        <!--存储空间的显示基本信息-->
        <ElFormItem v-if="getStorageSpaceItem(sysShareFolderFormDto.mountPath)">
          <div>可用空间:</div>
          <div>{{ getStorageSpaceItem(sysShareFolderFormDto.mountPath)?.freeSize }}</div>
          <el-divider style="margin: 10px 0" />
          <div>文件系统:</div>
          <div>{{ getStorageSpaceItem(sysShareFolderFormDto.mountPath)?.fileSystem }}</div>
          <el-divider style="margin: 10px 0" />
        </ElFormItem>
        <ElFormItem label="文件夹" prop="folderName">
          <ElInput
            v-model="sysShareFolderFormDto.folderName"
            :disabled="props.type === 'edit' || sysShareFolderFormDto.folderPath.length > 0"
            placeholder="请输入文件夹名"
          />
        </ElFormItem>
      </div>

      <!--      各个协议的共享设置-->
      <div v-if="currentStep == 1" style="height: 400px">
        <span style="font-size: 15px">协议设置</span>
        <!--     给一个多选框自己选择需要共享出来的协议-->
        <div style="margin-top: 10px; padding-left: 20px">
          <el-tabs v-model="activeName" class="demo-tabs">
            <el-tab-pane label="Samba" name="Samba">
              <div>
                <div>
                  <el-checkbox
                    v-model="sambaShareFolderConfig.recycle.recyclePath"
                    true-value="#recycle"
                    false-value=""
                  >
                    <div class="checkbox-title">开启回收站</div>
                  </el-checkbox>
                  <div style="margin-left: 25px"
                    >删除的文件会存放在自动生成一个#recycle的文件夹下，会占用额外存储空间</div
                  >
                </div>
                <!--                <div>-->
                <!--                  <el-checkbox v-model="defaultSambaShareConfigDto.auditLog">-->
                <!--                    <div class="checkbox-title">审计日志</div>-->
                <!--                  </el-checkbox>-->
                <!--                  <div style="margin-left: 25px">记录该共享目录下的文件操作</div>-->
                <!--                </div>-->
              </div>
            </el-tab-pane>
            <el-tab-pane label="Webdav" name="Webdav">WebDav</el-tab-pane>
            <el-tab-pane label="Rsync" name="Rsync">RSYNC</el-tab-pane>
            <el-tab-pane label="NFS" name="NFS">NFS</el-tab-pane>
            <el-tab-pane label="FTP" name="FTP">FTP</el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!--  选中用户组-->
      <div v-if="currentStep == 2">
        <span style="font-size: 15px; margin-bottom: 10px">权限设置</span>
        <div
          style="
            margin-top: 10px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
          "
        >
          <el-select v-model="tableType" style="width: 150px">
            <el-option label="用户列表" value="localUser" />
            <el-option label="用户组列表" value="localGroup" />
          </el-select>
          <el-input
            style="width: 200px"
            class="responsive-input"
            placeholder="Type something"
            :prefix-icon="Search"
          />
        </div>
        <div style="max-height: 400px">
          <el-table
            v-if="tableType === 'localUser'"
            ref="selectGroupTableRef"
            :data="userDataList.records"
            row-key="gid"
            style="width: 100%"
            :reserve-selection="true"
          >
            <el-table-column property="userName" label="用户名" align="center"></el-table-column>
            <el-table-column property="userAlias" label="别名" align="center" />
            <el-table-column property="write" label="禁止访问" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.basicPermission.FB"
                  true-value="FB"
                  false-label=""
                  @change="handleUserCheckboxChange(scope.row, 'FB')"
                />
              </template>
            </el-table-column>
            <el-table-column property="write" label="可读写" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.basicPermission.RW"
                  true-value="RW"
                  false-label=""
                  @change="handleUserCheckboxChange(scope.row, 'RW')"
                />
              </template>
            </el-table-column>
            <el-table-column property="readOnly" label="只读" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.basicPermission.RO"
                  true-value="RO"
                  false-label=""
                  @change="handleUserCheckboxChange(scope.row, 'RO')"
                />
              </template>
            </el-table-column>
            <el-table-column property="custom" label="自定义" align="center">
              <template #default="scope">
                <el-checkbox
                  :disabled="true"
                  @change="handleUserCheckboxChange(scope.row, 'custom')"
                />
              </template>
            </el-table-column>
          </el-table>

          <el-table
            v-if="tableType === 'localGroup'"
            ref="selectGroupTableRef"
            :data="groupDataList.records"
            row-key="gid"
            style="width: 100%"
            :reserve-selection="true"
          >
            <el-table-column property="groupName" label="用户组" align="center"></el-table-column>
            <el-table-column property="groupAlias" label="别名" align="center" />
            <el-table-column property="write" label="禁止访问" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.basicPermission.FB"
                  true-value="FB"
                  false-label=""
                  @change="handleGroupCheckboxChange(scope.row, 'FB')"
                />
              </template>
            </el-table-column>
            <el-table-column property="write" label="可读写" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.basicPermission.RW"
                  true-value="RW"
                  false-label=""
                  @change="handleGroupCheckboxChange(scope.row, 'RW')"
                />
              </template>
            </el-table-column>
            <el-table-column property="readOnly" label="只读" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.basicPermission.RO"
                  true-value="RO"
                  false-label=""
                  @change="handleGroupCheckboxChange(scope.row, 'RO')"
                />
              </template>
            </el-table-column>
            <el-table-column property="custom" label="自定义" align="center">
              <template #default="scope">
                <el-checkbox
                  :disabled="true"
                  @change="handleGroupCheckboxChange(scope.row, 'custom')"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-if="groupDataList.total > 0 && tableType === 'localUser'"
          background
          :page-sizes="[10, 20, 40, 60]"
          layout="prev, pager, next"
          :total="userDataList.total"
          :current-page="userDataList.current"
          :page-size="userDataList.size"
          @current-change="handleUserPageChange"
          @size-change="handleUserSizeChange"
          :hide-on-single-page="true"
          style="display: flex !important; justify-content: center !important"
        />
        <el-pagination
          v-if="groupDataList.total > 0 && tableType === 'localGroup'"
          background
          :page-sizes="[10, 20, 40, 60]"
          layout="prev, pager, next"
          :total="groupDataList.total"
          :current-page="groupDataList.current"
          :page-size="groupDataList.size"
          @current-change="handleGroupPageChange"
          @size-change="handleGroupSizeChange"
          :hide-on-single-page="true"
          style="display: flex !important; justify-content: center !important"
        />
      </div>
    </ElForm>
    <template #footer>
      <el-button v-if="currentStep == 1" style="float: left" @click="addSysGroup"
        >高级设置</el-button
      >
      <el-button
        v-if="currentStep <= 3 && currentStep != 0"
        @click="prevStep"
        :disabled="currentStep === 0"
        >上一步
      </el-button>
      <el-button type="primary" @click="nextStep"> {{ getButtonTxt() }} </el-button>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElTable, FormInstance, FormRules } from 'element-plus'
  import {
    fetchGetGroupList,
    fetchGetStorageSpaceList,
    fetchQueryUserList
  } from '@/api/system-manage'
  import {
    fetchEditSambaShare,
    fetchGetSambaShareConfig,
    fetchNewShareFolder
  } from '@/api/share-folder'
  import { Search } from '@element-plus/icons-vue'
  import { Disk } from '@/typings/disk'
  import { REGULAR } from '@/enums/formEnum'
  import { ref } from 'vue'
  import { deepEqual } from '@/utils/tools'

  interface Props {
    visible: boolean
    type: string
    shareFolder?: Partial<Api.Sys.ShareFolder>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'refreshData'): void
  }

  const selectGroupTableRef = ref(ElTable)
  const groupDialogVisible = ref(false)
  const tableType = ref('localUser')

  // 作为表单参数的变量用，可以修改的
  const sambaShareFolderConfig = ref<Api.Sys.SambaShareFolderConfig>({
    folderPath: '',
    shareName: '',
    recycle: { recyclePath: '' },
    permission: { writeGroupList: [], writeUserList: [], readGroupList: [], readUserList: [] }
  })

  // 这个是只读的配置信息，用来判断两个变量直接是否发生了变化
  const roSambaShareFolderConfig = ref<Api.Sys.SambaShareFolderConfig>({
    folderPath: '',
    shareName: '',
    recycle: { recyclePath: '' },
    permission: { writeGroupList: [], writeUserList: [], readGroupList: [], readUserList: [] }
  })

  const activeName = ref('Samba')

  // 获取当前按钮显示的文字
  const getButtonTxt = () => {
    switch (currentStep.value) {
      case 0:
        if (sysShareFolderFormDto.value.folderPath) {
          return '下一步'
        } else {
          return '创建'
        }
      case 1:
        return '下一步'
      case 2:
        if (activeName.value === 'Samba') {
          if (deepEqual(sambaShareFolderConfig.value, roSambaShareFolderConfig.value)) {
            return '完成'
          } else {
            return '保存'
          }
        } else {
          return '完成'
        }
      case 3:
        return '完成'
      default:
        return '' // 或者返回一个默认值
    }
  }

  const handleUserCheckboxChange = (item: Api.Sys.SysUser, type: string) => {
    if (type === 'FB') {
      item.basicPermission.FB = 'FB'
      item.basicPermission.RW = ''
      item.basicPermission.RO = ''
      sambaShareFolderConfig.value.permission.readUserList =
        sambaShareFolderConfig.value.permission.readUserList.filter(
          (userName) => userName !== item.userName
        )
      sambaShareFolderConfig.value.permission.writeUserList =
        sambaShareFolderConfig.value.permission.writeUserList.filter(
          (userName) => userName !== item.userName
        )
    }
    if (type === 'RW') {
      item.basicPermission.FB = ''
      item.basicPermission.RO = ''
      if (item.basicPermission.RW) {
        sambaShareFolderConfig.value.permission.readUserList =
          sambaShareFolderConfig.value.permission.readUserList.filter(
            (userName) => userName !== item.userName
          )
        if (!sambaShareFolderConfig.value.permission.writeUserList.includes(item.userName)) {
          sambaShareFolderConfig.value.permission.writeUserList.push(item.userName)
        }
      } else {
        item.basicPermission.FB = 'FB'
        sambaShareFolderConfig.value.permission.readUserList =
          sambaShareFolderConfig.value.permission.readUserList.filter(
            (userName) => userName !== item.userName
          )
        sambaShareFolderConfig.value.permission.writeUserList =
          sambaShareFolderConfig.value.permission.writeUserList.filter(
            (userName) => userName !== item.userName
          )
      }
    }
    if (type === 'RO') {
      item.basicPermission.RW = ''
      item.basicPermission.FB = ''
      if (item.basicPermission.RO) {
        sambaShareFolderConfig.value.permission.writeUserList =
          sambaShareFolderConfig.value.permission.writeUserList.filter(
            (userName) => userName !== item.userName
          )
        if (!sambaShareFolderConfig.value.permission.readUserList.includes(item.userName)) {
          sambaShareFolderConfig.value.permission.readUserList.push(item.userName)
        }
      } else {
        item.basicPermission.FB = 'FB'
        sambaShareFolderConfig.value.permission.readUserList =
          sambaShareFolderConfig.value.permission.readUserList.filter(
            (userName) => userName !== item.userName
          )
        sambaShareFolderConfig.value.permission.writeUserList =
          sambaShareFolderConfig.value.permission.writeUserList.filter(
            (userName) => userName !== item.userName
          )
      }
    }
  }

  // 用户组信息权限的变化
  const handleGroupCheckboxChange = (item: Api.Sys.SysGroup, type: string) => {
    if (type === 'FB') {
      item.basicPermission.FB = 'FB'
      item.basicPermission.RW = ''
      item.basicPermission.RO = ''
      sambaShareFolderConfig.value.permission.readGroupList =
        sambaShareFolderConfig.value.permission.readGroupList.filter(
          (groupName) => groupName !== item.groupName
        )
      sambaShareFolderConfig.value.permission.writeGroupList =
        sambaShareFolderConfig.value.permission.writeGroupList.filter(
          (groupName) => groupName !== item.groupName
        )
    }
    if (type === 'RW') {
      item.basicPermission.FB = ''
      item.basicPermission.RO = ''
      if (item.basicPermission.RW) {
        sambaShareFolderConfig.value.permission.readGroupList =
          sambaShareFolderConfig.value.permission.readGroupList.filter(
            (groupName) => groupName !== item.groupName
          )
        if (!sambaShareFolderConfig.value.permission.writeGroupList.includes(item.groupName)) {
          sambaShareFolderConfig.value.permission.writeGroupList.push(item.groupName)
        }
      } else {
        item.basicPermission.FB = 'FB'
        sambaShareFolderConfig.value.permission.readGroupList =
          sambaShareFolderConfig.value.permission.readGroupList.filter(
            (groupName) => groupName !== item.groupName
          )
        sambaShareFolderConfig.value.permission.writeGroupList =
          sambaShareFolderConfig.value.permission.writeGroupList.filter(
            (groupName) => groupName !== item.groupName
          )
      }
    }
    if (type === 'RO') {
      item.basicPermission.RW = ''
      item.basicPermission.FB = ''
      if (item.basicPermission.RO) {
        sambaShareFolderConfig.value.permission.writeGroupList =
          sambaShareFolderConfig.value.permission.writeGroupList.filter(
            (groupName) => groupName !== item.groupName
          )
        if (!sambaShareFolderConfig.value.permission.readGroupList.includes(item.groupName)) {
          sambaShareFolderConfig.value.permission.readGroupList.push(item.groupName)
        }
      } else {
        item.basicPermission.FB = 'FB'
        sambaShareFolderConfig.value.permission.readGroupList =
          sambaShareFolderConfig.value.permission.readGroupList.filter(
            (groupName) => groupName !== item.groupName
          )
        sambaShareFolderConfig.value.permission.writeGroupList =
          sambaShareFolderConfig.value.permission.writeGroupList.filter(
            (groupName) => groupName !== item.groupName
          )
      }
    }
  }

  // 打开添加用户组弹窗..
  const addSysGroup = () => {
    groupDialogVisible.value = true
  }
  //  创建文件夹表单信息
  const sysShareFolderFormDto = ref<Api.Dto.NewShareFolderDto>({
    folderName: '',
    mountPath: '',
    folderPath: ''
  })

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const currentStep = ref(0)

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单验证规则
  const rules: FormRules = {
    mountPath: [{ required: true, message: '请选择存储空间', trigger: 'blur' }],
    folderName: [
      { required: true, max: 50, min: 1, message: '文件夹长度为1~50个字符', trigger: 'blur' },
      {
        pattern: REGULAR.CREATE_DIR,
        message: '文件夹名称仅允许中文、英文、数字、下划线、短横线、点和空格',
        trigger: 'blur'
      }
    ]
  }

  // 返回的表单信息
  const groupDataList = ref<Api.result.GroupList>({
    current: 0,
    size: 0,
    total: 0,
    records: []
  })

  //  返回的用户列表
  const userDataList = ref<Api.result.UserList>({
    current: 0,
    size: 0,
    total: 0,
    records: []
  })

  const handleGroupPageChange = (page: number) => {
    loadGroupListParams.value.current = page
    loadGroupDataList()
  }

  const handleGroupSizeChange = (size: number) => {
    loadGroupListParams.value.size = size
    loadGroupDataList()
  }

  const handleUserPageChange = (page: number) => {
    loadUserListParams.value.current = page
    loadLocalUserList()
  }

  const handleUserSizeChange = (size: number) => {
    loadUserListParams.value.size = size
    loadLocalUserList()
  }

  // 当前选中的用户组选项

  const storageSpaceList = ref<Disk.Device.StorageSpaceList>({
    records: [],
    total: 0,
    size: 0,
    current: 1
  })

  //  获取当前选中存储空间值的值
  const getStorageSpaceItem = (mountPath: string) => {
    let item = storageSpaceList.value.records.filter((item) => item.mountPath === mountPath)
    if (item.length > 0) {
      return item[0]
    }
    return null
  }

  // 加载存储空间信息
  const loadStorageSpaceList = () => {
    fetchGetStorageSpaceList().then((res) => {
      storageSpaceList.value = res
    })
  }

  const loadGroupListParams = ref<Api.Dto.GetGroupListDto>({
    current: 1,
    size: 10,
    gid: 0,
    groupName: '',
    sort: '', // 排序的字段
    orderBy: '' // 升序asc 还是降序 desc
  })

  const loadUserListParams = ref<Api.Dto.QueryUserListDto>({
    userName: '',
    userAlias: '',
    orderBy: 'desc',
    sort: 'create_time',
    current: 1,
    size: 50
  })

  // 加载用户组列表
  const loadGroupDataList = async () => {
    fetchGetGroupList(loadGroupListParams.value).then((res) => {
      groupDataList.value = res
      if (activeName.value === 'Samba') {
        groupDataList.value.records.forEach((item) => {
          // 默认全部都是禁止运行的
          item.basicPermission.FB = 'FB'
          if (sambaShareFolderConfig.value.permission.writeGroupList.includes(item.groupName)) {
            item.basicPermission.RW = 'RW'
            item.basicPermission.FB = ''
            item.basicPermission.RO = ''
          }
          if (sambaShareFolderConfig.value.permission.readGroupList.includes(item.groupName)) {
            item.basicPermission.RO = 'RO'
            item.basicPermission.FB = ''
            item.basicPermission.RW = ''
          }
        })
      }
    })
  }

  // 加载用户列表
  const loadLocalUserList = () => {
    fetchQueryUserList(loadUserListParams.value).then((res) => {
      userDataList.value = res
      // 加载samba配置的权限信息
      if (activeName.value === 'Samba') {
        userDataList.value.records.forEach((item) => {
          // 默认全部都是禁止运行的
          item.basicPermission.FB = 'FB'
          if (sambaShareFolderConfig.value.permission.writeUserList.includes(item.userName)) {
            item.basicPermission.RW = 'RW'
            item.basicPermission.FB = ''
            item.basicPermission.RO = ''
          }
          if (sambaShareFolderConfig.value.permission.readUserList.includes(item.userName)) {
            item.basicPermission.RO = 'RO'
            item.basicPermission.FB = ''
            item.basicPermission.RW = ''
          }
        })
      }
    })
  }

  const loadProtocolConfig = (protocol: string) => {
    switch (protocol) {
      case 'Samba':
        fetchGetSambaShareConfig({ path: sysShareFolderFormDto.value.folderPath }).then((res) => {
          sambaShareFolderConfig.value = JSON.parse(JSON.stringify(res))
          roSambaShareFolderConfig.value = JSON.parse(JSON.stringify(res))
        })
        return
      case 'Webdav':
        ElMessage.error('Webdav 未对接')
        return
      case 'Rsync':
        console.log('Rsync')
        ElMessage.error('Rsync 未对接')
        return
      case 'NFS':
        console.log('NFS')
        ElMessage.error('NFS 未对接')
        return
      case 'FTP':
        ElMessage.error('FTP 未对接')
        break
      default:
        console.log('default')
    }
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.shareFolder
    currentStep.value = 0
    if (isEdit) {
      sysShareFolderFormDto.value.folderPath = props.shareFolder.folder?.folderPath
        ? props.shareFolder.folder?.folderPath
        : ''
      sysShareFolderFormDto.value.mountPath = props.shareFolder.storageSpace?.mountPath
        ? props.shareFolder.storageSpace?.mountPath
        : ''
      sysShareFolderFormDto.value.folderName = props.shareFolder.folder?.folderName
        ? props.shareFolder.folder?.folderName
        : ''
      loadProtocolConfig(activeName.value)
    } else {
      sysShareFolderFormDto.value.folderPath = ''
      sysShareFolderFormDto.value.mountPath = ''
      sysShareFolderFormDto.value.folderName = ''
    }
    loadStorageSpaceList()
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.shareFolder],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  // 监听表格类型的变化,渲染对应的表格
  watch(tableType, () => {
    if (tableType.value === 'localUser') {
      loadLocalUserList()
    }
    if (tableType.value === 'localGroup') {
      loadGroupDataList()
    }
  })

  watch(
    () => activeName.value,
    () => {
      loadProtocolConfig(activeName.value)
    }
  )

  watch(
    () => currentStep.value,
    (newValue) => {
      if (newValue == 2) {
        nextTick(() => {
          if (activeName.value === 'Samba') {
            if (tableType.value === 'localUser') {
              loadLocalUserList()
            }
            if (tableType.value === 'localGroup') {
              loadGroupDataList()
            }
          }
        })
      }
    }
  )

  // 保存samba的配置
  const saveSambaShareConfig = () => {
    fetchEditSambaShare(sambaShareFolderConfig.value).then((res) => {
      sambaShareFolderConfig.value = JSON.parse(JSON.stringify(res))
      roSambaShareFolderConfig.value = JSON.parse(JSON.stringify(res))
    })
  }

  // 下一步
  const nextStep = () => {
    // 提交表单信息
    if (currentStep.value === 0 && sysShareFolderFormDto.value.folderPath.length === 0) {
      formRef.value?.validate((valid) => {
        if (valid) {
          fetchNewShareFolder(sysShareFolderFormDto.value).then((res) => {
            sysShareFolderFormDto.value = res
            loadProtocolConfig(activeName.value)
            currentStep.value++
          })
        }
      })
    } else if (currentStep.value === 0 && sysShareFolderFormDto.value.folderName.length > 0) {
      currentStep.value++
      return
    }
    // 协议参数设置这边做限制
    if (currentStep.value === 1) {
      currentStep.value++
      return
    }
    if (activeName.value === 'Samba') {
      if (
        currentStep.value === 2 &&
        !deepEqual(sambaShareFolderConfig.value, roSambaShareFolderConfig.value)
      ) {
        saveSambaShareConfig()
      } else if (
        currentStep.value === 2 &&
        deepEqual(sambaShareFolderConfig.value, roSambaShareFolderConfig.value)
      ) {
        if (props.type === 'add') {
          emit('refreshData')
        }
        dialogVisible.value = false
      }
      return
    }
  }

  // 上一步
  const prevStep = () => {
    currentStep.value--
  }
</script>

<style scoped>
  :deep(#master-groups .el-table__header-wrapper .el-checkbox) {
    display: none;
  }

  .form-box {
    padding: 20px;
  }

  .form-item {
    height: 20px;
    display: flex;
    align-items: center;
  }
</style>
