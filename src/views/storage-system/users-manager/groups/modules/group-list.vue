<template>
  <dev style="width: 100%; height: 100%">
    <ElCol :gutter="20">
      <ElRow :xs="24" v-for="item in groupList" :key="item.gid">
        <ArtStatsCard
          style="width: 100%; height: 70px"
          :title="item.groupName"
          :description="item.groupAlias"
          :backgroundColor="
            item.gid === currentClickGroupItemId ? 'rgb(var(--art-bg-primary))' : ''
          "
          @click="handleGroupCardClick(item)"
        />
      </ElRow>
    </ElCol>
  </dev>
</template>

<script setup lang="ts">
  const props = defineProps({
    groupList: {
      type: Array as PropType<Api.Sys.SysGroup[]>,
      required: true,
      default: () => []
    }
  })

  const currentClickGroupItemId = ref(-1)
  onMounted(() => {
    initData()
    console.log(props.groupList)
  })

  const initData = () => {
    if (props.groupList.length > 0) {
      currentClickGroupItemId.value = props.groupList[0].gid
    }
  }
  /**
   * 处理图片卡片点击事件
   * @param groupItem
   */
  const handleGroupCardClick = (groupItem: Api.Sys.SysGroup) => {
    currentClickGroupItemId.value = groupItem.gid
  }
  
</script>

<style scoped lang="scss"></style>
