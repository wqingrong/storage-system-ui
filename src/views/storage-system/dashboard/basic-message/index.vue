<template>
  <div class="ecommerce">
    <ElRow :gutter="20">
      <ElCol :sm="12" :md="12" :lg="8">
        <HealthStatus />
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="16">
        <GeneralView />
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
  import HealthStatus from './modules/health-status.vue'
  import StorageVolume from './modules/storage-volume.vue'

  defineOptions({ name: 'BasicEcommerce' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
