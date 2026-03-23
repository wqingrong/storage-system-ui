<template>
  <!--  菜单选项结构-->
  <div class="disk-manager">
    <div class="menu-container">
      <ElSpace wrap>
        <ElButton>状态信息</ElButton>
        <ElButton @click="handleCreateStoragePool">创建存储池</ElButton>
        <ElButton @click="handleCreateZpool">创建Zpool</ElButton>
      </ElSpace>
    </div>
    <DiskDetail />
    <CreateStoragePoll v-model:visible="createPollDialogVisible" />
    <CreateZPool v-model:visible="createZPoolDialogVisible" />
  </div>
</template>

<script setup lang="ts">
  import DiskDetail from './modules/disk-detail.vue'
  import CreateStoragePoll from './modules/create-storage-poll.vue'
  import CreateZPool from './modules/create-zpool.vue'
  const createPollDialogVisible = ref(false)
  const createZPoolDialogVisible = ref(false)
  const handleCreateStoragePool = () => {
    createPollDialogVisible.value = true
  }

  const handleCreateZpool = () => {
    createZPoolDialogVisible.value = true
  }
</script>

<style scope>
  .menu-container {
    margin: 10px;
  }
</style>
