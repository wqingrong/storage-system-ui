<template>
  <div class="version-info-container">
    <div class="version-header">
      <span class="version-title">版本信息</span>
      <el-button type="primary" size="small" @click="openUpgradeDialog">离线升级</el-button>
    </div>

    <div class="version-content">
      <div class="version-item">
        <span class="item-label">产品名称</span>
        <span class="item-value">{{ data.productName }}</span>
      </div>
      <div class="version-item">
        <span class="item-label">版本号</span>
        <span class="item-value">{{ data.version }}</span>
      </div>
      <div class="version-item">
        <span class="item-label">版本别名</span>
        <span class="item-value">{{ data.versionAlias }}</span>
      </div>
      <div class="version-item">
        <span class="item-label">构建类型</span>
        <span class="item-value">
          <el-tag :type="buildTypeTag" size="small">{{ data.buildType }}</el-tag>
        </span>
      </div>
      <div class="version-item">
        <span class="item-label">硬件型号</span>
        <span class="item-value">{{ data.productModel }}</span>
      </div>
      <div class="version-item">
        <span class="item-label">序列号</span>
        <span class="item-value">{{ data.serial }}</span>
      </div>
      <div class="version-item">
        <span class="item-label">编译时间</span>
        <span class="item-value">{{ data.buildTime }}</span>
      </div>
    </div>

    <!-- 离线升级对话框 -->
    <el-dialog
      v-model="upgradeDialogVisible"
      title="离线升级"
      width="520px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="upgradeForm" label-width="80px">
        <el-form-item label="升级文件" required>
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            :on-exceed="handleExceed"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".bin,.zip,.tar,.gz,.tar.gz,.upg,.img"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 bin / zip / tar / tar.gz / upg / img 格式的升级包
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="upgradeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交升级</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { UploadInstance, UploadFile } from 'element-plus'
  import { fetchGetVersionView, fetchVersionUpgradeOffline } from '@/api/dashboard-service'
  import type { VersionView } from '@/entity/dashboard'

  defineOptions({ name: 'VersionInfo' })

  const data = reactive<VersionView>({
    version: '',
    productName: '',
    productModel: '',
    serial: '',
    versionAlias: '',
    buildType: 'dev',
    buildTime: ''
  })

  const buildTypeTag = computed(() => {
    const map: Record<string, 'success' | 'warning' | 'danger'> = {
      release: 'success',
      beta: 'warning',
      dev: 'danger'
    }
    return map[data.buildType] || 'info'
  })

  const fetchData = async () => {
    try {
      const res = await fetchGetVersionView()
      Object.assign(data, res)
    } catch (e) {
      console.error('获取版本信息失败', e)
    }
  }

  fetchData()

  // ========== 离线升级 ==========
  const upgradeDialogVisible = ref(false)
  const submitting = ref(false)
  const fileList = ref<UploadFile[]>([])
  const uploadRef = ref<UploadInstance>()
  const formRef = ref()

  const upgradeForm = reactive({
    file: null as File | null
  })

  const openUpgradeDialog = () => {
    upgradeDialogVisible.value = true
  }

  const handleDialogClose = () => {
    fileList.value = []
    upgradeForm.file = null
  }

  const handleFileChange = (file: UploadFile) => {
    upgradeForm.file = file.raw as File
  }

  const handleFileRemove = () => {
    upgradeForm.file = null
  }

  const handleExceed = () => {
    ElMessage.warning('只能上传一个升级文件，请先移除已有文件')
  }

  const handleSubmit = async () => {
    if (!upgradeForm.file) {
      ElMessage.warning('请先选择升级文件')
      return
    }

    try {
      await ElMessageBox.confirm(
        '升级过程中系统可能会重启，确认要提交离线升级吗？',
        '升级确认',
        {
          confirmButtonText: '确认升级',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }

    submitting.value = true
    try {
      const formData = new FormData()
      formData.set('upgradeFile', upgradeForm.file)

      await fetchVersionUpgradeOffline(formData)
      ElMessage.success('升级包已提交，系统将开始升级')
      upgradeDialogVisible.value = false
    } catch (e) {
      console.error('离线升级失败', e)
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped>
  .version-info-container {
    padding: 20px;
    height: 80%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  }

  .version-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .version-title {
    font-size: 20px;
    font-weight: 500;
    color: #666666;
  }

  .version-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .version-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 6px;
    transition: background-color 0.3s;
  }

  .version-item:hover {
    background-color: #f5f7fa;
  }

  .item-label {
    font-size: 14px;
    color: #909399;
    white-space: nowrap;
  }

  .item-value {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    word-break: break-all;
  }

  /* 响应式 */
  @media (max-width: 768px) {
    .version-content {
      grid-template-columns: 1fr;
    }
  }
</style>
