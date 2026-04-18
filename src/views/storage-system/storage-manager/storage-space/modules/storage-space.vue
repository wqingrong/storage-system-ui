<template>
  <div class="demo-collapse">
    <el-collapse v-for="item in storagePoolList" :key="item.poolName">
      <el-collapse-item name="1">
        <template #title>
          <div style="display: flex; flex-direction: row; align-items: center">
            <img
              style="width: 50px; height: 50px; margin-left: 10px; margin-right: 10px"
              :src="getStoragePoolStatus(item.poolStatus).imageUrl"
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
                  <span :style="{ color: getStoragePoolStatus(item.poolStatus).color }">{{
                    getStoragePoolStatus(item.poolStatus).statusTxt
                  }}</span>
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
              @click.stop="showMenu($event, 'storagePool', item)"
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
              <span>{{ item.raidDetailInfo.chunkSize }}</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">
              <span>卷组名称:</span>
            </div>
            <div class="detail-value">
              <span> {{ item.vgName }}</span>
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
              <el-table-column property="healthStatus" label="健康状态" />
              <el-table-column property="diskStatus" label="硬盘状态" />
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
              @click.stop="showMenu($event, 'storageSpace', spaceItem)"
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
            <div v-if="spaceItem.fileSystem === 'ZFS'" class="detail-item">
              <div class="detail-label">
                <span>数据集:</span>
              </div>
              <div class="detail-value">
                <span>{{ spaceItem.volumeName }}</span>
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
  import { computed, nextTick, ref, defineExpose } from 'vue'
  import {
    fetchDestroyStorageSpace,
    fetchGetStoragePoolList,
    fetchMountStorageSpace,
    fetchUmountStorageSpace
  } from '@/api/system-manage'
  import { Disk } from '@/typings/disk'
  import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
  import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
  import { MoreFilled } from '@element-plus/icons-vue'
  import {
    fetchDestroySoftRaid,
    fetchDestroyZPool,
    fetchImportZPool,
    fetchReloadSoftRaid,
    fetchStopSoftRaid,
    fetchStopZPool
  } from '@/api/storage-service'
  import { Api } from '@/typings/api'
  import { getStoragePoolStatus } from '@utils/tools'

  const storagePoolList = ref<Disk.Device.StoragePool[]>([])

  const getStorageSpaceStatusImage = (status: string) => {
    if (status) {
      return new URL('/src/assets/img/svg/storage-space.svg', import.meta.url).href
    }
  }

  onMounted(() => {
    refreshStorageSpaceData()
  })
  const refreshStorageSpaceData = () => {
    fetchGetStoragePoolList().then((res) => {
      if (res) {
        storagePoolList.value = res.records
      }
    })
  }

  defineExpose({
    refreshStorageSpaceData
  })

  interface User {
    date: string
    name: string
    address: string
  }

  const currentRow = ref()
  const handleCurrentChange = (val: User | undefined) => {
    currentRow.value = val
  }

  const menuRef = ref<InstanceType<typeof ArtMenuRight>>()
  const lastAction = ref('')
  const menuContainer = ref('')
  const menuItemData = ref<Disk.Device.StoragePool>({} as Disk.Device.StoragePool)
  /**
   * 右键菜单选项配置
   */
  const menuItems = computed((): MenuItemType[] => {
    if (menuContainer.value === 'storagePool') {
      return [
        {
          key: 'raid_mount',
          label: 'raid挂载',
          icon: '&#xe67a;'
        },
        {
          key: 'raid_umount',
          label: 'raid卸载',
          icon: '&#xe701;'
        },
        {
          key: 'raid_destroy',
          label: 'raid销毁',
          icon: '&#xe6d4;',
          showLine: true
        }
      ]
    } else if (menuContainer.value === 'storageSpace') {
      return [
        {
          key: 'space_mount',
          label: '存储空间挂载',
          icon: '&#xe67a;'
        },
        {
          key: 'space_umount',
          label: '存储空间卸载',
          icon: '&#xe701;'
        },
        {
          key: 'space_destroy',
          label: '存储空间销毁',
          icon: '&#xe6d4;',
          showLine: true
        }
      ]
    } else {
      return []
    }
  })

  /**
   * 处理菜单项选择
   * @param item 选中的菜单项
   */
  const handleSelect = (item: MenuItemType) => {
    lastAction.value = `${item.label} (${item.key})`
    if (menuItemData.value) {
      switch (item.key) {
        case 'raid_mount':
          if (menuItemData.value.poolType === 'ZFS') {
            let dto: Api.Dto.ImportZPoolDto = {
              UUID: menuItemData.value.UUID,
              poolName: menuItemData.value.poolName,
              devicePath: menuItemData.value.vgName
            }
            fetchImportZPool(dto).then(() => {
              refreshStorageSpaceData()
            })
          } else {
            let dto: Api.Dto.ReloadSoftRaidDto = {
              UUID: menuItemData.value.raidDetailInfo.UUID,
              devicePath: menuItemData.value.raidDetailInfo.devicePath,
              diskDeviceList: menuItemData.value.raidDetailInfo.diskDeviceList
            }
            fetchReloadSoftRaid(dto).then(() => {
              refreshStorageSpaceData()
            })
          }
          break
        case 'raid_umount':
          if (menuItemData.value.poolType === 'ZFS') {
            let dto: Api.Dto.StopZPool = {
              UUID: menuItemData.value.UUID,
              poolName: menuItemData.value.poolName,
              devicePath: menuItemData.value.vgName
            }
            fetchStopZPool(dto).then(() => {
              refreshStorageSpaceData()
            })
          } else {
            let dto: Api.Dto.StopSoftRaidDto = {
              UUID: menuItemData.value.raidDetailInfo.UUID,
              devicePath: menuItemData.value.raidDetailInfo.devicePath
            }
            fetchStopSoftRaid(dto).then(() => {
              refreshStorageSpaceData()
            })
          }
          break
        case 'raid_destroy':
          if (menuItemData.value.poolType === 'ZFS') {
            let dto: Api.Dto.DestroyZPool = {
              UUID: menuItemData.value.UUID,
              poolName: menuItemData.value.poolName,
              devicePath: menuItemData.value.vgName
            }
            fetchDestroyZPool(dto).then(() => {
              refreshStorageSpaceData()
            })
          } else {
            let dto: Api.Dto.DestroySoftRaidDto = {
              UUID: menuItemData.value.raidDetailInfo.UUID,
              devicePath: menuItemData.value.raidDetailInfo.devicePath,
              diskDeviceList: menuItemData.value.raidDetailInfo.diskDeviceList
            }
            fetchDestroySoftRaid(dto).then(() => {
              refreshStorageSpaceData()
            })
          }
          break
        case 'space_mount':
          storageSpaceMount(menuItemData.value)
          break
        case 'space_umount':
          storageSpaceUmount(menuItemData.value)
          break
        case 'space_destroy':
          destroyStorageSpace(menuItemData.value)
          break
        default:
          break
      }
    }
  }

  //  存储空间的挂载
  const storageSpaceMount = (menuItemData: any) => {
    const mountDto = ref<Api.Dto.MountStorageSpaceDto>({
      fileSystem: menuItemData.fileSystem,
      vgName: menuItemData?.vgName,
      volumeName: menuItemData?.volumeName
    })
    fetchMountStorageSpace(mountDto.value)
      .then((res) => {
        console.log(res)
      })
      .finally(() => {
        refreshStorageSpaceData()
      })
  }

  // 存储空间的卸载
  const storageSpaceUmount = (menuItemData: any) => {
    const mountDto = ref<Api.Dto.UmountStorageSpaceDto>({
      fileSystem: menuItemData.fileSystem,
      vgName: menuItemData?.vgName,
      volumeName: menuItemData?.volumeName
    })
    fetchUmountStorageSpace(mountDto.value)
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        refreshStorageSpaceData()
      })
  }
  // 存储空间的卸载
  const destroyStorageSpace = (menuItemData: any) => {
    const paramsDto = ref<Api.Dto.DestroyStorageSpace>({
      fileSystem: menuItemData.fileSystem,
      vgName: menuItemData?.vgName,
      volumeName: menuItemData?.volumeName
    })
    fetchDestroyStorageSpace(paramsDto.value)
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        refreshStorageSpaceData()
      })
  }

  /**
   * 显示右键菜单
   * @param e 鼠标事件
   * @param container
   * @param itemData
   */
  const showMenu = (e: MouseEvent, container: string, itemData: any) => {
    e.preventDefault()
    e.stopPropagation()
    menuItemData.value = itemData
    menuContainer.value = container
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
