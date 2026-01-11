<template>
  <div style="width: 100%; height: 100%">
    <ElCol :gutter="20">
      <ElRow :xs="24" v-for="item in groupList" :key="item.gid">
        <el-card
          style="width: 100%; margin-top: 5px; padding: 5px 10px !important"
          :shadow="item.gid === currentClickGroupItemId ? 'always' : 'hover'"
          :style="
            item.gid === currentClickGroupItemId
              ? 'background-color: rgb(var(--art-bg-primary))'
              : ''
          "
          @click="handleGroupCardClick(item)"
        >
          <div>
            <div style="font-size: 17px">{{ item.groupName }}</div>
            <div style="font-size: 14px">{{ item.groupName }}描述信息...</div>
          </div>
        </el-card>
      </ElRow>
    </ElCol>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    groupList: {
      type: Array as PropType<Api.Sys.SysGroup[]>,
      required: true,
      default: () => []
    },
    currentGroupItem: {
      type: Object as PropType<Api.Sys.SysGroup>,
      required: true,
      default: () => null
    }
  })

  const emit = defineEmits<{
    (e: 'update:currentGroupItem', value: Api.Sys.SysGroup | null): void // 添加更新事件
  }>()

  const currentClickGroupItemId = ref(-1)
  onMounted(() => {
    initData()
  })

  const initData = () => {
    if (props.groupList.length > 0) {
      currentClickGroupItemId.value = props.groupList[0].gid
      emit('update:currentGroupItem', props.groupList[0])
    }
  }
  /**
   * 处理图片卡片点击事件
   * @param groupItem
   */
  const handleGroupCardClick = (groupItem: Api.Sys.SysGroup) => {
    currentClickGroupItemId.value = groupItem.gid
    emit('update:currentGroupItem', groupItem)
  }
</script>

<style scoped lang="scss"></style>
