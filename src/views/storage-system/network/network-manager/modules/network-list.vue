<template>
  <div>
    <div>
      <div class="menu-container" style="margin-bottom: 10px">
        <ElSpace wrap>
          <ElButton @click="handleCreateBondClick">Bond绑定</ElButton>
          <ElButton @click="handleInterfaceEditClick">编辑</ElButton>
          <ElButton @click="handleDownClick">停用</ElButton>
        </ElSpace>
      </div>
      <div
        v-for="item in props.networkInterfaceList"
        :key="item.name"
        class="storage-info-container"
        :style="currentNetworkItem?.name === item.name ? 'background: #e6f2fd;' : ''"
      >
        <!-- 标题区域 -->
        <div
          class="header-section"
          @dblclick="toggleExpand(item)"
          @click="handleCurrentNetworkItem(item)"
        >
          <div class="title-with-icon">
            <ThemeSvg v-if="item.enabled" :src="networkUp" style="width: 35px; height: 35px" />
            <ThemeSvg v-else :src="networkDown" style="width: 35px; height: 35px" />
            <span class="main-title">{{ item.name }}</span>
          </div>
          <div class="header-actions">
            <el-button
              type="text"
              :icon="item.isExpanded ? 'ArrowUp' : 'ArrowDown'"
              @click="toggleExpand(item)"
              class="expand-btn"
            >
              {{ item.isExpanded ? '收起' : '展开' }}
            </el-button>
          </div>
        </div>
        <!-- 信息卡片（可展开收起） -->
        <el-collapse-transition>
          <div v-show="item.isExpanded" class="info-grid-wrapper">
            <div class="info-grid">
              <!--              存储空间-->
              <div class="info-item">
                <div class="info-label">
                  <span>网口：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.name }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <span>MAC地址：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.macAddress }}</span>
                </div>
              </div>
              <!--              MTU值-->
              <div class="info-item">
                <div class="info-label">
                  <span>MTU：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.mtu }}</span>
                </div>
              </div>
              <!--              速率-->
              <div class="info-item">
                <div class="info-label">
                  <span>速率：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.speed }}</span>
                </div>
              </div>
              <!--              ip获取方式-->
              <div class="info-item">
                <div class="info-label">
                  <span>IPV4获取方式：</span>
                </div>
                <div class="info-value">
                  <span v-if="item.ipv4Method === AddressMethod.STATIC">静态IP</span>
                  <span v-else-if="item.ipv4Method === AddressMethod.DHCP">DHCP</span>
                  <span v-else>未知</span>
                </div>
              </div>
              <!--              ip地址显示-->
              <div v-for="(ip, index) in item.ipv4Addresses" :key="ip.address">
                <div class="info-item">
                  <div class="info-label">
                    <span>IPV4地址{{ index + 1 }}：</span>
                  </div>
                  <div class="info-value">
                    <span>{{ ip.address }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <span>子网掩码{{ index + 1 }}：</span>
                  </div>
                  <div class="info-value">
                    <span>{{ ip.prefix }}</span>
                  </div>
                </div>
              </div>
              <!-- 网关 -->
              <div class="info-item">
                <div class="info-label">
                  <span>IPV4网关：</span>
                </div>
                <div class="info-value">
                  <span>{{ item.gateway4 }}</span>
                </div>
              </div>
              <!--              DNS-->
              <div v-for="(dns, index) in item.dnsServers" :key="dns">
                <div class="info-item">
                  <div class="info-label">
                    <span>DNS{{ index }}：</span>
                  </div>
                  <div class="info-value">
                    <span>{{ dns }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
    <Interface-edit
      v-model:visible="editInterfaceDialog"
      :init-data="networkForm"
      @confirm="saveNetworkConfig"
    >
    </Interface-edit>
    <BondCreateWizard
      v-model:visible="createBondDialogVisible"
      :device-list="netDeviceList"
      @create="handleCreateBond"
    />
  </div>
</template>

<script setup lang="ts">
  import InterfaceEdit from './interface-edit.vue'
  import BondCreateWizard from '@views/storage-system/network/network-manager/modules/bond-create-wizard.vue'
  import { ElCollapseTransition } from 'element-plus'
  import networkUp from '@imgs/svg/network-up.svg'
  import networkDown from '@imgs/svg/network-down.svg'
  import { AddressMethod, NetworkInterface } from '@/entity/network'

  const createBondDialogVisible = ref(false)
  const netDeviceList = ref(['eth0', 'eth1', 'ens18'])

  const editInterfaceDialog = ref(false)
  interface Props {
    networkInterfaceList: NetworkInterface[]
  }
  const props = defineProps<Props>()
  const currentNetworkItem = ref<NetworkInterface>(null)
  // 切换展开/收起
  const toggleExpand = (item: any) => {
    currentNetworkItem.value = item
    currentNetworkItem.value.isExpanded = !item.isExpanded
  }
  // 点击了创建的的按钮
  const handleCreateBondClick = () => {
    createBondDialogVisible.value = true
  }

  const handleCurrentNetworkItem = (item: NetworkInterface) => {
    currentNetworkItem.value = item
  }

  const saveNetworkConfig = (data: any) => {
    console.log('提交的网络配置', data)
    // 这里发起接口请求保存配置
  }

  const handleCreateBond = (data: any) => {
    console.log('>>>>', data)
  }

  const networkForm = ref({
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

  const handleInterfaceEditClick = () => {
    editInterfaceDialog.value = true
  }

  const handleDownClick = () => {}
</script>

<style scoped lang="scss">
  .storage-info-container {
    margin-top: 10px;
    background: #ffffff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 10px;
    max-width: 100%;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    transition: all 0.3s ease;
  }

  // 头部样式
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
  }

  .title-with-icon {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-icon {
    color: #409eff;
    font-size: 24px;
  }

  .main-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    line-height: 1;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .expand-btn {
    color: #909399;
    font-size: 14px;

    &:hover {
      color: #409eff;
      background-color: transparent;
    }
  }

  // 描述区域
  .description-section {
    margin-bottom: 24px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #409eff;
    transition: all 0.3s ease;

    &.collapsed {
      margin-bottom: 0;
      opacity: 0.8;
    }
  }

  // 信息网格布局
  .info-grid-wrapper {
    overflow: hidden;
  }

  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    padding: 8px 0;
  }

  // 信息项样式
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;

    &:hover {
      background: #f5f7fa;
      border-color: #dcdfe6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &:active {
      transform: translateY(0);
      transition: transform 0.1s ease;
    }
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    width: 50%;
    .item-icon {
      color: #909399;
      font-size: 16px;
    }
  }

  .info-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    width: 50%;
    .status-icon {
      font-size: 14px;
    }
  }

  // 状态样式
  .status-enabled {
    color: #67c23a;

    .status-icon {
      color: #67c23a;
    }
  }

  .status-disabled {
    color: #f56c6c;

    .status-icon {
      color: #f56c6c;
    }
  }

  .status-active {
    color: #409eff;

    .status-icon {
      color: #409eff;
    }
  }

  // 文件大小样式
  .size-value {
    color: #303133;
    font-weight: 600;
  }

  .size-number {
    font-size: 16px;
  }

  .size-unit {
    font-size: 12px;
    color: #909399;
    margin-left: 2px;
  }

  // 额外操作区域
  .additional-actions {
    margin-top: 20px;
    animation: fadeIn 0.3s ease;
  }

  .actions-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #dcdfe6, transparent);
    margin: 16px 0;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  // 动画效果
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 展开/收起动画
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .expand-enter-to,
  .expand-leave-from {
    opacity: 1;
    max-height: 500px;
  }

  // 响应式调整
  @media (max-width: 768px) {
    .storage-info-container {
      padding: 16px;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .header-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .main-title {
      font-size: 18px;
    }

    .action-buttons {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .info-value {
      align-self: flex-end;
    }

    .action-buttons {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
</style>
