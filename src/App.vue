<template>
  <ElConfigProvider size="default" :locale="locales[language]" :z-index="3000">
    <RouterView></RouterView>
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import { useUserStore } from './store/modules/user'
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import en from 'element-plus/es/locale/lang/en'
  import { systemUpgrade } from './utils/sys'

  import { setThemeTransitionClass } from './utils/theme/animation'
  import { checkStorageCompatibility } from './utils/storage'
  import { websocketStore } from '@/store/modules/websocket'

  const userStore = useUserStore()
  const { language } = storeToRefs(userStore)
  const ws = websocketStore()
  const locales = {
    zh: zh,
    en: en
  }

  onBeforeMount(() => {
    setThemeTransitionClass(true)
  })

  onMounted(() => {
    // 检查存储兼容性
    checkStorageCompatibility()
    ws.initGlobalWS()
    // 提升暗黑主题下页面刷新视觉体验
    setThemeTransitionClass(false)
    // 系统升级
    systemUpgrade()
  })
</script>
