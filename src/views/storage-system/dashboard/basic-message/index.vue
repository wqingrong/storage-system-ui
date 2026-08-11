<template>
  <div class="ecommerce">
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="12">
        <GeneralView />
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="12">
        <VersionInfo />
      </ElCol>
    </ElRow>
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="24">
        <StorageVolume />
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import GeneralView from './modules/general-view .vue'
  import StorageVolume from './modules/storage-volume.vue'
  import VersionInfo from './modules/version-info.vue'

  defineOptions({ name: 'BasicEcommerce' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
