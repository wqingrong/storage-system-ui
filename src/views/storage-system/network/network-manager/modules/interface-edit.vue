<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑"
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
                v-model="formData.ipv4Mode"
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
                v-model="formData.ipAddr"
                placeholder="192.168.10.111"
                :disabled="formData.ipv4Mode === 'dhcp'"
              />
            </el-form-item>

            <!-- 子网掩码 -->
            <el-form-item label="子网掩码 (mask):" label-position="left">
              <el-input
                v-model="formData.netmask"
                placeholder="255.255.255.0"
                :disabled="formData.ipv4Mode === 'dhcp'"
              />
            </el-form-item>

            <!-- 网关 + 问号提示气泡 -->
            <el-form-item label="网关:" label-position="left">
              <div class="input-with-tip">
                <el-input
                  v-model="formData.gateway"
                  placeholder="192.168.10.1"
                  :disabled="formData.ipv4Mode === 'dhcp'"
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
                v-model="formData.dns"
                placeholder="192.168.10.1"
                :disabled="formData.ipv4Mode === 'dhcp'"
              />
            </el-form-item>

            <div>
              <el-checkbox v-model="formData.defaultGateway" label="设为默认网关" />
            </div>
            <!-- 设为默认网关 -->
            <div>
              <el-checkbox v-model="formData.enableMTU" label="手动设置 MTU 值" />
            </div>
            <!-- MTU配置 -->
            <el-form-item label="MTU 值:" v-if="formData.enableMTU" label-position="left">
              <el-select v-model="formData.mtuVal" placeholder="选择MTU">
                <el-option label="9000" value="9000" />
                <el-option label="8992" value="8992" />
                <el-option label="1500" value="1500" />
              </el-select>
            </el-form-item>
            <div>
              <el-checkbox v-model="formData.enableVLAN" label="启用 VLAN" />
              <el-tooltip placement="bottom" max-width="480" popper-class="vlan-tip-popper">
                <template #content>
                  <span class="tip-red">重要：</span>确保您的客户端计算机也加入同一个 VLAN。
                </template>
                <el-icon class="tip-icon">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <el-form-item label="VLAN ID:" v-if="formData.enableVLAN" label-position="left">
              <el-input v-model="formData.vlanId" type="number" min="1" max="4094" />
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
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
  import { defineEmits, defineProps, ref } from 'vue'
  import { InfoFilled } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  // 父组件传入控制弹窗显示
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    // 初始网络数据
    initData: {
      type: Object,
      default: () => ({
        ipv4Mode: 'static',
        ipAddr: '192.168.10.111',
        netmask: '255.255.255.0',
        gateway: '192.168.10.1',
        dns: '192.168.10.1',
        defaultGateway: true,
        enableMTU: true,
        mtuVal: 9000,
        enableVLAN: false,
        vlanId: ''
      })
    }
  })
  const emit = defineEmits(['update:visible', 'confirm'])

  // 弹窗双向绑定
  const dialogVisible = ref(false)
  watch(
    () => props.visible,
    (val) => {
      dialogVisible.value = val
      if (val) {
        // 打开弹窗时重置表单
        Object.assign(formData, props.initData)
      }
    },
    { immediate: true }
  )
  watch(dialogVisible, (val) => {
    emit('update:visible', val)
  })

  // Tab激活项
  const activeTab = ref('ipv4')

  // 表单数据
  const formRef = ref(null)
  const formData = ref({
    ipv4Mode: 'static',
    ipAddr: '',
    netmask: '',
    gateway: '',
    dns: '',
    defaultGateway: false,
    enableMTU: false,
    mtuVal: 1500,
    enableVLAN: false,
    vlanId: ''
  })

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false
  }

  // 确认提交
  const handleConfirm = async () => {
    await formRef.value?.validate()
    emit('confirm', { ...formData.value })
    ElMessage.success('网络配置保存成功')
    handleClose()
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
