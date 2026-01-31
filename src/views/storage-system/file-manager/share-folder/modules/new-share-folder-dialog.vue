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
          <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
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
          <el-select style="width: 150px">
            <el-option label="用户列表" value="localUser" />
            <el-option label="用户组列表" value="localUser" />
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
                  v-model="scope.row.checked"
                  @change="handleCheckboxChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column property="write" label="可读写" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.checked"
                  @change="handleCheckboxChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column property="readOnly" label="只读" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.checked"
                  @change="handleCheckboxChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column property="custom" label="自定义" align="center">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.checked"
                  @change="handleCheckboxChange(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-if="groupDataList.total > 0"
          background
          :page-sizes="[10, 20, 40, 60]"
          layout="prev, pager, next"
          :total="groupDataList.total"
          :current-page="groupDataList.current"
          :page-size="groupDataList.size"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          :hide-on-single-page="true"
          style="display: flex !important; justify-content: center !important"
        />
      </div>

      <!--  选中用户主组-->
      <!--      <div v-if="currentStep == 2">-->
      <!--        <span style="font-size: 15px; margin-bottom: 10px">请选择用户主要组</span>-->
      <!--        <div style="max-height: 400px">-->
      <!--          <el-table-->
      <!--            id="master-groups"-->
      <!--            ref="masterGroupRef"-->
      <!--            :data="selectGroups"-->
      <!--            row-key="gid"-->
      <!--            @select="handleMasterGroupSelect"-->
      <!--            style="width: 100%"-->
      <!--          >-->
      <!--            <el-table-column type="selection" width="55" />-->
      <!--            <el-table-column property="groupName" label="用户组" align="center"></el-table-column>-->
      <!--            <el-table-column property="groupAlias" label="用户组别名" align="center" />-->
      <!--            <el-table-column property="groupDesc" label="描述信息" align="left" />-->
      <!--            <el-table-column property="totalPeople" label="成员数" align="center" />-->
      <!--          </el-table>-->
      <!--        </div>-->
      <!--      </div>-->
      <!--  信息展示-->
      <div v-if="currentStep == 3">
        <span style="font-size: 15px; margin-bottom: 10px">用户信息</span>

        <div class="form-box">
          <div>
            <div class="form-item">
              <div style="width: 50%">用户名</div>
              <div style="width: 50%">{{ sysUserFormDto.userName }}</div>
            </div>
            <el-divider style="margin: 12px 0" />

            <div class="form-item">
              <div style="width: 50%">用户别名</div>
              <div style="width: 50%">{{ sysUserFormDto.userAlias }}</div>
            </div>
            <el-divider style="margin: 12px 0" />

            <div class="form-item">
              <div style="width: 50%">密码</div>
              <div style="width: 50%">{{ sysUserFormDto.password }}</div>
            </div>
            <el-divider style="margin: 12px 0" />

            <div class="form-item">
              <div style="width: 50%">主要组</div>
              <div style="width: 50%">{{ sysUserFormDto.masterGroup.groupName }}</div>
            </div>
            <el-divider style="margin: 12px 0" />

            <div class="form-item">
              <div style="width: 50%">描述信息</div>
              <div style="width: 50%">{{ sysUserFormDto.userDesc }}</div>
            </div>
            <el-divider style="margin: 12px 0" />
            <div>
              <span>附属组</span>
            </div>
            <div style="max-height: 400px">
              <el-table
                ref="masterGroupRef"
                :data="sysUserFormDto.slaveGroupList"
                row-key="gid"
                style="width: 100%"
              >
                <el-table-column
                  property="groupName"
                  label="用户组"
                  align="center"
                ></el-table-column>
                <el-table-column property="groupAlias" label="用户组别名" align="center" />
                <el-table-column property="groupDesc" label="描述信息" align="left" />
                <el-table-column property="totalPeople" label="成员数" align="center" />
              </el-table>
            </div>
          </div>
        </div>
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
  import { ElTable, FormInstance, FormRules, TabsPaneContext } from 'element-plus'
  import { fetchGetGroupList, fetchGetStorageSpaceList } from '@/api/system-manage'
  import { fetchNewShareFolder } from '@/api/share-folder'
  import { Search } from '@element-plus/icons-vue'
  import { Disk } from '@/typings/disk'
  import { REGULAR } from '@/enums/formEnum'
  import { ref } from 'vue'
  import { deepEqual } from '@/utils/tools'

  interface Props {
    visible: boolean
    type: string
    userData?: Partial<Api.Sys.SysUser>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'refreshData'): void
  }

  const selectGroupTableRef = ref(ElTable)
  const masterGroupRef = ref(ElTable)
  const groupDialogVisible = ref(false)

  // 作为表单参数的变量用，可以修改的
  const sambaShareFolderConfig = ref<Api.Sys.SambaShareFolderConfig>({
    recycle: { recyclePath: '#recycle' },
    permission: { writeGroupList: [], writeUserList: [], readGroupList: [], readUserList: [] }
  })

  // 这个是只读的配置信息，用来判断两个变量直接是否发生了变化
  const roSambaShareFolderConfig = ref<Api.Sys.SambaShareFolderConfig>({
    recycle: { recyclePath: '#recycle' },
    permission: { writeGroupList: [], writeUserList: [], readGroupList: [], readUserList: [] }
  })

  const activeName = ref('Samba')

  const handleClick = () => {
    console.log('>>>', activeName.value)
  }

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
            return '下一步'
          } else {
            return '保存'
          }
        } else {
          return '下一步'
        }
      case 3:
        return '完成'
      default:
        return '' // 或者返回一个默认值
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

  const handlePageChange = (page: number) => {
    loadGroupListParams.value.current = page
    loadGroupDataList()
  }

  const handleSizeChange = (size: number) => {
    loadGroupListParams.value.size = size
    loadGroupDataList()
  }

  // 当前选中的用户组选项
  const selectGroups = ref<Api.Sys.SysGroup[]>([])

  const selectGroupChange = (value: any) => {
    selectGroups.value = value
  }

  const handleMasterGroupSelect = (val: any, row: any) => {
    // 获取表格实例
    const table = masterGroupRef.value
    // // 清除所有选中
    if (val.length > 0) {
      table.clearSelection()
      nextTick(() => {
        console.log('当前选中的行...')
      })
    }
  }

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

  const loadGroupDataList = async () => {
    fetchGetGroupList(loadGroupListParams.value).then((res) => {
      groupDataList.value = res
    })
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    currentStep.value = 0
    if (isEdit) {
      console.log('edit>>')
    } else {
      sysShareFolderFormDto.value.folderPath = '/volume1/share/share_3'
      sysShareFolderFormDto.value.mountPath = '/volume1'
      sysShareFolderFormDto.value.folderName = 'share_3'
    }
    loadGroupDataList()
    loadStorageSpaceList()
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.userData],
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

  watch(
    () => currentStep.value,
    (newValue) => {
      // 反显选中的用户组信息
      if (newValue == 1) {
        nextTick(() => {
          console.log('currentStep>>', currentStep.value)
          console.log('protocol>>>', activeName.value)
        })
      } else if (newValue == 2) {
        nextTick(() => {
          console.log('可以将文件夹给创建出来了')
          // 判断参数是否正确
          console.log('currentStep>>', currentStep.value)
        })
      } else if (newValue === 3) {
        console.log('currentStep>>', currentStep.value)
      }
    }
  )

  // 下一步
  const nextStep = () => {
    // 提交表单信息
    if (currentStep.value === 0 && sysShareFolderFormDto.value.folderPath.length === 0) {
      formRef.value?.validate((valid) => {
        if (valid) {
          fetchNewShareFolder(sysShareFolderFormDto.value).then((res) => {
            sysShareFolderFormDto.value = res
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
    if (activeName.value === 'samba') {
      if (
        currentStep.value === 2 &&
        !deepEqual(sambaShareFolderConfig.value, roSambaShareFolderConfig.value)
      ) {
        console.log('请求保持接口>>', sambaShareFolderConfig.value)
      } else if (
        currentStep.value === 2 &&
        deepEqual(sambaShareFolderConfig.value, roSambaShareFolderConfig.value)
      ) {
        currentStep.value++
      }
      return
    }

    if (currentStep.value === 4) {
      handleSubmit()
      currentStep.value--
    }
  }

  // 上一步
  const prevStep = () => {
    currentStep.value--
  }

  /**
   * 提交表单
   * 验证通过后触发新增或编辑提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        console.log('校验通过...>>>')
      }
    })
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
