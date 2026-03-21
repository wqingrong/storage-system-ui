<template>
  <!-- 弹窗容器 -->
  <el-dialog v-model="dialogVisible" title="创建ZPool" width="600px" @close="handleClose">
    <!-- 步骤1：配置存储池属性 -->
    <div style="background: white" v-if="currentStep === 0">
      <div style="font-size: 16px">配置存储池属性</div>
      <div class="form-box">
        <p style="margin-bottom: 15px"
          >RAID 是将多个硬盘聚合成一个存储池的数据存储虚拟化技术。不同类型的 RAID
          可提供不同级别的性能、存储容量和可靠性。</p
        >
        <el-form>
          <el-form-item label="RAID 类别:" label-position="left" label-width="200px">
            <el-select
              v-model="createZPoolFormData.grade"
              placeholder="请选择RAID类别"
              style="width: 300px"
            >
              <el-option :label="RaidGrade.RAID_Stripe" :value="RaidGrade.RAID_Stripe" />
              <el-option :label="RaidGrade.RAID_Mirror" :value="RaidGrade.RAID_Mirror" />
              <el-option :label="RaidGrade.RAID_Z1" :value="RaidGrade.RAID_Z1" />
              <el-option :label="RaidGrade.RAID_Z2" :value="RaidGrade.RAID_Z2" />
              <el-option :label="RaidGrade.RAID_Z3" :value="RaidGrade.RAID_Z3" />
            </el-select>
            <span style="line-height: 2">{{ raidGradeTipTxt(createZPoolFormData.grade) }}</span>
          </el-form-item>

          <el-form-item label="存储池描述:" label-position="left" label-width="200px">
            <el-input
              v-model="createZPoolFormData.storagePoolDesc"
              placeholder="可选，输入存储池描述"
              style="width: 300px"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 步骤2：选择磁盘 -->
    <div v-else-if="currentStep === 1">
      <div style="font-size: 16px"
        >请选择至少选择 {{ diskNumber(createZPoolFormData.grade) }} 块硬盘创建
        {{ createZPoolFormData.grade }}
      </div>
      <div class="form-box">
        <el-table
          ref="multipleTableRef"
          :data="diskDeviceList"
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
    </div>

    <!-- 步骤3：确认配置 -->
    <div v-else-if="currentStep === 2">
      <div style="font-size: 16px">配置信息</div>
      <div class="form-box">
        <!-- 表格结构 超出一定数量时显示滚动条-->
        <div>
          <div>
            <div class="form-item">
              <div style="width: 50%">磁盘数量</div>
              <div style="width: 50%">{{ createZPoolFormData.diskDeviceList.length }}</div>
            </div>
            <el-divider />
          </div>
          <!---------循环显示磁盘列表-------------->
          <div v-for="disk in createZPoolFormData.diskDeviceList" :key="disk.device">
            <div class="form-item">
              <div style="width: 50%">{{ disk.device }}</div>
              <div style="width: 50%">{{ disk.totalSize }}</div>
            </div>
            <el-divider />
          </div>
        </div>
        <!--        ---------------------------------------->
        <div>
          <div class="form-item">
            <div style="width: 50%">RAID等级</div>
            <div style="width: 50%">{{ createZPoolFormData.grade }}</div>
          </div>
          <el-divider />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">预计容量</div>
            <div style="width: 50%"> 待定 </div>
          </div>
          <el-divider />
        </div>
      </div>
    </div>
    <!--创建成功的显示框-->
    <div v-else-if="currentStep === 3">
      <el-result
        v-if="createZPoolSuccessResponse?.zpoolStatusInfo.status.toUpperCase() === 'ONLINE'"
        icon="success"
        style="height: 100px"
        title="ZPool创建成功"
      />
      <el-result v-else icon="error" style="height: 100px" title="存储池创建失败" />
      <div class="form-box">
        <div>
          <div class="form-item">
            <div style="width: 50%">磁盘数量</div>
            <div style="width: 50%">{{
              createZPoolSuccessResponse?.zpoolStatusInfo.diskDeviceList.length
            }}</div>
          </div>
          <el-divider />
        </div>
        <!-- 表格结构 超出一定数量时显示滚动条-->
        <el-scrollbar max-height="200px">
          <div>
            <!---------循环显示磁盘列表-------------->
            <div
              v-for="disk in createZPoolSuccessResponse?.zpoolStatusInfo.diskDeviceList"
              :key="disk.device"
            >
              <div class="form-item">
                <div style="width: 50%">{{ disk.device }}</div>
                <div style="width: 50%">{{ disk.totalSize }}</div>
              </div>
              <el-divider />
            </div>
          </div>
        </el-scrollbar>
        <!--        ---------------------------------------->
        <div>
          <div class="form-item">
            <div style="width: 50%">RAID等级</div>
            <div style="width: 50%">{{ createZPoolSuccessResponse?.zpoolStatusInfo.grade }}</div>
          </div>
          <el-divider />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">RAID状态</div>
            <div style="width: 50%">{{ createZPoolSuccessResponse?.zpoolStatusInfo.status }}</div>
          </div>
          <el-divider />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">存储池</div>
            <div style="width: 50%">{{ createZPoolSuccessResponse?.poolName }}</div>
          </div>
          <el-divider />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">存储池容量</div>
            <div style="width: 50%">{{ createZPoolSuccessResponse?.poolSize }}</div>
          </div>
          <el-divider />
        </div>
        <div>
          <div class="form-item">
            <div style="width: 50%">描述信息</div>
            <div style="width: 50%">{{ createZPoolSuccessResponse?.storagePoolDesc }}</div>
          </div>
          <el-divider />
        </div>
      </div>
    </div>
    <!-- 底部按钮 -->
    <template #footer>
      <el-button v-if="currentStep == 1" style="float: left" @click="advancedSetup"
        >高级设置</el-button
      >
      <el-button v-if="currentStep <= 2" @click="prevStep" :disabled="currentStep === 0"
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
  import { RaidGrade } from '@/enums/formEnum'
  import { fetchCreateZPool, fetchGetFreeDiscDeviceList } from '@/api/system-manage'
  import { Disk } from '@/typings/disk'
  import { TableInstance } from 'element-plus'
  const multipleTableRef = ref<TableInstance>()
  interface Props {
    visible: boolean
  }

  const createZPoolFormData = reactive<Disk.Device.CreateZPoolDto>({
    grade: RaidGrade.RAID_Stripe,
    diskDeviceList: [],
    storagePoolDesc: '',
    chunkSize: '64k'
  })

  // 创建成功的返回值
  const createZPoolSuccessResponse = ref<Disk.Device.CreateZPoolSuccessResponse>()

  // 至少需要的磁盘数量
  const diskNumber = (raidGrade: RaidGrade) => {
    switch (raidGrade) {
      case RaidGrade.RAID_Stripe:
        return 1
      case RaidGrade.RAID_Mirror:
        return 2
      case RaidGrade.RAID_Z1:
        return 3
      case RaidGrade.RAID_Z2:
        return 4
      case RaidGrade.RAID_Z3:
        return 5
    }
  }

  const props = defineProps<Props>()
  const raidGradeTipTxt = (raidGrade: RaidGrade) => {
    switch (raidGrade) {
      case RaidGrade.RAID_Stripe:
        return `
        【RAID Stripe】条带化存储
        • 核心技术：将数据分散存储到多块硬盘，无冗余校验
        • 性能表现：读写速度提升显著（随硬盘数量线性增长）
        • 可靠性：无冗余，任意一块硬盘故障将导致所有数据丢失
        • 容量利用率：100%（总容量=所有硬盘容量之和）
        • 适用场景：临时缓存、可重新生成的数据（如日志、缓存层）
        • 最少需要：1块硬盘
      `
          .trim()
          .replace(/\s+/g, ' ') // 移除多余空格，适合前端展示

      case RaidGrade.RAID_Mirror:
        return `
        【RAID Mirror】镜像存储
        • 核心技术：将数据完整复制到多块硬盘，实现1:1镜像
        • 性能表现：读性能提升，写性能与单盘相当
        • 可靠性：允许1块硬盘故障，数据无丢失风险
        • 容量利用率：50%（总容量=最小硬盘容量）
        • 适用场景：关键元数据、高可靠性需求的小容量数据
        • 最少需要：2块硬盘
      `
          .trim()
          .replace(/\s+/g, ' ')

      case RaidGrade.RAID_Z1:
        return `
        【RAID Z1】分布式奇偶校验
        • 核心技术：数据分散存储，同时生成分布式奇偶校验信息
        • 性能表现：读性能优秀，写性能因校验计算略有下降
        • 可靠性：允许1块硬盘故障，故障后可通过奇偶校验恢复数据
        • 容量利用率：(n-1)/n（n为硬盘数量，总容量=(n-1)*最小硬盘容量）
        • 适用场景：文件服务器、数据库存储、普通业务数据
        • 最少需要：3块硬盘
      `
          .trim()
          .replace(/\s+/g, ' ')

      case RaidGrade.RAID_Z2:
        return `
        【RAID Z2】双分布式奇偶校验
        • 核心技术：基于 RAID Z1 增加第二份奇偶校验，提供双重保护
        • 性能表现：读性能优秀，写性能因双重校验计算有所下降
        • 可靠性：允许2块硬盘同时故障，数据无丢失风险
        • 容量利用率：(n-2)/n（n为硬盘数量，总容量=(n-2)*最小硬盘容量）
        • 适用场景：大规模存储系统、关键业务数据、高可靠性要求场景
        • 最少需要：4块硬盘
      `
          .trim()
          .replace(/\s+/g, ' ')
      case RaidGrade.RAID_Z3:
        return `
        【RAID Z3】双分布式奇偶校验
        • 核心技术：基于 RAID Z2 增加第第三份奇偶校验，提供双重保护
        • 性能表现：读性能优秀，写性能因三重校验计算有所下降
        • 可靠性：允许3块硬盘同时故障，数据无丢失风险
        • 容量利用率：(n-3)/n（n为硬盘数量，总容量=(n-3)*最小硬盘容量）
        • 适用场景：超大规模存储、高风险环境（如偏远机房）
        • 最少需要：5块硬盘
      `
          .trim()
          .replace(/\s+/g, ' ')
      default:
        return '未知 RAID 等级'
    }
  }

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
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
        loadingDiskDeviceList()
      }
    }
  )
  // 加载磁盘列表
  const diskDeviceList = ref<Disk.Device.DeviceMessage[]>([])
  const loadingDiskDeviceList = () => {
    fetchGetFreeDiscDeviceList().then((res) => {
      diskDeviceList.value = res.records
    })
  }
  const handleSelectionChange = (val: Disk.Device.DeviceMessage[]) => {
    createZPoolFormData.diskDeviceList = val
  }

  const autoSelectDisks = async () => {
    if (!multipleTableRef.value) {
      return
    }
    await nextTick()
    // 遍历磁盘列表，自动勾选符合条件的磁盘
    createZPoolFormData.diskDeviceList.forEach((disk) => {
      multipleTableRef.value.toggleRowSelection(disk, true)
    })
  }

  // 重置步骤和表单
  const resetSteps = () => {
    currentStep.value = 0
    createZPoolFormData.grade = RaidGrade.RAID_Stripe
    createZPoolFormData.diskDeviceList = []
    createZPoolFormData.storagePoolDesc = ''
    createZPoolFormData.chunkSize = '64k'
  }

  onMounted(() => {
    // nextTick确保表格DOM已渲染完成
  })

  // 关闭弹窗
  const handleClose = () => {
    emit('update:visible', false)
    resetSteps()
  }

  // 下一步按钮是否禁用（根据当前步骤的必填项）

  const isNextDisabled = computed(() => {
    if (currentStep.value === 1) {
      autoSelectDisks()
      // 保证磁盘数量至少大于等于选中的等级至少需要的数量
      return !(createZPoolFormData.diskDeviceList.length >= diskNumber(createZPoolFormData.grade))
    }
    return false
  })

  // 下一步
  const nextStep = () => {
    if (currentStep.value === 2) {
      // TODO: 提交表单,若返回值为成功则value正常 ++
      submitStoragePoolFormData()
    } else if (currentStep.value === 3) {
      handleClose()
    } else {
      currentStep.value++
    }
  }

  const submitStoragePoolFormData = () => {
    fetchCreateZPool(createZPoolFormData).then((res) => {
      createZPoolSuccessResponse.value = res
      currentStep.value++
    })
  }

  // 上一步
  const prevStep = () => {
    currentStep.value--
  }

  const advancedSetup = () => {
    console.log('高级设置')
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
