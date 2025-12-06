<template>
  <!--  菜单选项结构-->
  <div class="art-full-height">
    <div class="menu-container">
      <ElSpace wrap>
        <ElButton>状态信息</ElButton>
        <ElButton @click="handleCreateStoragePool">创建存储池</ElButton>
      </ElSpace>
    </div>
    <DiskDetail />
    <CreateStoragePoll v-model:visible="createPollDialogVisible" />
  </div>
</template>

<script setup lang="ts">
  import DiskDetail from './modules/disk-detail.vue'
  import CreateStoragePoll from './modules/create-storage-poll.vue'
  const createPollDialogVisible = ref(false)
  const handleCreateStoragePool = () => {
    console.log('创建存储池')
    createPollDialogVisible.value = true
  }
</script>

<style scope>
  .menu-container {
    margin: 10px;
  }
</style>
