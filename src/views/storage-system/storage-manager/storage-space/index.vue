<template>
  <div class="art-full-height">
    <div class="menu-container" style="margin-bottom: 10px">
      <ElSpace wrap>
        <!--        <ElButton>状态信息</ElButton>-->
        <ElButton @click="handleCreateStorageSpace">创建存储池</ElButton>
      </ElSpace>
    </div>
    <!--    存储空间详细信息显示-->
    <StorageSpace />
    <!--    创建存储空间弹窗-->
    <CreateStorageSpace v-model:visible="createStorageSpaceDialogVisible" />
  </div>
</template>

<script setup lang="ts">
  import { useCommon } from '@/composables/useCommon'
  import StorageSpace from './modules/storage-space.vue'
  import CreateStorageSpace from '@views/storage-system/storage-manager/storage-space/modules/create-storage-space.vue'
  defineOptions({ name: 'StorageSpace' })
  useCommon().scrollToTop()
  const createStorageSpaceDialogVisible = ref(false)
  const handleCreateStorageSpace = () => {
    console.log('创建存储空间')
    createStorageSpaceDialogVisible.value = true
  }
</script>

<style lang="scss" scoped>
  @use './style';
</style>
