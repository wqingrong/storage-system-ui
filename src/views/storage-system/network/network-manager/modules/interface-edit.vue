<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`编辑 ${props.editData?.name ?? ''} 网络配置`"
    width="620px"
    destroy-on-close
    @close="handleClose"
    id="net-edit-dialog"
  >
    <!-- 顶部Tab切换 -->
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
                v-model="formData.ipv4Addresses[0].mask"
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

    <!-- 弹窗底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button :disabled="submitting" @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirm">确定</el-button>
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
    NetworkInterface
  } from '@/entity/network'
  import { submitNetworkConfig } from '@/composables/useNetworkConfigSubmit'
  import { notifyDhcpSwitch } from '@/utils/network/host-switch'

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

  // 父组件传入控制弹窗显示
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    editData: {
      type: Object,
      default: null
    }
  })
  const emit = defineEmits(['update:visible', 'confirm', 'emitReload'])
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
        prefix: '',
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
    bonder: { mode: BondMode.BOND_MODE_UNKNOWN, slaveInterfaces: [] }
  })

  /** 打开弹窗时的配置快照，用于比对「改前 / 改后」的地址变化 */
  const originConfig = ref<NetworkInterface | null>(null)
  /** 提交中，避免重复点击 */
  const submitting = ref(false)

  /** 深拷贝：表单里的 ipv4Addresses 是数组，浅拷贝会直接改写父组件的行数据 */
  const cloneConfig = (value: NetworkInterface): NetworkInterface =>
    JSON.parse(JSON.stringify(value)) as NetworkInterface

  // 弹窗双向绑定
  const dialogVisible = ref(false)
  watch(
    () => props.visible,
    (val) => {
      dialogVisible.value = val
      if (!val || !props.editData) return
      // 打开弹窗时重置表单：先留一份快照，再深拷贝进表单。
      // 若像原来那样 Object.assign 直接铺开，ipv4Addresses 会与父组件共用同一个
      // 数组引用，用户在弹窗里一改 IP，父组件的行数据就被同步改掉，"改前的地址"
      // 也就没有了，切换地址时无从比对。
      const snapshot = cloneConfig(props.editData as unknown as NetworkInterface)
      originConfig.value = snapshot
      dnsInputText.value = snapshot.dnsServers ? snapshot.dnsServers.join(',') : ''
      Object.assign(formData.value, cloneConfig(snapshot))
    },
    { immediate: true }
  )
  watch(dialogVisible, (val) => {
    emit('update:visible', val)
  })
  // Tab激活项
  const activeTab = ref('ipv4')

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false
  }

  /**
   * 确认提交
   *
   * 这里要处理一个特殊场景：如果改的正是「当前访问所用的网卡」，
   * 后端执行 `nmcli connection up` 后会立刻切断连接，前端大概率收不到响应，
   * 只拿到一个 Network Error。但此时配置往往已经生效，所以不能按失败处理，
   * 而应该转去探测新地址，探通后把页面跳过去。
   */
  const handleConfirm = async () => {
    if (submitting.value) return

    submitting.value = true
    try {
      const res = await submitNetworkConfig(cloneConfig(formData.value), originConfig.value)

      if (res.status === 'failed') {
        if (res.error) ElMessage.error(res.error)
        return
      }

      handleClose()

      if (res.status === 'switching') {
        // 即将跳到新地址，不再刷新列表：旧连接此时可能已经断了
        ElMessage.success(`配置已生效，正在切换到 ${res.plan?.toIp}`)
        return
      }

      emit('emitReload')

      if (res.status === 'dhcp') {
        ElMessage.success('已切换为 DHCP 模式')
        void notifyDhcpSwitch()
        return
      }
      ElMessage.success('网络配置保存成功')
    } finally {
      submitting.value = false
    }
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
