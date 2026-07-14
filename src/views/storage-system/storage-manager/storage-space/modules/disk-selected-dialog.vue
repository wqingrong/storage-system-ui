<template>
  <el-dialog v-model="dialogViable" title="磁盘列表" width="600px" @close="handleDialogClose">
    <div class="form-box">
      <el-table
        ref="spareTableRef"
        :data="diskDeviceList"
        row-key="device"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column property="device" label="盘符" width="120" />
        <el-table-column property="model" label="型号" width="250" />
        <el-table-column property="totalSize" label="容量" />
      </el-table>
    </div>
    <template #footer>
      <el-button type="primary" :disabled="confirmDisable" @click="confirmImport">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Disk } from '@/typings/disk'
  import { fetchGetFreeDiscDeviceList } from '@/api/system-manage'
  import { fetchPoolImportDisk, fetchPoolReplaceDisk } from '@/api/storage-service'
  interface Props {
    viable: boolean
    poolItem: Disk.Device.StoragePool
    optionDiskItem: any
    option: string
  }
  //
  const diskDeviceList = ref<Disk.Device.DeviceMessage[]>([])
  const dialogViable = ref(false)
  const spareTableRef = ref() // 表格ref
  const selectedDisk = ref<Disk.Device.DeviceMessage | null>(null)
  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:viable', value: boolean): void
    (e: 'refreshStorageList'): void
  }>()
  const confirmDisable = ref(true)
  const loadingDiskList = () => {
    fetchGetFreeDiscDeviceList().then((res) => {
      diskDeviceList.value = res.records
    })
  }
  watch(
    () => props.viable,
    (newValue) => {
      dialogViable.value = props.viable
      if (newValue) {
        console.log('打开了弹窗》》', props.poolItem)
        loadingDiskList()
      } else {
        console.log('关闭了弹窗》》')
      }
    }
  )
  const handleSelectionChange = (val: any[]) => {
    // 当选中超过1个时，只保留最后一个
    if (val.length > 1) {
      spareTableRef.value.clearSelection()
      spareTableRef.value.toggleRowSelection(val[val.length - 1], true)
    }
    selectedDisk.value = val.length > 0 ? val[0] : null
    confirmDisable.value = !selectedDisk.value
  }
  interface PoolImportDisk {
    poolName: string
    poolType: string
    grade: string
    raidDevicePath: string
    diskDeviceBasicInfo: any
  }
  const confirmImport = () => {
    switch (props.option) {
      case 'sortRaidImportDisk': {
        const params: PoolImportDisk = {
          poolName: props.poolItem.poolName,
          poolType: props.poolItem.poolType,
          grade: props.poolItem.raidDetailInfo.grade,
          raidDevicePath: props.poolItem.raidDetailInfo.devicePath,
          diskDeviceBasicInfo: selectedDisk.value
        }
        fetchPoolImportDisk(params).then(() => {
          // 页面刷新一下
          emit('refreshStorageList')
          handleDialogClose()
        })
        return
      }
      case 'zfsReplaceDisk': {
        const params = {
          poolName: props.poolItem.poolName,
          poolType: props.poolItem.poolType,
          grade: props.poolItem.raidDetailInfo.grade,
          raidDevicePath: props.poolItem.raidDetailInfo.devicePath,
          olderDiskDevice: props.optionDiskItem,
          newerDiskDevice: selectedDisk.value
        }
        fetchPoolReplaceDisk(params).then(() => {
          // 页面刷新一下
          emit('refreshStorageList')
          handleDialogClose()
        })
        return
      }
      default: {
        ElMessage.error('未知类型操作')
      }
    }
  }
  //  关闭弹窗
  const handleDialogClose = () => {
    emit('update:viable', false)
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
