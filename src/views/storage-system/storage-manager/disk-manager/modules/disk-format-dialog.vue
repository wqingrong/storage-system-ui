<!-- 软raid 设置高级设置 -->
<template>
  <!-- 弹窗容器 -->
  <el-dialog
    v-model="dialogVisible"
    title="格式化磁盘"
    width="600px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="form-box">
      <!-- 格式化确认页 -->
      <div v-if="formatStep === 'confirm'">
        <el-alert
          title="警告"
          type="warning"
          description="格式化磁盘将清除磁盘上的所有数据，请确认是否继续。"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-descriptions border :column="1">
          <el-descriptions-item label="待格式化磁盘数量">
            {{ formatDeviceList.length }} 块
          </el-descriptions-item>
        </el-descriptions>
        <el-table :data="props.formatDeviceList" row-key="device" style="width: 100%">
          <el-table-column property="device" label="盘符" width="120" />
          <el-table-column property="model" label="型号" width="250" />
          <el-table-column property="totalSize" label="容量" />
        </el-table>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="startFormat">确认格式化</el-button>
        </div>
      </div>

      <!-- 格式化进度页 -->
      <div v-else-if="formatStep === 'processing'">
        <div class="progress-box">
          <!-- 旋转动画 -->
          <div class="spinner"></div>

          <div class="progress-text"> 正在格式化磁盘 </div>

          <div class="progress-count"> {{ currentStep }} / {{ totalStep }} </div>

          <el-progress
            :percentage="progressPercentage"
            :show-text="false"
            style="margin-top: 16px"
          />

          <div class="progress-tip">
            {{ currentDiskName }}
          </div>
        </div>

        <div class="dialog-footer">
          <el-button type="danger" @click="handleCancelFormat" :disabled="canceling">
            {{ canceling ? '正在取消...' : '取消格式化' }}
          </el-button>
        </div>
      </div>

      <!-- 格式化完成页 -->
      <div v-else-if="formatStep === 'finished'">
        <el-result icon="success" title="格式化完成" sub-title="所有磁盘已完成格式化" />

        <div class="dialog-footer">
          <el-button type="primary" @click="handleClose">确定</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { Disk } from '@/typings/disk'
  import { sse } from '@utils/sse'
  import { fetchSubmitCancelTask, fetchSubmitDiskFormat } from '@/api/task-service'

  interface Props {
    formatDialogVisible: boolean
    formatDeviceList: Disk.Device.DeviceMessage[]
    diskDeviceList: Disk.Device.DeviceMessage[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:formatDialogVisible', value: boolean): void
  }>()

  type FormatStep = 'confirm' | 'processing' | 'finished'

  // 弹窗显隐
  const dialogVisible = ref(false)

  // 格式化流程步骤
  const formatStep = ref<FormatStep>('confirm')

  // 当前格式化到第几块
  const currentStep = ref(0)

  // 总磁盘数量
  const totalStep = computed(() => props.formatDeviceList.length)

  // 当前正在格式化的磁盘名称
  const currentDiskName = ref('')

  // 总体进度百分比
  const progressPercentage = computed(() => {
    if (totalStep.value === 0) return 0
    return Math.round((currentStep.value / totalStep.value) * 100)
  })

  // 是否正在取消
  const canceling = ref(false)

  watch(
    () => props.formatDialogVisible,
    (newVal) => {
      if (newVal) {
        dialogVisible.value = true
        resetFormatState()
        console.log('打开弹窗')
        console.log('参数信息', props.diskDeviceList, props.formatDeviceList)
      } else {
        dialogVisible.value = false
        console.log('关闭弹窗')
      }
    }
  )

  // 关闭弹窗
  const handleClose = () => {
    resetFormatState()
    cancelFormatDiskTask(taskId)
    emit('update:formatDialogVisible', false)
  }

  // 重置格式化状态
  const resetFormatState = () => {
    formatStep.value = 'confirm'
    currentStep.value = 0
    currentDiskName.value = ''
    canceling.value = false
  }
  // 接收sse事件信息
  const receiveFormatEvent = (taskId: string) => {
    let formatDiskList = []
    sse.subscribe(taskId, (data: any) => {
      if (data.status === 'running') {
        formatDiskList.push(data.data)
        currentStep.value++
        if (currentStep.value < props.formatDeviceList.length) {
          currentDiskName.value = props.formatDeviceList[currentStep.value].devicePath
        }
      }
      if (data.status === 'success') {
        formatStep.value = 'finished'
        taskId = ''
      }
    })
  }

  const cancelFormatDiskTask = (taskId: string) => {
    if (taskId) {
      fetchSubmitCancelTask({ task_id: taskId })
    }
  }

  let taskId = ''
  // 开始格式化
  const startFormat = () => {
    if (props.formatDeviceList.length === 0) {
      return
    }
    fetchSubmitDiskFormat({ diskList: props.formatDeviceList }).then((res) => {
      if (res.taskId) {
        formatStep.value = 'processing'
        currentStep.value = 0
        currentDiskName.value = getDiskName(props.formatDeviceList[0])
        taskId = res.taskId
        receiveFormatEvent(taskId)
      }
    })
  }

  // 取消格式化
  const handleCancelFormat = () => {
    handleClose()
    canceling.value = true
    cancelFormatDiskTask(taskId)
  }

  // 取磁盘名称
  const getDiskName = (disk: Disk.Device.DeviceMessage) => {
    return disk.devicePath
  }
</script>

<style scoped>
  .form-box {
    min-height: 260px;
  }

  .progress-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 260px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #409eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .progress-text {
    margin-top: 16px;
    font-size: 16px;
    color: #303133;
  }

  .progress-count {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    color: #409eff;
  }

  .progress-tip {
    margin-top: 12px;
    font-size: 14px;
    color: #909399;
  }

  .dialog-footer {
    padding: 16px 20px;
    text-align: right;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
