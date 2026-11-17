import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PortalSettings } from '@/types/portal'
import {
  createDefaultPortalSettings,
  getPortalBackgroundStyle,
  normalizePortalSettings,
  resolvePortalBackgroundImage
} from '@/config/portal'
import { fetchGetPortalSettings, fetchSavePortalSettings } from '@/api/portal'

/**
 * 门户设置（登录页外观）
 * 数据以服务端 config/login_home/settings.json 为准，本地仅做首屏缓存
 */
export const usePortalStore = defineStore(
  'portalStore',
  () => {
    const settings = ref<PortalSettings>(createDefaultPortalSettings())
    /** 是否已从服务端同步过配置 */
    const loaded = ref(false)
    /** 是否正在请求 */
    const loading = ref(false)
    /** 请求锁，避免多个页面同时初始化时重复请求 */
    let pending: Promise<void> | null = null

    /** 当前生效的背景图地址 */
    const backgroundImage = computed(() => resolvePortalBackgroundImage(settings.value))

    /** 是否已配置背景图 */
    const hasBackground = computed(() => !!backgroundImage.value)

    /** 背景样式（整页背景） */
    const backgroundStyle = computed(() => getPortalBackgroundStyle(settings.value))

    /**
     * 从服务端加载门户设置
     * @param silent 静默模式：请求失败不提示（登录页使用，失败时保留默认样式）
     */
    const loadSettings = (silent = true): Promise<void> => {
      if (pending) return pending

      loading.value = true
      pending = fetchGetPortalSettings(silent)
        .then((data) => {
          settings.value = normalizePortalSettings(data)
          loaded.value = true
        })
        .catch(() => {
          // 接口异常时保留本地缓存/默认配置，登录页不会因此白屏
        })
        .finally(() => {
          loading.value = false
          pending = null
        })

      return pending
    }

    /** 登录页等入口调用：只加载一次 */
    const ensureLoaded = (): Promise<void> => {
      if (loaded.value) return Promise.resolve()
      return loadSettings(true)
    }

    /** 设置页调用：强制刷新 */
    const refreshSettings = () => loadSettings(false)

    /** 保存设置到服务端 */
    const saveSettings = async (next: PortalSettings): Promise<PortalSettings> => {
      const saved = await fetchSavePortalSettings(next)
      settings.value = normalizePortalSettings(saved ?? next)
      loaded.value = true
      return settings.value
    }

    /** 恢复默认样式（同时清空服务端配置） */
    const resetSettings = () => saveSettings(createDefaultPortalSettings())

    return {
      settings,
      loaded,
      loading,
      backgroundImage,
      backgroundStyle,
      hasBackground,
      loadSettings,
      ensureLoaded,
      refreshSettings,
      saveSettings,
      resetSettings
    }
  },
  {
    // 仅缓存已保存的配置用于首屏渲染，进入登录页后仍会从服务端刷新
    persist: {
      key: 'portal',
      storage: localStorage,
      pick: ['settings']
    }
  }
)
