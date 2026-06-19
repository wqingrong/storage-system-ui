<template>
  <ElDialog v-model="dialogVisible" title="文件属性" width="30%" align-center>
    <div class="attr-panel">
      <!-- 基础信息 -->
      <div class="attr-block">
        <div class="block-title">基础信息</div>
        <div class="attr-row">
          <label>名称：</label>
          <span>{{ fileAttribute.name }}</span>
        </div>
        <div class="attr-row">
          <label>完整路径：</label>
          <span class="path-text">{{ fileAttribute.path }}</span>
        </div>
        <div class="attr-row">
          <label>类型：</label>
          <span>{{ fileAttribute.isDir ? '文件夹' : '文件' }}</span>
        </div>
        <div class="attr-row">
          <label>权限：</label>
          <span>{{ fileAttribute.permission }}</span>
        </div>
        <div class="attr-row">
          <label>总大小：</label>
          <span
            >{{ unitConvertAdapter(fileAttribute.totalBytes, 'b') }}({{
              fileAttribute.totalBytes
            }}
            Bytes)</span
          >
        </div>
        <div class="attr-row">
          <label>修改时间：</label>
          <span>{{ fileAttribute.modifyTime }}</span>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="attr-block" v-if="fileAttribute.isDir">
        <div class="block-title">目录统计</div>
        <div class="attr-row">
          <label>总大小：</label>
          <span
            >{{ unitConvertAdapter(fileAttribute.totalBytes, 'b') }}({{
              fileAttribute.totalBytes
            }}
            Bytes)</span
          >
        </div>
        <div class="attr-row">
          <label>子文件夹数量：</label>
          <span>{{ fileAttribute.totalDirs }}</span>
        </div>
        <div class="attr-row">
          <label>文件数量：</label>
          <span>{{ fileAttribute.totalFiles }}</span>
        </div>
      </div>

      <!-- 所有者/用户组信息 -->
      <div class="attr-block" v-if="fileAttribute.userInfo">
        <div class="block-title">归属用户与组</div>
        <div class="attr-row">
          <label>用户名：</label>
          <span>{{ fileAttribute.userInfo.userName }}</span>
        </div>
        <div class="attr-row">
          <label>UID：</label>
          <span>{{ fileAttribute.userInfo.uid }}</span>
        </div>
        <div class="attr-row">
          <label>用户别名：</label>
          <span>{{ fileAttribute.userInfo.userAlias || '-' }}</span>
        </div>
        <div class="attr-row">
          <label>用户邮箱：</label>
          <span>{{ fileAttribute.userInfo.userEmail || '-' }}</span>
        </div>
        <div class="attr-row">
          <label>用户组：</label>
          <span>{{ fileAttribute.userInfo.groupName }}</span>
        </div>
        <div class="attr-row">
          <label>GID：</label>
          <span>{{ fileAttribute.userInfo.gid }}</span>
        </div>
        <div class="attr-row">
          <label>组别名：</label>
          <span>{{ fileAttribute.userInfo.groupAlias || '-' }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { FileAttribute, SSEEvent } from '@utils/global_entity'
  import { sse } from '@utils/sse'
  import { fetchGetFileAttribute, fetchSubmitCancelTask } from '@/api/task-service'
  import { unitConvertAdapter } from '@utils/tools'

  interface Props {
    visible: boolean
    fileInfo: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 初始化userInfo不能给空对象，要给undefined，避免类型报错
  const fileAttribute = ref<FileAttribute>({
    name: '',
    path: '',
    permission: '',
    modifyTime: '',
    isDir: false,
    totalBytes: 0,
    totalDirs: 0,
    totalFiles: 0,
    userInfo: undefined
  })

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const initData = () => {
    // 重置再赋值，防止旧数据残留
    fileAttribute.value = {
      name: '',
      path: '',
      permission: '',
      modifyTime: '',
      isDir: false,
      totalBytes: 0,
      totalDirs: 0,
      totalFiles: 0,
      userInfo: undefined
    }
    Object.assign(fileAttribute.value, props.fileInfo)
  }

  let computeTaskId = ''
  const receiveAttributeData = (path: string) => {
    fetchGetFileAttribute({ path: path }).then((res) => {
      computeTaskId = res.taskId
      receiveFileAttribute(computeTaskId)
    })
  }

  const cancelComputeFileAttributeTask = (taskId: string) => {
    fetchSubmitCancelTask({ task_id: taskId }).then((res) => {
      console.log('取消任务的返回值', res)
    })
  }
  const event = new SSEEvent()
  const receiveFileAttribute = (taskId: string) => {
    sse.subscribe(taskId, (data: any) => {
      Object.assign(event, data)
      Object.assign(fileAttribute.value, event.data)
    })
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        event.clear()
        initData()
        receiveAttributeData(fileAttribute.value.path)
      } else {
        console.log('关闭了弹窗')
        if (computeTaskId) {
          cancelComputeFileAttributeTask(computeTaskId)
        }
        computeTaskId = ''
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .attr-panel {
    padding: 10px 0;
    .attr-block {
      margin-bottom: 16px;
      .block-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #303133;
        border-left: 3px solid #409eff;
        padding-left: 8px;
      }
      .attr-row {
        display: flex;
        line-height: 32px;
        font-size: 13px;
        label {
          width: 110px;
          color: #606266;
          flex-shrink: 0;
        }
        span {
          color: #303133;
          word-break: break-all;
        }
        .path-text {
          color: #409eff;
        }
      }
    }
  }
</style>
