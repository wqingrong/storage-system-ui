<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建Bond绑定网口"
    width="720px"
    destroy-on-close
    @close="resetWizard"
  >
    <!-- 步骤条 -->
    <el-steps v-model="activeStep" finish-status="success" simple>
      <el-step title="1.选择Bond模式" />
      <el-step title="2.选择从属网口" />
      <el-step title="3.配置IPv4网络" />
    </el-steps>

    <!-- 步骤1：Bond模式选择 -->
    <div v-if="activeStep === 1" class="step-content">
      <el-form ref="step1Ref" :model="form.modeForm" label-width="140px">
        <el-form-item
          label="Bond名称"
          prop="bondName"
          rules="[{required:true,message:'请输入Bond名称',trigger:'blur'}]"
        >
          <el-input v-model="form.modeForm.bondName" placeholder="bond0" />
        </el-form-item>
        <el-form-item
          label="聚合模式"
          prop="mode"
          rules="[{required:true,message:'请选择Bond模式',trigger:'change'}]"
        >
          <el-select v-model="form.modeForm.mode" placeholder="请选择">
            <el-option label="active-backup 主备模式" value="active-backup" />
            <el-option label="balance-rr 轮询负载" value="balance-rr" />
            <el-option label="balance-xor 哈希负载" value="balance-xor" />
            <el-option label="broadcast 广播" value="broadcast" />
            <el-option label="802.3ad LACP链路聚合" value="802.3ad" />
            <el-option label="balance-tlb 自适应负载" value="balance-tlb" />
            <el-option label="balance-alb 自适应负载(含接收)" value="balance-alb" />
          </el-select>
        </el-form-item>
        <el-form-item label="主备模式主网卡(仅active-backup生效)">
          <el-select v-model="form.modeForm.primaryDev" placeholder="不指定">
            <el-option v-for="item in devList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 步骤2：勾选物理网卡作为slave -->
    <div v-if="activeStep === 2" class="step-content">
      <el-form ref="step2Ref" :model="form.slaveForm" label-width="140px">
        <el-form-item
          label="可选物理网卡"
          prop="slaves"
          rules="[{required:true,message:'至少选择一张网卡',trigger:'change'}]"
        >
          <el-checkbox-group v-model="form.slaveForm.slaves">
            <div class="checkbox-row" v-for="dev in devList" :key="dev">
              <el-checkbox :label="dev">{{ dev }}</el-checkbox>
            </div>
          </el-checkbox-group>
        </el-form-item>
        <div class="tip-text"
          >提示：已被其他Bond占用的网卡不会出现在列表，每个网卡只能加入一个Bond</div
        >
      </el-form>
    </div>

    <!-- 步骤3：IPv4网络配置 -->
    <div v-if="activeStep === 3" class="step-content">
      <el-form ref="step3Ref" :model="form.ipForm" label-width="140px">
        <el-form-item label="IP获取方式">
          <el-radio-group v-model="form.ipForm.ipv4Mode">
            <el-radio label="dhcp">DHCP自动获取</el-radio>
            <el-radio label="static">手动静态配置</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.ipForm.ipv4Mode === 'static'">
          <el-form-item
            label="IP地址/前缀"
            prop="address"
            rules="[{required:true,message:'请填写IP地址',trigger:'blur'}]"
          >
            <el-input v-model="form.ipForm.address" placeholder="192.168.190.100/24" />
            <div class="tip-text">子网统一使用CIDR前缀格式，如/24等价255.255.255.0</div>
          </el-form-item>
          <el-form-item
            label="网关"
            prop="gateway"
            rules="[{required:true,message:'请填写网关地址',trigger:'blur'}]"
          >
            <el-input v-model="form.ipForm.gateway" placeholder="192.168.190.2" />
          </el-form-item>
          <el-form-item label="DNS服务器">
            <el-input v-model="form.ipForm.dns" placeholder="多个DNS用逗号分隔" />
          </el-form-item>
          <el-form-item label="MTU">
            <el-select v-model="form.ipForm.mtu">
              <el-option label="1500 标准帧" value="1500" />
              <el-option label="9000 巨帧" value="9000" />
            </el-select>
          </el-form-item>
          <el-form-item label=" ">
            <el-checkbox v-model="form.ipForm.defaultGateway" label="设为默认网关" />
          </el-form-item>
        </template>
      </el-form>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="footer-btn-group">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="activeStep > 1" @click="prevStep">上一步</el-button>
        <el-button v-if="activeStep < 3" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="activeStep === 3" type="success" @click="submitCreateBond"
          >完成创建</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
  import { ref, defineEmits, reactive, watch } from 'vue'
  import { ElMessage } from 'element-plus'

  const props = defineProps({
    visible: Boolean,
    // 传入系统所有可用物理网卡列表 eth0 eth1 ens18...
    deviceList: {
      type: Array,
      default: () => []
    }
  })
  const emit = defineEmits(['update:visible', 'create'])

  const dialogVisible = ref(false)
  watch(
    () => props.visible,
    (val) => {
      dialogVisible.value = val
      if (val) resetWizard()
    },
    { immediate: true }
  )
  watch(dialogVisible, (val) => emit('update:visible', val))

  // 步骤控制
  const activeStep = ref(1)
  const devList = ref(props.deviceList)

  // 表单完整数据
  const form = reactive({
    // 第一步：bond基础配置
    modeForm: {
      bondName: 'bond0',
      mode: 'active-backup',
      primaryDev: ''
    },
    // 第二步：选择slave网卡
    slaveForm: {
      slaves: []
    },
    // 第三步：IP网络配置
    ipForm: {
      ipv4Mode: 'static',
      address: '192.168.190.100/24',
      gateway: '192.168.190.2',
      dns: '223.5.5.5,114.114.114.114',
      mtu: 9000,
      defaultGateway: true
    }
  })

  // 表单ref
  const step1Ref = ref(null)
  const step2Ref = ref(null)
  const step3Ref = ref(null)

  // 下一步校验切换
  const nextStep = async () => {
    let valid = true
    if (activeStep.value === 1) {
      await step1Ref.value.validate((v) => (valid = v))
    } else if (activeStep.value === 2) {
      await step2Ref.value.validate((v) => (valid = v))
    }
    if (!valid) return
    activeStep.value += 1
  }

  // 上一步
  const prevStep = () => {
    activeStep.value -= 1
  }

  // 重置向导
  const resetWizard = () => {
    activeStep.value = 1
    form.modeForm = { bondName: 'bond0', mode: 'active-backup', primaryDev: '' }
    form.slaveForm.slaves = []
    form.ipForm = {
      ipv4Mode: 'static',
      address: '192.168.190.100/24',
      gateway: '192.168.190.2',
      dns: '223.5.5.5,114.114.114.114',
      mtu: 9000,
      defaultGateway: true
    }
    step1Ref.value?.clearValidate()
    step2Ref.value?.clearValidate()
    step3Ref.value?.clearValidate()
  }

  // 提交创建Bond，抛出事件给父组件执行nmcli命令
  const submitCreateBond = async () => {
    if (form.ipForm.ipv4Mode === 'static') {
      await step3Ref.value.validate((v) => {
        if (!v) throw new Error('网络参数校验失败')
      })
    }
    // 组装完整Bond配置数据
    const bondData = {
      bondName: form.modeForm.bondName,
      bondMode: form.modeForm.mode,
      primaryDev: form.modeForm.primaryDev,
      slaveDevices: form.slaveForm.slaves,
      network: form.ipForm
    }
    emit('create', bondData)
    ElMessage.success('Bond配置已提交，正在创建')
    dialogVisible.value = false
  }
</script>

<style scoped>
  .step-content {
    padding: 20px 10px;
    min-height: 260px;
  }
  .checkbox-row {
    margin: 8px 0;
  }
  .tip-text {
    color: #999;
    font-size: 12px;
    margin-top: 6px;
  }
  .footer-btn-group {
    text-align: right;
  }
  :deep(.el-steps) {
    margin-bottom: 24px;
  }
</style>
