<!-- 文件共享服务管理 -->
<template>
  <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
    <el-tab-pane label="网络接口列表" name="networkList">
      <NetworkList
        v-model:network-interface-list="networkInterfaceList"
        @reloadList="reloadNetworkList"
      >
      </NetworkList>
    </el-tab-pane>
    <el-tab-pane label="流量控制" name="networkLimit"> </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import NetworkList from './modules/network-list.vue'
  import { TabsPaneContext } from 'element-plus'
  import { NetworkInterface } from '@/entity/network'
  import { fetchGetNetworkInterfaceDetailedList } from '@/api/network'

  const activeName = ref('networkList')
  const networkInterfaceList = ref<NetworkInterface[]>([])
  const reloadNetworkList = () => {
    fetchGetNetworkInterfaceDetailedList(null).then((res) => {
      networkInterfaceList.value = res
    })
  }
  onMounted(() => {
    reloadNetworkList()
  })

  const handleClick = (tab: TabsPaneContext, event: Event) => {
    activeName.value = String(tab.paneName)
    switch (activeName.value) {
      case 'networkList':
        reloadNetworkList()
        break
      case 'networkLimit':
        ElMessage.success(activeName.value + '暂未对接')
        break
      default:
        ElMessage.error(activeName.value + '暂未对接')
    }
  }
</script>

<style lang="scss" scoped>
  .demo-tabs > .el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
  }
</style>
