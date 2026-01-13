<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="30%"
    align-center
    class="dialog"
  >
    <ElForm ref="formRef" :model="sysUserFormDto" :rules="rules" label-width="80px">
      <div v-if="currentStep == 0">
        <ElFormItem label="用户名" prop="userName">
          <ElInput
            v-model="sysUserFormDto.userName"
            :disabled="props.type === 'edit'"
            placeholder="请输入用户名"
          />
        </ElFormItem>
        <ElFormItem label="别名" prop="userAlias">
          <ElInput v-model="sysUserFormDto.userAlias" placeholder="请输入用户别名" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="sysUserFormDto.password"
            type="password"
            placeholder="请输入密码"
            :show-password="true"
          />
        </ElFormItem>
        <ElFormItem label="备注" prop="userDesc">
          <ElInput v-model="sysUserFormDto.userDesc" placeholder="请输入备注信息" />
        </ElFormItem>
      </div>
      <!--  选中用户组-->
      <div v-if="currentStep == 1">
        <span style="font-size: 15px; margin-bottom: 10px">请选择用户组</span>
        <div style="max-height: 400px">
          <el-table
            ref="selectGroupTableRef"
            :data="groupDataList.records"
            @selectionChange="selectGroupChange"
            row-key="gid"
            style="width: 100%"
            :reserve-selection="true"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column property="groupName" label="用户组" align="center"></el-table-column>
            <el-table-column property="groupAlias" label="用户组别名" align="center" />
            <el-table-column property="groupDesc" label="描述信息" align="left" />
            <el-table-column property="totalPeople" label="成员数" align="center" />
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
      <div v-if="currentStep == 2">
        <span style="font-size: 15px; margin-bottom: 10px">请选择用户主要组</span>
        <div style="max-height: 400px">
          <el-table
            id="master-groups"
            ref="masterGroupRef"
            :data="selectGroups"
            row-key="gid"
            @select="handleMasterGroupSelect"
            style="width: 100%"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column property="groupName" label="用户组" align="center"></el-table-column>
            <el-table-column property="groupAlias" label="用户组别名" align="center" />
            <el-table-column property="groupDesc" label="描述信息" align="left" />
            <el-table-column property="totalPeople" label="成员数" align="center" />
          </el-table>
        </div>
      </div>
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
      <!--      <el-button v-if="currentStep == 1" style="float: left" @click="advancedSetup"-->
      <!--        >高级设置</el-button-->
      <!--      >-->
      <el-button
        v-if="currentStep <= 3 && currentStep != 0"
        @click="prevStep"
        :disabled="currentStep === 0"
        >上一步
      </el-button>
      <el-button type="primary" @click="nextStep">
        {{ currentStep >= 3 ? '完成' : '下一步' }}
      </el-button>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElTable, FormInstance, FormRules } from 'element-plus'
  import { fetchGetGroupList, fetchAddUser, fetchEditUser } from '@/api/system-manage'
  import { aesEncrypt, aseDecrypt } from '@utils/encryption'

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

  //  初始化表单信息
  const sysUserFormDto = ref<Api.Dto.SysUserFormDto>({
    uid: 0,
    userName: '',
    userAlias: '',
    userDesc: '',
    password: '',
    masterGroup: {
      groupName: '',
      groupAlias: '',
      createTime: '',
      groupDesc: '',
      gid: 0,
      totalPeople: 0
    },
    slaveGroupList: []
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
    userName: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_]+$/,
        min: 2,
        max: 20,
        message: '用户名长度在 2 到 20 个字母且只能为字母,数字,下划线',
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_\-+=[\]{}|;:,.?~]{8,30}$/,
        message: '密码不符合要求：需8-30位，包含大小写字母和数字',
        trigger: 'blur'
      }
    ],
    userAlias: [
      { required: false, max: 50, message: '别名长度最长不超过50个字符', trigger: 'blur' }
    ],
    userDesc: [{ required: false, max: 50, message: '描述信息最长不超过50个字符', trigger: 'blur' }]
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
        table.toggleRowSelection(row, true)
        sysUserFormDto.value.masterGroup = row
        // 排除掉主要组
        console.log('当前选中的主要组为...', row)
        sysUserFormDto.value.slaveGroupList = selectGroups.value.filter(
          (item) => item.gid !== row.gid
        )
      })
    }
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
    loadGroupDataList()
    if (!isEdit) {
      initAddSysUserDtoFormData()
    } else {
      //   反显用户信息
      sysUserFormDto.value = { ...props.userData }
      sysUserFormDto.value.password = aseDecrypt(sysUserFormDto.value.password)
    }
  }

  const initAddSysUserDtoFormData = () => {
    sysUserFormDto.value = {
      uid: 0,
      userName: '',
      userAlias: '',
      userDesc: '',
      password: '',
      masterGroup: {
        groupName: '',
        groupAlias: '',
        createTime: '',
        groupDesc: '',
        gid: 0,
        totalPeople: 0
      },
      slaveGroupList: []
    }
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
          let tmpGroupList = [...sysUserFormDto.value.slaveGroupList]
          if (sysUserFormDto.value.masterGroup.groupName) {
            tmpGroupList.push(sysUserFormDto.value.masterGroup)
          }
          const table = selectGroupTableRef.value
          table.clearSelection()
          tmpGroupList.forEach((item) => {
            table.toggleRowSelection(item, true)
          })
        })
      } else if (newValue == 2) {
        nextTick(() => {
          sysUserFormDto.value.slaveGroupList = selectGroups.value
          let table = masterGroupRef.value
          if (sysUserFormDto.value.masterGroup.groupName) {
            table.clearSelection()
            table.toggleRowSelection(sysUserFormDto.value.masterGroup, true)
            sysUserFormDto.value.slaveGroupList = sysUserFormDto.value.slaveGroupList.filter(
              (item) => item.gid !== sysUserFormDto.value.masterGroup.gid
            )
            //触发选中的点击事件
          }
        })
      } else if (newValue === 3) {
        if (!sysUserFormDto.value.userAlias) {
          sysUserFormDto.value.userAlias = sysUserFormDto.value.userName
        }
      }
    }
  )

  // 下一步
  const nextStep = () => {
    // 提交表单信息
    currentStep.value++
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
        if (dialogType.value === 'add') {
          let text = sysUserFormDto.value.password
          sysUserFormDto.value.password = aesEncrypt(text)
          fetchAddUser(sysUserFormDto.value)
            .then(() => {
              dialogVisible.value = false
              emit('refreshData')
            })
            .catch(() => {
              sysUserFormDto.value.password = aseDecrypt(sysUserFormDto.value.password)
            })
        } else if (dialogType.value === 'edit') {
          sysUserFormDto.value.password = aesEncrypt(sysUserFormDto.value.password)
          fetchEditUser(sysUserFormDto.value)
            .then(() => {
              dialogVisible.value = false
              emit('refreshData')
            })
            .catch(() => {
              sysUserFormDto.value.password = aseDecrypt(sysUserFormDto.value.password)
            })
        }
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
