<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <ArtSidebarMenu />
    </aside>

    <main id="app-main">
      <div class="app-header">
        <ArtHeaderBar />
      </div>
      <div class="app-content">
        <ArtPageContent />
      </div>
    </main>

    <div class="app-global">
      <ArtGlobalComponent />
    </div>

    <!-- 全局上传任务面板：上传状态与页面解耦，切换页面后仍在后台继续 -->
    <UploadTaskPanel />
  </div>
</template>

<script setup lang="ts">
  import UploadTaskPanel from '@/components/custom/upload-task-panel/index.vue'

  defineOptions({ name: 'AppLayout' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
