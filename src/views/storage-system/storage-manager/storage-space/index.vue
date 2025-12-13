<template>
  <div class="art-full-height">
    <StorageSpace />
  </div>
</template>

<script setup lang="ts">
  import { useCommon } from '@/composables/useCommon'
  import StorageSpace from './modules/storage-space.vue'
  defineOptions({ name: 'StorageSpace' })

  useCommon().scrollToTop()
</script>

<style lang="scss" scoped>
  @use './style';
</style>
