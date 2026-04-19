<template>
  <div>
    <DiskIoStatWatch></DiskIoStatWatch>
  </div>
</template>

<script setup lang="ts">
  import DiskIoStatWatch from '@views/storage-system/watch-status/watch-disk/modules/disk_io_stats.vue'
  defineOptions({ name: 'DiskWatch' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
