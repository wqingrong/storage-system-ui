<template>
  <!-- 弹窗容器 -->
  <el-dialog v-model="dialogVisible" title="创建存储空间" width="600px" @close="handleClose(false)">
    <!-- 步骤1：配置存储空间容量 -->
    <div style="background: white" v-if="currentStep === 0">
      <div style="font-size: 16px">配置存储空间容量</div>
      <div class="form-box">
        <p style="margin-bottom: 15px"
          >存储空间是用来存储数据,在存储池上创建。请先选择或创建存储池，然后继续</p
        >
        <el-form :model="createStorageSpaceFormData">
          <el-form-item label="存储池:" label-position="left" label-width="200px">
            <el-select
              v-model="createStorageSpaceFormData.vgName"
              placeholder="请选择存储池"
              style="width: 300px"
            >
              <el-option
                v-for="item in storagePoolList"
                :label="item.poolName"
                :value="item.vgName"
                :key="item.vgName"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="总容量:" label-position="left" label-width="200px">
            <span>{{
              getTargetStoragePoolItem(createStorageSpaceFormData.vgName)?.storageSize
            }}</span>
          </el-form-item>
          <el-form-item label="可用容量:" label-position="left" label-width="200px">
            <span>{{ getTargetStoragePoolItem(createStorageSpaceFormData.vgName)?.freeSize }}</span>
          </el-form-item>

          <el-form-item label="分配大小:" label-position="left" label-width="200px">
            <el-input
              v-model="createStorageSpaceFormData.spaceSize"
              placeholder="输入存储空间大小"
              type="number"
              style="width: 300px"
            />
          </el-form-item>

          <el-form-item label="存储空间描述:" label-position="left" label-width="200px">
            <el-input
              v-model="createStorageSpaceFormData.descTxt"
              placeholder="可选，输入存储空间描述"
              style="width: 300px"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 步骤2：选择文件系统 -->
    <div v-else-if="currentStep === 1">
      <div style="font-size: 16px">请选择文件系统 </div>
      <div class="form-box">
        <el-radio-group v-model="createStorageSpaceFormData.fileSystem" class="radio-group">
          <div v-for="fileSystem in fileSystemList" :key="fileSystem.value" class="radio-item">
            <el-radio class="radio-button" :value="fileSystem.value"
              >{{ fileSystem.label }}
            </el-radio>
            <div style="font-size: 14px !important">
              <span>{{ fileSystem.descTxt }}</span>
            </div>
          </div>
        </el-radio-group>
      </div>
    </div>

    <!-- 步骤3：确认配置 -->
    <div v-else-if="currentStep === 2">
      <div style="font-size: 16px">存储空间配置信息</div>
      <div class="form-box">
        <!-- 表格结构 超出一定数量时显示滚动条-->
        <div>
          <div>
            <div class="form-item">
              <div style="width: 50%">存储池</div>
              <div style="width: 50%">{{
                getTargetStoragePoolItem(createStorageSpaceFormData.vgName)?.poolName
              }}</div>
            </div>
            <el-divider style="margin: 12px 0" />
          </div>
        </div>
        <!--        ---------------------------------------->
        <div>
          <div class="form-item">
            <div style="width: 50%">配置容量</div>
            <div style="width: 50%"
              >{{ createStorageSpaceFormData.spaceSize }}{{ createStorageSpaceFormData.unit }}</div
            >
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">文件系统</div>
            <div style="width: 50%"> {{ createStorageSpaceFormData.fileSystem }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">描述信息</div>
            <div style="width: 50%"> {{ createStorageSpaceFormData.descTxt }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </div>
    </div>
    <!--创建成功的显示框-->
    <div v-else-if="currentStep === 3">
      <el-result
        v-if="resultResponse?.success"
        icon="success"
        style="height: 100px"
        title="存储池创建成功"
      />
      <el-result v-else icon="error" style="height: 100px" title="存储空间创建失败" />
      <div class="form-box">
        <div>
          <div class="form-item">
            <div style="width: 50%">存储池</div>
            <div style="width: 50%">{{ resultResponse?.storagePoolName }}</div>
          </div>
          <el-divider style="margin: 12px 0" />

          <div class="form-item">
            <div style="width: 50%">存储空间</div>
            <div style="width: 50%">{{ resultResponse?.storageSpaceName }}</div>
          </div>
          <el-divider style="margin: 12px 0" />

          <div class="form-item">
            <div style="width: 50%">容量</div>
            <div style="width: 50%">{{ resultResponse?.spaceSize }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
          <div class="form-item">
            <div style="width: 50%">描述信息</div>
            <div style="width: 50%">{{ resultResponse?.descTxt }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </div>
    </div>
    <!-- 底部按钮 -->
    <template #footer>
      <!--      <el-button v-if="currentStep == 1" style="float: left" @click="advancedSetup"-->
      <!--        >高级设置</el-button-->
      <!--      >-->
      <el-button
        v-if="currentStep <= 3 && currentStep != 0"
        @click="prevStep"
        :disabled="currentStep === 0 || resultResponse?.success"
        >上一步</el-button
      >
      <el-button type="primary" @click="nextStep">
        {{ currentStep >= 2 ? '完成' : '下一步' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { fetchGetStoragePoolSimpleList, fetchNewtStorageSpace } from '@/api/system-manage'
  import { Disk } from '@/typings/disk'

  interface Props {
    visible: boolean
  }
  // 创建存储空间的表单信息
  const createStorageSpaceFormData = reactive<Disk.Device.StorageSpaceFormData>({
    storagePoolName: '',
    vgName: '',
    descTxt: '',
    spaceSize: '',
    fileSystem: '',
    unit: ''
  })

  // 创建获取当前选中的存储空间对象
  const getTargetStoragePoolItem = (vgName: string) => {
    return storagePoolList.value.find((item) => item.vgName === vgName)
  }

  const fileSystemList = [
    {
      label: 'btrfs',
      value: 'btrfs',
      descTxt: '支持快照 / 克隆、空间配额、数据校验，适合需要高级数据管理的场景。'
    },
    {
      label: 'ext4',
      value: 'ext4',
      descTxt: '兼容性强（适配旧系统）、稳定性高，是 Linux 系统的基础选择。'
    },
    {
      label: 'xfs ',
      value: 'xfs ',
      descTxt: '读写性能出色，支持超大容量存储，适合高负载的大文件场景。'
    }
  ]

  // 创建成功的返回值
  const resultResponse = ref<Disk.Device.NewStorageSpaceResult>()
  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'call-storage-method', methodName: string, ...args: any[]): void
  }>()

  // 弹窗显隐
  const dialogVisible = ref(false)
  // 当前步骤（0=步骤1，1=步骤2，2=步骤3）
  const currentStep = ref(0)

  // 监听visible变化
  watch(
    () => props.visible,
    (newVal) => {
      dialogVisible.value = newVal
      if (newVal) {
        // 弹窗打开的情况
        resetSteps()
        loadingStoragePoolList()
      }
    }
  )

  watch(
    () => createStorageSpaceFormData.vgName,
    (newVal) => {
      let item = getTargetStoragePoolItem(newVal)
      if (item) {
        createStorageSpaceFormData.storagePoolName = item.poolName
        createStorageSpaceFormData.unit = item.unit
      }
    }
  )

  const storagePoolList = ref<Disk.Device.StoragePoolSimpleInfo[]>([])
  const loadingStoragePoolList = () => {
    fetchGetStoragePoolSimpleList().then((res) => {
      storagePoolList.value = res.records
      if (storagePoolList.value.length > 0) {
        createStorageSpaceFormData.vgName = storagePoolList.value[0].vgName
      }
    })
  }

  // 重置步骤和表单,设置默认信息
  const resetSteps = () => {
    currentStep.value = 0
    createStorageSpaceFormData.fileSystem = 'btrfs'
    createStorageSpaceFormData.unit = ''
    createStorageSpaceFormData.spaceSize = ''
    createStorageSpaceFormData.vgName = ''
    createStorageSpaceFormData.storagePoolName = ''
    createStorageSpaceFormData.descTxt = ''
  }

  // 关闭弹窗
  const handleClose = (isRefresh: boolean) => {
    if (isRefresh) {
      emit('call-storage-method', 'refreshStorageSpaceData', '参数1', '参数2')
    }
    emit('update:visible', false)
  }

  // 下一步
  const nextStep = () => {
    // 提交表单信息
    if (currentStep.value === 2) {
      // 获取当前单位
      fetchNewtStorageSpace(createStorageSpaceFormData).then((res) => {
        resultResponse.value = res
      })
      currentStep.value++
    } else if (currentStep.value === 3) {
      handleClose(true)
    } else {
      currentStep.value++
    }
  }

  // 上一步
  const prevStep = () => {
    currentStep.value--
  }
</script>

<style scoped>
  .el-dialog__body {
    padding: 0 !important;
  }

  .form-box {
    padding: 20px;
  }

  .form-item {
    height: 20px;
    display: flex;
    align-items: center;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .radio-button {
    margin-bottom: 10px; /* 调整间距 */
  }

  .radio-group {
    /* 若需要竖向排列，可加flex布局（也可用direction="vertical"） */
    display: flex;
    flex-direction: column;
    gap: 12px; /* 选项之间的垂直间距 */
  }

  /* 单个选项容器：控制单选按钮和描述的布局 */
  .radio-item {
    width: 100%;
    display: flex;
    align-items: flex-start; /* 单选按钮和描述顶部对齐（可选） */
    flex-direction: column;
    cursor: pointer; /* 鼠标悬浮手型，提升体验 */
  }

  /* 单选按钮：可选（调整样式） */
  .radio-button {
    /* 固定单选按钮的位置，避免被描述文字挤压 */
    flex-shrink: 0;
  }

  /* 可选：选中时描述文字的样式（增强交互） */
  .radio-item :deep(.el-radio__input.is-checked) + .el-radio__label + .radio-desc {
    color: #1989fa; /* 匹配Element UI的主色调，可自定义 */
    font-weight: 500;
  }
</style>
