<!-- 文件共享服务管理 -->
<template>
  <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
    <el-tab-pane label="SMB" name="SMB">
      <SmbConfig></SmbConfig>
    </el-tab-pane>
    <el-tab-pane label="NFS" name="NFS">
      <NfsConfig
        :nfsConfig="handleNFSServerConfig"
        :module="activeName"
        @refresh="loadingNFSServerConfig"
      ></NfsConfig>
    </el-tab-pane>
    <el-tab-pane label="webdav" name="webdav">
      <WebdavConfig></WebdavConfig>
    </el-tab-pane>
    <el-tab-pane label="rsync" name="rsync">
      <RsyncConfig></RsyncConfig>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  import SmbConfig from './modules/smb-config.vue'
  import NfsConfig from './modules/nfs-config.vue'
  import WebdavConfig from './modules/webdav-config.vue'
  import RsyncConfig from './modules/rsync-config.vue'
  import { Api } from '@/typings/api'
  import { fetchGetNFSServerConfig } from '@/api/protocol-service'
  import { TabsPaneContext } from 'element-plus'
  const activeName = ref('SMB')
  const handleNFSServerConfig = ref<Api.Sys.NFSServerConfig>({} as Api.Sys.NFSServerConfig)
  const handleClick = (tab: TabsPaneContext, event: Event) => {
    activeName.value = tab.paneName
    switch (activeName.value) {
      case 'NFS':
        loadingNFSServerConfig()
        break
      case 'SMB':
        ElMessage.success(activeName.value + '暂未对接')
        break
      case 'webdav':
        ElMessage.success(activeName.value + '暂未对接')
        break
      case 'rsync':
        ElMessage.success(activeName.value + '暂未对接')
        break
      default:
        ElMessage.error(activeName.value + '暂未对接')
    }
  }
  const loadingNFSServerConfig = () => {
    fetchGetNFSServerConfig(null).then((res) => {
      handleNFSServerConfig.value = res
    })
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
