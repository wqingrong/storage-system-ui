<template>
  <el-dialog v-model="dialogViable" title="磁盘列表" width="600px" @close="handleDialogClose">
    <div class="form-box">
      <!-- 操作工具栏 -->
      <div class="toolbar">
        <el-button type="warning" :disabled="selectedDisk === null" @click="openFormatDialog">
          格式化选中磁盘
        </el-button>
      </div>

      <el-table
        ref="spareTableRef"
        :data="diskDeviceList"
        row-key="device"
        style="width: 100%; margin-top: 10px"
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

    <!-- 格式化磁盘弹窗 -->
    <disk-format-dialog
      v-model:formatDialogVisible="formatDialogVisible"
      v-model:disk-device-list="diskDeviceList"
      v-model:format-device-list="formatDeviceList"
    />
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Disk } from '@/typings/disk'
  import { fetchGetFreeDiscDeviceList } from '@/api/system-manage'
  import { fetchPoolImportDisk, fetchPoolReplaceDisk } from '@/api/storage-service'
  import { ElCheckbox, ElMessageBox } from 'element-plus'
  import DiskFormatDialog from '@views/storage-system/storage-manager/disk-manager/modules/disk-format-dialog.vue'

  interface Props {
    viable: boolean
    poolItem: Disk.Device.StoragePool
    optionDiskItem: any
    option: string
  }

  const diskDeviceList = ref<Disk.Device.DeviceMessage[]>([])
  const dialogViable = ref(false)
  const spareTableRef = ref()
  const selectedDisk = ref<Disk.Device.DeviceMessage | null>(null)
  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:viable', value: boolean): void
    (e: 'refreshStorageList'): void
  }>()
  const confirmDisable = ref(true)

  // ===== 格式化相关 =====
  const formatDialogVisible = ref(false)
  const formatDeviceList = ref<Disk.Device.DeviceMessage[]>([])

  // 打开格式化弹窗
  const openFormatDialog = () => {
    if (!selectedDisk.value) return
    formatDeviceList.value = [selectedDisk.value]
    formatDialogVisible.value = true
  }

  // 格式化完成后刷新磁盘列表
  watch(formatDialogVisible, (newVal) => {
    if (!newVal) {
      // 格式化弹窗关闭时刷新磁盘列表
      loadingDiskList()
    }
  })

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
    diskDeviceBasic: any
  }

  const confirmImport = () => {
    switch (props.option) {
      case 'sortRaidImportDisk': {
        const params: PoolImportDisk = {
          poolName: props.poolItem.poolName,
          poolType: props.poolItem.poolType,
          grade: props.poolItem.raidDetailInfo.grade,
          raidDevicePath: props.poolItem.raidDetailInfo.devicePath,
          diskDeviceBasic: selectedDisk.value
        }
        fetchPoolImportDisk(params).then(() => {
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
          isForce: false,
          olderDiskDevice: props.optionDiskItem,
          newerDiskDevice: selectedDisk.value
        }
        const checked = ref<boolean | string | number>(false)
        ElMessageBox({
          title: '换盘提示',
          message: () =>
            h(
              ElCheckbox,
              {
                modelValue: checked.value,
                'onUpdate:modelValue': (val: boolean | string | number) => {
                  checked.value = val
                }
              },
              () => ['强制替换']
            ),
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          beforeClose: (action, _, done) => {
            if (action === 'confirm') {
              params.isForce = !!checked.value
              fetchPoolReplaceDisk(params).then(() => {
                emit('refreshStorageList')
                handleDialogClose()
                done()
              })
            }
          }
        }).catch(() => {
          ElMessage.info('已取消换盘操作')
        })
        return
      }
      default: {
        ElMessage.error('未知类型操作')
      }
    }
  }

  // 关闭弹窗
  const handleDialogClose = () => {
    emit('update:viable', false)
    selectedDisk.value = null
    confirmDisable.value = true
  }
</script>

<style>
  .el-dialog__body {
    padding: 0px !important;
  }

  .form-box {
    padding: 20px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
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
