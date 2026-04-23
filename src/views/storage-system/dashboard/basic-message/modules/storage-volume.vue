<template>
  <div class="card art-custom-card sales-card" style="height: auto">
    <div class="card-header">
      <p class="title">阵列信息</p>
    </div>
    <ElRow v-for="(item, index) in storagePoolList" :key="index" :gutter="20">
      <ElCol :sm="24" :md="24" :lg="12" class="center-card">
        <!-- 让这个容器自动居中包裹所有内容 -->
        <div class="card-content-wrapper">
          <ArtRingChart
            :data="[
              { value: 100 - item.useRatio, name: '未分配', label: item.freeSize },
              { value: item.useRatio, name: '已分配', label: item.useSize }
            ]"
            :colors="['#EDF2FF', '#4C87F3']"
            :radius="['70%', '80%']"
            height="16.5rem"
            :showLabel="false"
            :borderRadius="0"
            :centerText="item.poolName"
          />

          <div class="icon-text-widget">
            <div class="item">
              <div class="content">
                <p>{{ item.storageSize }}</p>
                <span>总容量</span>
              </div>
            </div>
            <div class="item">
              <div class="content">
                <p>{{ item.freeSize }}</p>
                <span>未分配</span>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="12">
        <div style="height: 100%">
          <volumeProgress
            v-for="(volume, index) in item.storageSpaceList"
            :key="index"
            style="margin-bottom: 10px"
            :volume-name="volume.spaceName"
            :free-size="volume.freeSize"
            :total-size="volume.spaceSize"
            :precent="volume.useRatio"
          />
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>
<script setup lang="ts">
  import volumeProgress from './volume-progress.vue'
  import { ref } from 'vue'
  import { Disk } from '@/typings/disk'
  import { fetchGetStoragePoolList } from '@/api/system-manage'
  const storagePoolList = ref<Disk.Device.StoragePool[]>([])

  onMounted(() => {
    refreshStorageSpaceData()
  })
  const refreshStorageSpaceData = () => {
    fetchGetStoragePoolList().then((res) => {
      if (res) {
        storagePoolList.value = res.records
      }
    })
  }
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
