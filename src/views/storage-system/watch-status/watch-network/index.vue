<template>
  <div>
    <watch-network />
  </div>
</template>

<script setup lang="ts">
  import WatchNetwork from '@views/storage-system/watch-status/watch-network/modules/watch-network.vue'

  defineOptions({ name: 'BasicConsole' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
