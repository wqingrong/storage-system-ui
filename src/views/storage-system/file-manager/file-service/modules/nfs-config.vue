<template>
  <div class="content">
    <!-- 中间内容区域 - 可滚动 -->
    <div class="config-form">
      <el-form :model="form" label-width="120px" label-position="right">
        <!-- 启用NFS服务 -->
        <el-checkbox style="margin-bottom: 20px" v-model="form.running">启用NFS服务</el-checkbox>
        <el-form-item label="线程数">
          <el-input
            v-model.number="form.threads"
            type="number"
            placeholder="请输入线程数"
            style="width: 300px"
          />
        </el-form-item>
        <!-- 最大nfs协议 -->
        <el-form-item label="最大NFS协议">
          <el-select
            v-model="form.supportVersion"
            placeholder="请选择最大NFS协议"
            style="width: 300px"
          >
            <el-option label="NFSv3" value="NFSv3" />
            <el-option label="NFSv4" value="NFSv4" />
            <el-option label="NFSv4.1" value="NFSv4.1" />
            <el-option label="NFSv4.2" value="NFSv4.2" />
          </el-select>
        </el-form-item>

        <!-- NFS范围（只读展示） -->
        <el-form-item label="NFS范围">
          <span class="nfs-range">{{ getSupportNFSVersion(form.supportVersion) }}</span>
        </el-form-item>
        <!-- statd端口 -->
        <el-form-item label="statd端口">
          <el-input
            v-model.number="form.statPort"
            type="number"
            placeholder="请输入statd端口"
            style="width: 300px"
          />
        </el-form-item>

        <!-- nlockmgr端口 -->
        <el-form-item label="nlockmgr端口">
          <el-input
            v-model.number="form.lockPort"
            type="number"
            placeholder="请输入nlockmgr端口"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.enabled">开机自启</el-checkbox>
        </el-form-item>
      </el-form>
    </div>

    <!-- 底部按钮 - 始终固定在底部 -->
    <div class="bottom">
      <div class="button-group">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="onSubmit" :disabled="!formChange">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { deepEqual } from '@/utils/tools'

  import NFSServerConfig = Api.Sys.NFSServerConfig
  import { fetchSetupNFSServerConfig } from '@/api/protocol-service'
  // 父组件应该传一个值过来
  interface Props {
    nfsConfig: NFSServerConfig
    module: string
  }

  interface Emits {
    (e: 'refresh'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  // 表单数据
  const form = ref<Api.Sys.NFSServerConfig>({
    running: false,
    enabled: false,
    threads: 0,
    supportVersion: '',
    lockPort: 0,
    mountedPort: 0,
    statPort: 0
  })

  // 提交表单
  const onSubmit = () => {
    // 这里添加保存逻辑
    fetchSetupNFSServerConfig(form.value).then(() => {
      emit('refresh')
    })
  }

  // 取消
  const handleCancel = () => {
    form.value = { ...props.nfsConfig }
    formChange.value = false
  }
  const formChange = ref(false)
  watch(
    () => props.nfsConfig,
    (newConfig) => {
      // 深拷贝避免引用问题，确保子组件数据独立
      form.value = { ...newConfig }
      formChange.value = false
    },
    {
      immediate: true, // 初始化时立即执行
      deep: true // 监听对象内部属性变化（如果 nfsConfig 是嵌套对象）
    }
  )
  //  监听表单值是否发生了变化
  watch(
    () => form.value,
    (newForm) => {
      formChange.value = !deepEqual(props.nfsConfig, newForm)
    },
    {
      immediate: false,
      deep: true
    }
  )

  const getSupportNFSVersion = (version: string) => {
    switch (version) {
      case 'NFSv3':
        return 'NFSv3'
      case 'NFSv4':
        return 'NFSv3,NFSv4'
      case 'NFSv4.1':
        return 'NFSv3,NFSv4,NFSv4.1'
      case 'NFSv4.2':
        return 'NFSv3,NFSv4,NFSv4.1,NFSv4.2'
      default:
        return ''
    }
  }
</script>

<style scoped lang="scss">
  .content {
    width: 100%;
    height: 80vh; /* 使用视口高度 */
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
    overflow: hidden; /* 防止整个页面滚动 */
  }

  .config-form {
    flex: 1; /* 占据剩余空间 */
    overflow-y: auto; /* 内容过多时自动滚动 */

    // 美化表单区域
    :deep(.el-form) {
      padding: 24px;
    }

    // 统一表单项的间距
    :deep(.el-form-item) {
      margin-bottom: 22px;
      // 最后一个表单项不需要底部间距
      &:last-child {
        margin-bottom: 0;
      }
    }

    // 复选框样式调整
    :deep(.el-checkbox) {
      .el-checkbox__label {
        font-size: 15px;
        color: #303133;
      }
    }

    // NFS范围文本样式
    .nfs-range {
      color: #606266;
      font-size: 14px;
      line-height: 32px;
      padding: 0 12px;
      display: inline-block;
      border: 1px solid #e4e7ed;
    }
  }

  .bottom {
    height: 70px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 24px;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    flex-shrink: 0; /* 防止底部被压缩 */
    z-index: 10; /* 确保底部在内容之上 */

    .button-group {
      display: flex;
      gap: 12px;

      .el-button {
        min-width: 90px;
        height: 36px;

        // 按钮悬停效果
        transition: all 0.3s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  // 响应式调整
  @media screen and (max-width: 768px) {
    .config-form {
      padding: 16px;

      :deep(.el-form) {
        padding: 16px;
      }

      :deep(.el-form-item) {
        display: block;

        .el-form-item__label {
          text-align: left;
          padding: 0 0 8px 0;
        }
      }

      .nfs-range,
      :deep(.el-select),
      :deep(.el-input) {
        width: 100% !important;
        min-width: 100% !important;
      }
    }

    .bottom {
      padding: 0 16px;
    }

    .test-toggle {
      bottom: 70px;
      right: 16px;
    }
  }
</style>
