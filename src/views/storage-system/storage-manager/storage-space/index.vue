<template>
  <div class="art-full-height">
    <div class="menu-container" style="margin-bottom: 10px">
      <ElSpace wrap>
        <!--        <ElButton>状态信息</ElButton>-->
        <ElButton @click="handleCreateStorageSpace">创建存储池</ElButton>
      </ElSpace>
    </div>
    <!--    存储空间详细信息显示-->
    <StorageSpace ref="storageSpaceRef" />
    <!--    创建存储空间弹窗-->
    <CreateStorageSpace
      v-model:visible="createStorageSpaceDialogVisible"
      @call-storage-method="handleCallStorageMethod"
    />
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
    createStorageSpaceDialogVisible.value = true
  }
  const storageSpaceRef = ref(null)
  const handleCallStorageMethod = (methodName: any, ...args: any) => {
    // 校验：实例存在 + 方法存在
    if (storageSpaceRef.value && typeof storageSpaceRef.value[methodName] === 'function') {
      // 执行 StorageSpace 的方法并返回结果（可选）
      console.log('>>>>>调用了组件方法', methodName)
      return storageSpaceRef?.value[methodName](...args)
    } else {
      console.warn(`StorageSpace 中不存在方法：${methodName}`)
    }
  }
</script>

<style lang="scss" scoped>
  @use './style';
</style>
