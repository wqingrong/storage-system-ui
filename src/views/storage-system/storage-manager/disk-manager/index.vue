<template>
  <!--  菜单选项结构-->
  <div class="art-full-height">
    <div class="menu-container">
      <ElSpace wrap>
        <ElButton>状态信息</ElButton>
        <ElButton>创建存储池</ElButton>
      </ElSpace>
    </div>
    <DiskDetail :disk-info="hardDiskData" />
  </div>
</template>

<script setup lang="ts">
  import DiskDetail from './modules/disk-detail.vue'

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

<style scope>
  .menu-container {
    margin: 10px;
  }
</style>
