<template>
  <div class="demo-collapse">
    <el-collapse v-for="item in storagePoolList" :key="item.poolName">
      <el-collapse-item name="1">
        <template #title>
          <div style="display: flex; flex-direction: row; align-items: center">
            <img
              style="width: 70px; height: 70px"
              :src="getStoragePoolStatusImage(item.poolStatus)"
            />
            <div
              style="
                display: flex;
                flex-direction: column;
                align-content: center;
                justify-content: center;
                width: 80%;
              "
            >
              <!-- 第一行：设置为flex布局并两端对齐 -->
              <div style="display: flex; justify-self: flex-start; width: 100%">
                <div style="width: 60%"
                  ><span>{{ item.poolName }} </span></div
                >
                <div style="width: 40%; display: flex; align-items: center; /* 仅垂直居中 */">
                  <el-progress :percentage="item.useRatio" style="width: 70%" />
                </div>
              </div>
              <!--              第二行-->
              <div style="display: flex; justify-self: flex-start; width: 100%">
                <div style="width: 60%">
                  <span v-if="item.poolStatus === HealthStatus.OK" style="color: #4caf50"
                    >良好</span
                  >
                  <span v-else-if="item.poolStatus === HealthStatus.WARNING" style="color: #ec6f30"
                    >异常</span
                  >
                  <span v-else style="color: #e80536">损坏</span>
                </div>
                <div style="width: 40%">
                  <span style="color: #2b8dfa">{{ item.storageSize }} </span>
                  <span>| {{ item.freeSize }}可用</span>
                </div>
              </div>
            </div>
            <div
              style="
                text-align: center;
                display: flex; /* 开启flex布局 */
                align-items: center; /* 垂直居中 */
                justify-content: center; /* 水平居中（可替代text-align: center） */
                width: 40px; /* 给容器设置宽高，避免容器被内容撑开（按需调整） */
                height: 40px; /* 建议设置，否则垂直居中效果不明显 */
                cursor: pointer; /* 鼠标悬浮显示手型，提升交互体验 */
              "
              @contextmenu.prevent="showMenu"
            >
              <el-icon style="font-size: 20px">
                <MoreFilled />
              </el-icon>
            </div>
          </div>
        </template>
        <div style="margin-left: 10px; width: 100%; background: #f4f6f9; padding: 5px">
          <div class="detail-item">
            <div class="detail-label">
              <span>RAID类别:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.raidDetailInfo.grade }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>块大小:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.raidDetailInfo.blockSize }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>卷组名称:</span>
            </div>
            <div class="detail-value">
              <span> {{ item.vgsName }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>总容量:</span>
            </div>
            <div class="detail-value">
              <span>{{ item.storageSize }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>RAID状态:</span>
            </div>
            <div class="detail-value">
              <span class="detail-value">{{ item.raidDetailInfo.status }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>描述信息:</span>
            </div>
            <div class="detail-value">
              <span>待定...</span>
            </div>
          </div>
          <!--          这里要塞一个表格进来-->
          <div>
            <el-table
              :data="item.raidDetailInfo.diskDeviceList"
              style="width: 100%"
              @current-change="handleCurrentChange"
            >
              <el-table-column property="orderNumber" label="RAID顺序" />
              <el-table-column property="device" label="盘符" width="120" />
              <el-table-column property="model" label="硬盘类型" width="120" />
              <el-table-column property="serialNumber" label="序列号" />
              <el-table-column property="totalSize" label="容量" />
              <el-table-column property="use" label="用途" />
              <el-table-column property="healthStatus" label="硬盘状态" />
            </el-table>
          </div>
        </div>
        <!--        存储空间显示列表-->
        <div
          v-for="spaceItem in item.storageSpaceList"
          :key="spaceItem.volumeName"
          style="margin-top: 15px; margin-left: 50px; width: 80%"
        >
          <div style="display: flex; flex-direction: row; align-items: center">
            <img
              style="width: 50px; height: 50px"
              :src="getStorageSpaceStatusImage(spaceItem.mountStatus)"
            />
            <div
              style="
                display: flex;
                flex-direction: column;
                align-content: center;
                justify-content: center;
                width: 80%;
              "
            >
              <!-- 第一行：设置为flex布局并两端对齐 -->
              <div style="display: flex; justify-self: flex-start; width: 100%">
                <div style="width: 60%"
                  ><span>{{ spaceItem.spaceName }}</span></div
                >
                <div style="width: 40%; display: flex; align-items: center; /* 仅垂直居中 */">
                  <el-progress :percentage="spaceItem.useRatio" style="width: 60%" />
                </div>
              </div>
              <!--              第二行-->
              <div style="display: flex; justify-self: flex-start; width: 100%">
                <div style="width: 60%">
                  <span v-if="spaceItem.mountStatus === 'MOUNTED'" style="color: #4caf50"
                    >已挂载</span
                  >
                  <span v-else style="color: #ec6f30">异常</span>
                </div>
                <div style="width: 40%">
                  <span style="color: #2b8dfa">{{ spaceItem.spaceSize }} </span>
                  <span>| {{ spaceItem.freeSize }}可用</span>
                </div>
              </div>
            </div>
            <div
              style="
                text-align: center;
                display: flex; /* 开启flex布局 */
                align-items: center; /* 垂直居中 */
                justify-content: center; /* 水平居中（可替代text-align: center） */
                width: 40px; /* 给容器设置宽高，避免容器被内容撑开（按需调整） */
                height: 40px; /* 建议设置，否则垂直居中效果不明显 */
                cursor: pointer; /* 鼠标悬浮显示手型，提升交互体验 */
              "
              @contextmenu.prevent="showMenu"
            >
              <el-icon style="font-size: 20px">
                <MoreFilled />
              </el-icon>
            </div>
          </div>
          <div style="background: #f4f6f9; padding: 5px">
            <div class="detail-item">
              <div class="detail-label">
                <span>文件系统:</span>
              </div>
              <div class="detail-value">
                <span>{{ spaceItem.fileSystem }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">
                <span>挂载点:</span>
              </div>
              <div class="detail-value">
                <span>{{ spaceItem.mountPath }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">
                <span>挂载状态:</span>
              </div>
              <div class="detail-value">
                <span>{{ spaceItem.mountStatus }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    <!-- 右键菜单组件 -->
    <ArtMenuRight
      ref="menuRef"
      :menu-items="menuItems"
      :menu-width="180"
      :submenu-width="140"
      :border-radius="10"
      @select="handleSelect"
      @show="onMenuShow"
      @hide="onMenuHide"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue'
  import { fetchGetStoragePoolList } from '@/api/system-manage'
  import { HealthStatus } from '@/enums/appEnum'
  import { Disk } from '@/typings/disk'
  import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
  import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
  import { MoreFilled } from '@element-plus/icons-vue'

  const storagePoolList = ref<Disk.Device.StoragePool[]>([])
  const getStoragePoolStatusImage = (status: string) => {
    if (status === HealthStatus.OK) {
      return new URL('/src/assets/img/storage/storage-pool-ok.png', import.meta.url).href
    } else if (status === HealthStatus.WARNING) {
      return new URL('/src/assets/img/storage/storage-pool-waring.png', import.meta.url).href
    } else {
      return new URL('/src/assets/img/storage/storage-pool-error.png', import.meta.url).href
    }
  }

  const getStorageSpaceStatusImage = (status: string) => {
    console.log(status)
    return new URL('/src/assets/img/svg/storage-space.svg', import.meta.url).href
  }

  onMounted(() => {
    console.log('存储空间页面挂载==>>')
    fetchGetStoragePoolList().then((res) => {
      if (res) {
        storagePoolList.value = res.records
      }
    })
  })

  interface User {
    date: string
    name: string
    address: string
  }

  const currentRow = ref()
  // const singleTableRef = ref<TableInstance>()

  // const setCurrent = (row?: User) => {
  //   singleTableRef.value!.setCurrentRow(row)
  // }
  const handleCurrentChange = (val: User | undefined) => {
    currentRow.value = val
  }

  const menuRef = ref<InstanceType<typeof ArtMenuRight>>()
  const lastAction = ref('')

  /**
   * 右键菜单选项配置
   */
  const menuItems = computed((): MenuItemType[] => [
    {
      key: 'copy',
      label: '复制',
      icon: '&#xe7b2;'
    },
    {
      key: 'paste',
      label: '粘贴',
      icon: '&#xe70b;'
    },
    {
      key: 'cut',
      label: '剪切',
      icon: '&#xe7b8;',
      showLine: true
    },
    {
      key: 'export',
      label: '导出选项',
      icon: '&#xe78b;',
      children: [
        {
          key: 'exportExcel',
          label: '导出 Excel',
          icon: '&#xe604;'
        },
        {
          key: 'exportPdf',
          label: '导出 PDF',
          icon: '&#xe89e;'
        }
      ]
    },
    {
      key: 'edit',
      label: '编辑选项',
      icon: '&#xe706;',
      children: [
        {
          key: 'rename',
          label: '重命名',
          icon: '&#xe607;'
        },
        {
          key: 'duplicate',
          label: '复制副本',
          icon: '&#xe608;'
        }
      ]
    },
    {
      key: 'share',
      label: '分享',
      icon: '&#xe73b;',
      showLine: true
    },
    {
      key: 'delete',
      label: '删除',
      icon: '&#xe850;'
    },
    {
      key: 'disabled',
      label: '禁用选项',
      icon: '&#xe619;',
      disabled: true
    }
  ])

  /**
   * 处理菜单项选择
   * @param item 选中的菜单项
   */
  const handleSelect = (item: MenuItemType) => {
    lastAction.value = `${item.label} (${item.key})`
    ElMessage.success(`执行操作: ${item.label}`)
    console.log('选择了菜单项:', item)
  }

  /**
   * 显示右键菜单
   * @param e 鼠标事件
   */
  const showMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    nextTick(() => {
      menuRef.value?.show(e)
    })
  }

  /**
   * 菜单显示回调
   */
  const onMenuShow = () => {
    console.log('菜单显示')
  }

  /**
   * 菜单隐藏回调
   */
  const onMenuHide = () => {
    console.log('菜单隐藏')
  }
</script>
<style scoped>
  .active-item {
    background-color: #5e91e2 !important;
  }

  .detail-item {
    display: flex;
    justify-self: flex-start;
    width: 100%;
  }

  /* 标签居左，固定宽度让内容对齐 */
  .detail-label {
    width: 40%;
    color: #666;
    flex-shrink: 0; /* 防止标签被压缩 */
  }

  .detail-value {
    width: 60%;
    color: #333;
  }

  /* 硬盘状态的样式（和示例一致） */
  .status-good {
    color: #4caf50;
    font-weight: 500;
  }

  .status-warning {
    color: #ec6f30;
    font-weight: 500;
  }

  .status-bad {
    color: #e80536;
    font-weight: 500;
  }
</style>
