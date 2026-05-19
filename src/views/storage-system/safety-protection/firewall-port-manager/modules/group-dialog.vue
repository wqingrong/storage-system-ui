<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加防火墙端口' : '编辑用户组'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="模式" prop="ruleModel">
        <el-select v-model="formData.ruleModel" placeholder="Select">
          <el-option
            v-for="item in ruleModel"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </ElFormItem>
      <div v-if="formData.ruleModel === 'port'">
        <ElFormItem label="端口号" prop="port">
          <ElInput v-model="formData.port" placeholder="端口号" :disabled="props.type == 'edit'" />
        </ElFormItem>
        <ElFormItem label="协议" prop="protocol">
          <el-select v-model="formData.protocol" placeholder="Select">
            <el-option
              v-for="item in protocolOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </ElFormItem>
      </div>
      <div v-if="formData.ruleModel === 'server'">
        <ElFormItem label="服务" prop="serverName">
          <el-select v-model="formData.serverName" placeholder="Select">
            <el-option
              v-for="item in serverOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </ElFormItem>
      </div>
      <ElFormItem label="描述信息" prop="desc">
        <ElInput v-model="formData.desc" placeholder="规则描述信息" />
      </ElFormItem>
      <ElFormItem label="限制规则" prop="active">
        <el-select v-model="formData.active" placeholder="Select">
          <el-option
            v-for="item in activeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </ElFormItem>
      <ElFormItem v-if="formData.active !== 'allow'" label="限制IP" prop="sourceIp">
        <ElInput v-model="formData.sourceIp" placeholder="IP限制名单" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: string
    groupData?: Partial<Api.Sys.SysGroup>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'groupAddSubmit', formData: Api.Sys.SysGroup): void
    (e: 'groupEditSubmit', formData: Api.Sys.SysGroup): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    ruleModel: 'port',
    port: '',
    protocol: 'TCP',
    serverName: '',
    sourceIp: '',
    active: 'allow',
    desc: ''
  })

  const activeOptions = ref([
    { label: '无限制', value: 'allow' },
    { label: '拒绝', value: 'reject' },
    { label: '允许', value: 'accept' }
  ])
  const protocolOptions = ref([
    { label: 'TCP', value: 'TCP' },
    { label: 'UDP', value: 'UDP' }
  ])
  const ruleModel = ref([
    { label: '服务模式', value: 'server' },
    { label: '端口模式', value: 'port' }
  ])

  const serverOptions = ref([
    { label: 'SMB', value: 'smb' },
    { label: 'NFS', value: 'NFS' }
  ])
  // 表单验证规则
  const rules: FormRules = {
    port: [
      { required: false, message: '请输入端口或端口范围', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          const val = value.trim()
          // 端口正则 1-65535，支持 80 / 1-65535
          const portReg =
            /^(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3})(-(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}))?$/

          if (!portReg.test(val)) {
            return callback(new Error('请输入合法端口(1-65535)或端口范围(如 80-8080)'))
          }

          // 判断范围左边 <= 右边
          if (val.includes('-')) {
            const [start, end] = val.split('-').map(Number)
            if (start > end) {
              return callback(new Error('起始端口不能大于结束端口'))
            }
          }

          callback()
        },
        trigger: 'blur'
      }
    ],
    sourceIp: [
      { required: false, message: '请输入源IP地址', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          const ipStr = value.trim()
          if (!ipStr) return callback(new Error('IP地址不能为空'))

          // IPv4 正则
          const ipv4Reg =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

          // 按逗号拆分多个IP
          const ipList = ipStr.split(',').map((item: string) => item.trim())

          for (let ip of ipList) {
            // 空项
            if (!ip) return callback(new Error('IP格式错误，存在空项'))

            // 判断是否是范围格式
            if (ip.includes('-')) {
              const [startIp, endIp] = ip.split('-')
              if (!startIp || !endIp) return callback(new Error(`IP范围格式错误：${ip}`))
              if (!ipv4Reg.test(startIp)) return callback(new Error(`无效的起始IP：${startIp}`))
              if (!ipv4Reg.test(endIp)) return callback(new Error(`无效的结束IP：${endIp}`))
            }
            // 单个IP
            else {
              if (!ipv4Reg.test(ip)) {
                return callback(new Error(`无效的IPv4地址：${ip}`))
              }
            }
          }

          callback() // 全部校验通过
        },
        trigger: 'blur'
      }
    ]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.groupData
    const row = props.firewallItem
    Object.assign(formData, {
      active: isEdit && row ? row.active || '' : '',
      desc: isEdit && row ? row.desc || '' : '',
      protocol: isEdit && row ? row.protocol || '' : '',
      ruleModel: isEdit && row ? row.ruleModel || '' : '',
      serverName: isEdit && row ? row.serverName || '' : '',
      sourceIp: isEdit && row ? row.sourceIp || '' : ''
    })
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, formData],
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

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        console.log('表单信息>>>', formData)
        // if (dialogType.value == 'add') {
        //   emit('groupAddSubmit', formData)
        // } else {
        //   emit('groupEditSubmit', formData)
        // }
      }
    })
  }
</script>
