<!-- 软raid 设置高级设置 -->
<template>
  <!-- 弹窗容器 -->
  <el-dialog v-model="dialogVisible" title="高级设置" width="600px" @close="handleClose">
    <div style="font-size: 16px">设置热备盘 </div>
    <div class="form-box">
      <el-table
        ref="spareTableRef"
        :data="spareDiskList"
        row-key="device"
        style="width: 100%"
        @selectionChange="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column property="device" label="盘符" width="120" />
        <el-table-column property="model" label="型号" width="250" />
        <el-table-column property="totalSize" label="容量" />
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Disk } from '@/typings/disk'

  interface Props {
    advancedSetupVisible: boolean
    diskDeviceList: Disk.Device.DeviceMessage[]
    softRiadFormData: Disk.Device.CreateStoragePoolDto
  }

  const props = defineProps<Props>()
  const resetLock = ref(false)
  const emit = defineEmits<{
    (e: 'update:advancedSetupVisible', value: boolean): void
    (e: 'update:softRiadFormData', value: Disk.Device.CreateStoragePoolDto): void
  }>()
  const spareTableRef = ref() // 表格引用
  // 弹窗显隐
  const dialogVisible = ref(false)
  const spareDiskList = ref<Disk.Device.DeviceMessage[]>([])
  // 监听visible变化
  watch(
    () => props.advancedSetupVisible,
    (newVal) => {
      if (newVal) {
        spareDiskList.value = []
        dialogVisible.value = newVal
        // 这里要对热备盘进行单独判断显示,只有不在选中的磁盘中的盘才可以选择..
        props.diskDeviceList.forEach((item) => {
          if (
            !props.softRiadFormData.diskDeviceList.some((target) => target.device === item.device)
          ) {
            spareDiskList.value.push(item)
          }
        })
        resetLock.value = false
        // 恢复之前选中的热备盘（关键修复）
        setTimeout(() => {
          if (props.softRiadFormData.spareDeviceList?.length) {
            props.softRiadFormData.spareDeviceList.forEach((item) => {
              spareTableRef.value?.toggleRowSelection(item, true)
            })
          }
          resetLock.value = true
        }, 0)
      }
    }
  )
  const handleSelectionChange = (val: Disk.Device.DeviceMessage[]) => {
    if (!resetLock.value) return
    let formData = { ...props.softRiadFormData }
    formData.spareDeviceList = val
    emit('update:softRiadFormData', formData)
  }
  // 关闭弹窗
  const handleClose = () => {
    emit('update:advancedSetupVisible', false)
  }
</script>

<style>
  .el-dialog__body {
    padding: 0px !important;
  }

  .form-box {
    padding: 20px;
  }

  .form-item {
    height: 20px;
    display: flex;
    align-items: center;
  }

  .el-divider--horizontal {
    margin: 10px 0 !important;
  }
</style>
