<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建网络"
    width="620px"
    destroy-on-close
    @close="handleClose"
    id="net-edit-dialog"
  >
    <div v-if="currentStep === 0">
      <el-form-item label="聚合模式">
        <el-select v-model="formData.bond.mode" placeholder="请选择">
          <el-option label="active-backup 主备模式" :value="BondMode.ACTIVE_BACKUP" />
          <el-option label="balance-rr 轮询负载" :value="BondMode.ROUND_ROBIN" />
          <el-option label="balance-xor 哈希负载" :value="BondMode.BLANCE_XOR" />
          <el-option label="broadcast 广播" :value="BondMode.BROADCAST" />
          <el-option label="802.3ad LACP链路聚合" :value="BondMode.B_802_3AD" />
          <el-option label="balance-tlb 自适应负载" :value="BondMode.BLANCE_TLB" />
          <el-option label="balance-alb 自适应负载(含接收)" :value="BondMode.BLANCE_ALB" />
        </el-select>
      </el-form-item>
      <el-table
        ref="spareTableRef"
        :data="deviceList"
        row-key="device"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="checkRowSelectable" />
        <el-table-column property="device" label="物理网口" width="120" />
        <el-table-column property="speed" label="速率" width="120" />
        <el-table-column property="state" label="状态" width="100" />
        <el-table-column property="actualDuplex" label="模式" width="180" />
      </el-table>
    </div>
    <div v-if="currentStep === 1">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="IPv4" name="ipv4">
          <div style="padding-right: 20px; padding-left: 20px">
            <el-form ref="formRef" :model="formData" label-width="130px">
              <div style="margin-bottom: 10px">
                <!-- DHCP/手动单选 -->
                <el-radio-group
                  v-model="formData.ipv4Method"
                  style="
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start; /* 选项之间的垂直间距 */
                  "
                >
                  <el-radio label="dhcp">自动取得网络设置(DHCP)</el-radio>
                  <el-radio label="static">手动设置网络配置</el-radio>
                </el-radio-group>
              </div>

              <!-- IP地址 -->
              <el-form-item label="IP 地址:" label-position="left">
                <el-input
                  v-model="formData.ipv4Addresses[0].address"
                  placeholder="192.168.10.111"
                  :disabled="formData.ipv4Method === 'dhcp'"
                />
              </el-form-item>

              <!-- 子网掩码 -->
              <el-form-item label="子网掩码 (mask):" label-position="left">
                <el-input
                  v-model="formData.ipv4Addresses[0].prefix"
                  placeholder="255.255.255.0"
                  :disabled="formData.ipv4Method === 'dhcp'"
                />
              </el-form-item>

              <!-- 网关 + 问号提示气泡 -->
              <el-form-item label="网关:" label-position="left">
                <div class="input-with-tip">
                  <el-input
                    v-model="formData.gateway4"
                    placeholder="192.168.10.1"
                    :disabled="formData.ipv4Method === 'dhcp'"
                  />
                  <el-tooltip content="网关说明：访问跨网段流量出口地址" placement="right">
                    <el-icon class="tip-icon">
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </el-form-item>

              <!-- DNS Server -->
              <el-form-item label="DNS Server:" label-position="left">
                <el-input
                  v-model="dnsInputText"
                  placeholder="多个DNS用英文逗号分隔，如 192.168.10.1,223.5.5.5"
                  :disabled="formData.ipv4Method === 'dhcp'"
                  @blur="handleDnsInputConfirm"
                  @keyup.enter="handleDnsInputConfirm"
                  clearable
                />
                <template #hint>输入多个DNS以英文逗号分隔，回车/失焦自动保存到数组</template>
              </el-form-item>

              <!--              <div>-->
              <!--                <el-checkbox v-model="formData.defaultGateway" label="设为默认网关" />-->
              <!--              </div>-->
              <!-- 设为默认网关 -->
              <!-- MTU配置 -->
              <el-form-item label="MTU 值:" label-position="left">
                <el-select v-model="formData.mtu" placeholder="选择MTU">
                  <el-option label="9000" value="9000" />
                  <el-option label="8992" value="8992" />
                  <el-option label="1500" value="1500" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="IPv6" name="ipv6">
          <div class="empty-tab-text">IPv6配置区域（可自行扩展表单）</div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <!-- 顶部Tab切换 -->

    <!-- 弹窗底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button
          v-if="currentStep <= 1 && currentStep !== 0"
          @click="
            () => {
              currentStep--
            }
          "
          :disabled="currentStep === 0"
          >上一步</el-button
        >
        <el-button type="primary" @click="nextStep">
          {{ currentStep >= 1 ? '完成' : '下一步' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { defineEmits, defineProps, ref } from 'vue'
  import { InfoFilled } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import {
    AddressMethod,
    BondMode,
    InterfaceState,
    InterfaceType,
    IPVersion,
    NetworkDeviceInterface,
    NetworkInterface
  } from '@/entity/network'
  import { fetchGetNetworkDeviceList } from '@/api/network'

  const deviceList = ref<NetworkDeviceInterface>([])
  const currentStep = ref(0)
  // 父组件传入控制弹窗显示
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    }
  })

  // Tab激活项
  const activeTab = ref('ipv4')

  // 表单数据
  const formRef = ref(null)
  const formData = ref<NetworkInterface>({
    device: '',
    name: '',
    type: InterfaceType.ETHERNET,
    state: InterfaceState.UP,
    macAddress: '',
    description: '',
    namespace: '',
    speed: '',
    ipv4Addresses: [
      {
        address: '',
        prefix: '255.255.255.0',
        label: '',
        mask: '',
        version: IPVersion.IPv4
      }
    ],
    ipv6Addresses: [],
    ipv4Method: AddressMethod.STATIC,
    ipv6Method: AddressMethod.NONE,
    gateway4: '',
    gateway6: '',
    routes: [],
    dnsServers: [],
    dnsSearchDomains: [],
    mtu: 1500,
    enabled: true,
    autoStart: true,
    vlanId: 0,
    parentInterface: '',
    updatedAt: null,
    createdAt: null,
    isExpanded: true,
    bond: { mode: BondMode.ACTIVE_BACKUP, slaveInterfaces: [] }
  })

  const emit = defineEmits(['update:visible'])

  const checkRowSelectable = (row: NetworkDeviceInterface) => {
    return row.enable
  }
  const spareTableRef = ref()
  const selectNetworkDevice = ref<NetworkDeviceInterface>(null)
  // 2. 单选核心逻辑：只能保留一条选中
  const handleSelectionChange = (selectedRows: NetworkDeviceInterface[]) => {
    formData.value.bond.slaveInterfaces = selectedRows
  }

  // 下一步
  const nextStep = () => {
    // 提交表单信息
    if (currentStep.value === 1) {
      handleConfirm()
    } else {
      if (formData.value.bond.interfaces.length === 0) {
        ElMessage.info('必须选择一个网络接口!')
        return
      }
      currentStep.value++
    }
  }
  const loadingDeviceList = () => {
    fetchGetNetworkDeviceList().then((res) => {
      deviceList.value = res
    })
  }

  const dnsInputText = ref('')

  // 处理输入确认（回车/失去焦点触发）
  const handleDnsInputConfirm = () => {
    const raw = dnsInputText.value.trim()
    if (!raw) {
      formData.value.dnsServers = []
      return
    }
    // 按英文逗号分割、去空格、过滤空字符串
    const dnsList = raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    // 去重后赋值给数组
    formData.value.dnsServers = [...new Set(dnsList)]
  }

  // 弹窗双向绑定
  const dialogVisible = ref(false)
  watch(
    () => props.visible,
    (val) => {
      dialogVisible.value = val
      if (val) {
        // 打开弹窗时重置表单
        currentStep.value = 0
        selectNetworkDevice.value = null
        loadingDeviceList()
      }
    },
    { immediate: true }
  )
  watch(dialogVisible, (val) => {
    emit('update:visible', val)
  })

  // 监听数组变化，同步回填到输入框（编辑回显）
  watch(
    formData.value.dnsServers,
    (newArr) => {
      dnsInputText.value = newArr.join(',')
    },
    { immediate: true }
  )

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false
  }

  // 确认提交
  const handleConfirm = async () => {
    await formRef.value?.validate()
    console.log('formData>>', formData.value)
    ElMessage.success('网络配置保存成功')
    // handleClose()
  }
</script>

<style scoped>
  #net-edit-dialog .el-dialog__body {
    padding: 0 0 !important;
    position: relative;
  }

  .input-with-tip {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .vlan-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tip-icon {
    color: #409eff;
    cursor: pointer;
    font-size: 16px;
  }

  .empty-tab-text {
    padding: 40px 0;
    text-align: center;
    color: #999;
  }

  .dialog-footer {
    text-align: right;
  }

  :deep(.vlan-tip-popper) {
    line-height: 1.6;
  }

  :deep(.tip-red) {
    color: #f53f3f;
    font-weight: bold;
  }
</style>
