<template>
  <!-- 弹窗容器 -->
  <el-dialog
    v-model="dialogVisible"
    title="创建ZFS存储空间"
    width="600px"
    @close="handleClose(false)"
  >
    <!-- 步骤1：配置存储空间容量 -->
    <div style="background: white" v-if="currentStep === 0">
      <div style="font-size: 16px">配置存储空间容量</div>
      <div class="form-box">
        <p style="margin-bottom: 15px"
          >存储空间是用来存储数据,在ZFS存储池上创建。请先选择存储池，然后继续</p
        >
        <el-form :model="createZfsDataSetFormData">
          <el-form-item label="存储池:" label-position="left" label-width="200px">
            <el-select
              v-model="createZfsDataSetFormData.storage_pool_name"
              placeholder="请选择存储池"
              style="width: 300px"
            >
              <el-option
                v-for="item in storagePoolList"
                :label="item.pool_name"
                :value="item.pool_name"
                :key="item.pool_name"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="总容量:" label-position="left" label-width="200px">
            <span>{{ formatBytes(getTargetStoragePoolItem()?.total_bytes) }}</span>
          </el-form-item>
          <el-form-item label="可用容量:" label-position="left" label-width="200px">
            <span>{{ formatBytes(getTargetStoragePoolItem()?.free_bytes) }}</span>
          </el-form-item>

          <el-form-item label="分配大小:" label-position="left" label-width="200px">
            <el-input
              v-model="createZfsDataSetFormData.space_size"
              placeholder="输入存储空间大小"
              type="number"
              :disabled="maxSpaceFilled"
              style="width: 220px"
            />
            <el-select
              v-model="createZfsDataSetFormData.unit"
              placeholder="单位"
              :disabled="maxSpaceFilled"
              style="width: 80px; margin-left: 8px"
            >
              <!-- 可选单位：最小为G，最大为当前存储池总容量的单位 -->
              <el-option v-for="item in availableUnits" :label="item" :value="item" :key="item" />
            </el-select>
          </el-form-item>

          <el-form-item label="按比例分配:" label-position="left" label-width="200px">
            <el-input
              v-model="createZfsDataSetFormData.max_space_size"
              placeholder="输入最大空间比例(1-100)"
              type="number"
              :min="1"
              :max="100"
              :disabled="spaceSizeFilled"
              style="width: 220px"
            />
            <span style="margin-left: 8px">%</span>
          </el-form-item>

          <el-form-item label="存储空间描述:" label-position="left" label-width="200px">
            <el-input
              v-model="createZfsDataSetFormData.desc_txt"
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
        <el-radio-group v-model="createZfsDataSetFormData.file_system" class="radio-group">
          <div v-for="fileSystem in fileSystemList" :key="fileSystem.value" class="radio-item">
            <el-radio class="radio-button" :value="fileSystem.value" :disabled="fileSystem.disable"
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
        <div>
          <div class="form-item">
            <div style="width: 50%">存储池</div>
            <div style="width: 50%">{{ createZfsDataSetFormData.storage_pool_name }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <!-- 分配大小与按比例分配互斥展示：单位不是%显示配置容量，是%显示按比例分配 -->
        <div v-if="createZfsDataSetFormData.unit !== '%'">
          <div class="form-item">
            <div style="width: 50%">配置容量</div>
            <div style="width: 50%">{{
              createZfsDataSetFormData.space_size
                ? createZfsDataSetFormData.space_size + createZfsDataSetFormData.unit
                : '-'
            }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <div v-else>
          <div class="form-item">
            <div style="width: 50%">按比例分配</div>
            <div style="width: 50%">{{ createZfsDataSetFormData.max_space_size || '-' }}%</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">文件系统</div>
            <div style="width: 50%"> {{ createZfsDataSetFormData.file_system }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">描述信息</div>
            <div style="width: 50%"> {{ createZfsDataSetFormData.desc_txt }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </div>
    </div>
    <!--创建成功的显示框-->
    <div v-else-if="currentStep === 3">
      <el-result
        v-if="createSuccess"
        icon="success"
        style="height: 100px"
        title="ZFS存储空间创建成功"
      />
      <el-result v-else icon="error" style="height: 100px" title="ZFS存储空间创建失败" />
      <div class="form-box">
        <div>
          <div class="form-item">
            <div style="width: 50%">存储池</div>
            <div style="width: 50%">{{ createZfsDataSetResponse?.pool_name }}</div>
          </div>
          <el-divider style="margin: 12px 0" />

          <div class="form-item">
            <div style="width: 50%">存储空间</div>
            <div style="width: 50%">{{ createZfsDataSetResponse?.name }}</div>
          </div>
          <el-divider style="margin: 12px 0" />

          <div class="form-item">
            <div style="width: 50%">挂载点</div>
            <div style="width: 50%">{{ createZfsDataSetResponse?.mount_point }}</div>
          </div>
          <el-divider style="margin: 12px 0" />

          <div class="form-item">
            <div style="width: 50%">容量</div>
            <div style="width: 50%">{{ formatBytes(createZfsDataSetResponse?.total_bytes) }}</div>
          </div>
          <el-divider style="margin: 12px 0" />

          <div class="form-item">
            <div style="width: 50%">描述信息</div>
            <div style="width: 50%">{{ createZfsDataSetFormData.desc_txt }}</div>
          </div>
          <el-divider style="margin: 12px 0" />
        </div>
      </div>
    </div>
    <!-- 底部按钮 -->
    <template #footer>
      <el-button
        v-if="currentStep <= 3 && currentStep != 0"
        @click="prevStep"
        :disabled="currentStep === 0 || createSuccess"
        >上一步</el-button
      >
      <el-button type="primary" @click="nextStep" :disabled="isNextDisabled">
        {{ currentStep >= 2 ? '完成' : '下一步' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { fetchCreateZfsDataSet, fetchGetZPoolMap } from '@/api/zfs-service'
  import type { NewZfsDataSet, ZFSDataSet, ZFSPool } from '@/entity/zfs'
  import { PoolType } from '@/enums/appEnum'
  import { unitConvertAdapter } from '@utils/tools'

  interface Props {
    visible: boolean
    // 默认选中的ZFS存储池名称，不传则默认选中第一个
    defaultPoolName?: string
  }

  // 创建存储空间的表单信息
  const createZfsDataSetFormData = reactive<NewZfsDataSet>({
    storage_pool_name: '',
    pool_type: PoolType.POOL_TYPE_ZFS,
    desc_txt: '',
    space_size: '',
    file_system: 'zfs',
    unit: 'G',
    max_space_size: ''
  })

  // 获取当前选中的存储池对象
  const getTargetStoragePoolItem = () => {
    return storagePoolList.value.find(
      (item) => item.pool_name === createZfsDataSetFormData.storage_pool_name
    )
  }

  // ZFS存储池只支持zfs文件系统，其余选项禁用（与通用创建存储空间弹窗选中ZFS池时的逻辑一致）
  const fileSystemList = [
    {
      label: 'zfs',
      value: 'zfs',
      descTxt:
        '高可靠、强安全、易管理、超大规模于一体的现代文件系统，核心优势在于数据永不静默损坏、写时复制保障一致性、存储池化管理、内置 RAID 与快照 / 克隆 / 压缩 / 去重',
      disable: false
    }
  ]

  // 创建成功的返回值
  const createZfsDataSetResponse = ref<ZFSDataSet>()
  // 创建是否成功
  const createSuccess = ref(false)
  const props = defineProps<Props>()

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'call-storage-method', methodName: string, ...args: any[]): void
  }>()

  // 弹窗显隐
  const dialogVisible = ref(false)
  // 当前步骤（0=步骤1，1=步骤2，2=步骤3，3=结果）
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

  // ZFS存储池列表(来自 /zfs/getZPoolMap)
  const storagePoolList = ref<ZFSPool[]>([])
  const loadingStoragePoolList = () => {
    fetchGetZPoolMap()
      .then((res) => {
        // 接口返回 池名 → 池信息 的map，转成数组渲染；兜底兼容数组返回
        storagePoolList.value = Array.isArray(res) ? res : Object.values(res ?? {})
        if (storagePoolList.value.length > 0) {
          // 优先选中指定的存储池，否则默认选中第一个
          const target = storagePoolList.value.find(
            (item) => item.pool_name === props.defaultPoolName
          )
          createZfsDataSetFormData.storage_pool_name = target
            ? target.pool_name
            : storagePoolList.value[0].pool_name
        }
      })
      .catch(() => {
        storagePoolList.value = []
      })
  }

  // 单位档位(从小到大)：最小单位为G
  const unitList: Array<'G' | 'T' | 'P'> = ['G', 'T', 'P']

  // 当前存储池总容量对应的最大单位，例如10GB→G、10TB→T、10PB→P
  const maxUnit = computed<'G' | 'T' | 'P'>(() => {
    const total = getTargetStoragePoolItem()?.total_bytes ?? 0
    if (total >= 1024 ** 5) {
      return 'P'
    }
    if (total >= 1024 ** 4) {
      return 'T'
    }
    return 'G'
  })

  // 可选单位：最小为G，最大为当前存储池总容量的单位
  const availableUnits = computed(() => unitList.slice(0, unitList.indexOf(maxUnit.value) + 1))

  // 分配大小与最大空间互斥：填了其一，另一个输入框禁用
  const spaceSizeFilled = computed(() => createZfsDataSetFormData.space_size !== '')
  const maxSpaceFilled = computed(() => createZfsDataSetFormData.max_space_size !== '')

  // 按比例分配时unit固定为%，切回分配大小模式时恢复最小单位G
  watch(maxSpaceFilled, (filled) => {
    createZfsDataSetFormData.unit = filled ? '%' : 'G'
  })

  // 存储池或可选单位变化时，当前选中的单位超出范围则重置为最小单位G（按比例分配的%除外）
  watch([() => createZfsDataSetFormData.storage_pool_name, availableUnits], () => {
    const unit = createZfsDataSetFormData.unit
    if (unit !== '%' && !availableUnits.value.includes(unit as 'G' | 'T' | 'P')) {
      createZfsDataSetFormData.unit = 'G'
    }
  })

  // 重置步骤和表单,设置默认信息
  const resetSteps = () => {
    currentStep.value = 0
    createSuccess.value = false
    createZfsDataSetResponse.value = undefined
    createZfsDataSetFormData.storage_pool_name = ''
    createZfsDataSetFormData.pool_type = PoolType.POOL_TYPE_ZFS
    createZfsDataSetFormData.space_size = ''
    createZfsDataSetFormData.desc_txt = ''
    createZfsDataSetFormData.file_system = 'zfs'
    createZfsDataSetFormData.unit = 'G'
    createZfsDataSetFormData.max_space_size = ''
  }

  // 关闭弹窗
  const handleClose = (isRefresh: boolean) => {
    if (isRefresh) {
      emit('call-storage-method', 'refreshStorageSpaceData', '参数1', '参数2')
    }
    emit('update:visible', false)
  }

  // 下一步按钮是否禁用（步骤1需选择存储池，分配大小/最大空间二选一，最大空间需在1~100之间）
  const isNextDisabled = computed(() => {
    if (currentStep.value === 0) {
      const maxSpace = createZfsDataSetFormData.max_space_size
      const maxSpaceValid = maxSpace === '' || (Number(maxSpace) >= 1 && Number(maxSpace) <= 100)
      return (
        !createZfsDataSetFormData.storage_pool_name ||
        (!spaceSizeFilled.value && !maxSpaceFilled.value) ||
        !maxSpaceValid
      )
    }
    return false
  })

  // 下一步
  const nextStep = () => {
    // 提交表单信息
    if (currentStep.value === 2) {
      fetchCreateZfsDataSet(createZfsDataSetFormData)
        .then((res) => {
          createSuccess.value = true
          createZfsDataSetResponse.value = res
          currentStep.value++
        })
        .catch(() => {
          createSuccess.value = false
          currentStep.value++
        })
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

  /** 字节数格式化为可读容量 */
  const formatBytes = (bytes?: number): string => unitConvertAdapter(bytes ?? 0, 'bytes')
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
    gap: 12px; /* 选项之间的垂直间距 */
  }

  .radio-button {
    margin-bottom: 10px; /* 调整间距 */
    flex-shrink: 0;
  }

  /* 单个选项容器：控制单选按钮和描述的布局 */
  .radio-item {
    width: 100%;
    display: flex;
    align-items: flex-start; /* 单选按钮和描述顶部对齐（可选） */
    flex-direction: column;
    cursor: pointer; /* 鼠标悬浮手型，提升体验 */
  }
</style>
