<template>
  <div class="card art-custom-card sales-card" style="height: auto">
    <div class="card-header">
      <p class="title">阵列信息</p>
    </div>
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="12" class="center-card">
        <!-- 让这个容器自动居中包裹所有内容 -->
        <div class="card-content-wrapper">
          <ArtRingChart
            :data="[
              { value: 30, name: '电子产品' },
              { value: 55, name: '服装鞋包' },
              { value: 36, name: '家居用品' }
            ]"
            :color="['#4C87F3', '#EDF2FF', '#8BD8FC']"
            :radius="['70%', '80%']"
            height="16.5rem"
            :showLabel="false"
            :borderRadius="0"
            centerText="78%"
          />

          <div class="icon-text-widget">
            <div class="item">
              <div class="icon">
                <i class="iconfont-sys">&#xe718;</i>
              </div>
              <div class="content">
                <p>447023GB</p>
                <span>总容量</span>
              </div>
            </div>
            <div class="item">
              <div class="icon">
                <i class="iconfont-sys">&#xe70c;</i>
              </div>
              <div class="content">
                <p>352028GB</p>
                <span>已用容量</span>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="12">
        <div style="height: 100%">
          <volumeProgress
            style="margin-bottom: 10px"
            volume-name="存储空间1"
            :total="200"
            :used="199"
          />
          <volumeProgress
            style="margin-bottom: 10px"
            volume-name="存储空间2"
            :total="200"
            :used="86"
          />
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>
<script setup lang="ts">
  import volumeProgress from './volume-progress.vue'
</script>
<style scoped>
  /* 让卡片内部整体垂直 + 水平居中 */
  .center-card {
    display: flex;
    align-items: center; /* 垂直居中 */
    justify-content: center; /* 水平居中 */
    height: 100%; /* 占满卡片高度 */
  }

  /* 内容包裹层 */
  .card-content-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center; /* 图表 + 统计项 居中 */
    gap: 12px; /* 图表和下面容量文字间距 */
  }

  /* 下面两个容量项横向居中 */
  .icon-text-widget {
    display: flex;
    justify-content: center;
    gap: 30px;
    width: 100%;
  }
</style>
