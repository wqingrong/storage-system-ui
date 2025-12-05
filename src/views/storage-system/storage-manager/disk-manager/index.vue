<template>
  <DiskInfoCard :disk-info="hardDiskData" />
</template>

<script setup lang="ts">
  import DiskInfoCard from './modules/disk-message.vue'

  // 模拟硬盘数据（和示例一致）
  const hardDiskData = {
    name: '硬盘 1 - WDC WD10EZEX-22MFC40 (HDD)',
    capacity: '931.5 GB',
    status: '良好',
    statusClass: 'good',
    details: [
      { label: '位置', value: 'singstor_test' },
      { label: '配置用途', value: '存储池 1' },
      { label: '硬盘状态', value: '良好' },
      { label: '温度', value: '35 °C / 95 °F' },
      { label: '硬盘操作', value: '-' },
      { label: '序列号', value: 'WD-WCC6Y5HULDEC' },
      { label: '固件版本', value: '01.01A01' },
      { label: '4K 原生硬盘', value: '否' }
    ]
  }
</script>
