<!-- 系统管理 - 门户设置（登录页背景、标题、标语、标识） -->
<template>
  <div class="portal-page art-full-height">
    <ElCard class="portal-card" shadow="never">
      <div class="portal-inner">
        <header class="portal-head">
          <div>
            <h2 class="portal-head__title">门户设置</h2>
            <p class="portal-head__desc">
              自定义登录页面的背景图、站点名称、标题与宣传标语，保存后立即对访问者生效。
            </p>
          </div>
          <div class="portal-head__actions">
            <button type="button" class="dsm-btn" @click="previewVisible = true">预览</button>
            <button type="button" class="dsm-btn dsm-btn--primary" @click="openEditor">编辑</button>
          </div>
        </header>

        <!-- 登录样式 -->
        <DsmSection title="登录样式">
          <div class="dsm-media-row">
            <div class="dsm-thumb">
              <div v-if="portalStore.hasBackground" class="dsm-thumb__img" :style="thumbStyle"></div>
              <div v-else class="dsm-thumb__empty">默认</div>
              <span class="dsm-thumb__badge">
                <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                  <rect
                    x="1.6"
                    y="2.6"
                    width="12.8"
                    height="8.8"
                    rx="1.2"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.3"
                  />
                  <path
                    d="M6 14h4"
                    stroke="currentColor"
                    stroke-width="1.3"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </div>

            <div class="dsm-media-row__main">
              <div class="dsm-media-row__actions">
                <button type="button" class="dsm-btn" @click="openEditor">编辑</button>
              </div>
              <p class="dsm-hint">
                <template v-if="portalStore.hasBackground">
                  背景图已启用 · {{ backgroundSourceText }} · {{ fitLabel }}
                </template>
                <template v-else>当前使用系统默认登录样式</template>
              </p>
            </div>
          </div>
        </DsmSection>

        <!-- 登录页面信息 -->
        <DsmSection title="登录页面信息">
          <div class="dsm-row">
            <span class="dsm-row__label">站点名称：</span>
            <span class="dsm-row__value" :class="{ 'is-muted': !settings.siteName }">
              {{ siteNameText }}
              <span class="dsm-row__extra">
                {{ siteNameThemeName }} · 字号 {{ siteNameSize }} px
              </span>
            </span>
          </div>
          <div class="dsm-row">
            <span class="dsm-row__label">登录页面标题：</span>
            <span class="dsm-row__value" :class="{ 'is-muted': !settings.title }">
              {{ settings.title || '未设置，使用系统默认标题' }}
              <span class="dsm-row__extra">字号 {{ titleSize }} px</span>
            </span>
          </div>
          <div class="dsm-row">
            <span class="dsm-row__label">宣传标语：</span>
            <span class="dsm-row__value" :class="{ 'is-muted': !settings.slogan }">
              {{ settings.slogan || '未设置' }}
            </span>
          </div>
        </DsmSection>

        <!-- 其他 -->
        <DsmSection title="其他">
          <div class="dsm-row">
            <span class="dsm-row__label">恢复默认：</span>
            <div class="dsm-row__control">
              <button type="button" class="dsm-btn" :disabled="resetting" @click="handleReset">
                {{ resetting ? '恢复中…' : '恢复默认样式' }}
              </button>
              <span class="dsm-hint">清除自定义背景、站点名称及其艺术字样式、标题与标语</span>
            </div>
          </div>
          <div class="dsm-row">
            <span class="dsm-row__label">提示：</span>
            <span class="dsm-row__value is-muted">
              背景图片建议使用 16:9、1920 × 1080 及以上的横向图片；标语支持多行，建议不超过 3 行。
            </span>
          </div>
        </DsmSection>
      </div>
    </ElCard>

    <!-- 编辑弹窗 -->
    <PortalSettingDialog v-model="dialogVisible" />

    <!-- 登录页预览 -->
    <LoginPreviewDialog v-model="previewVisible" />
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { usePortalStore } from '@/store/modules/portal'
  import {
    getPortalPreset,
    normalizeSiteNameSize,
    normalizeSiteNameTheme,
    normalizeTitleSize,
    portalBackgroundFitOptions,
    portalSiteNameThemes,
    resolvePortalSiteName
  } from '@/config/portal'
  import { HttpError } from '@/utils/http/error'
  import DsmSection from './modules/dsm-section.vue'
  import PortalSettingDialog from './modules/portal-setting-dialog.vue'
  import LoginPreviewDialog from './modules/login-preview-dialog.vue'

  defineOptions({ name: 'PortalSetting' })

  const portalStore = usePortalStore()
  const dialogVisible = ref(false)
  const previewVisible = ref(false)
  const resetting = ref(false)

  const settings = computed(() => portalStore.settings)

  /** 缩略图样式 */
  const thumbStyle = computed(() => (portalStore.hasBackground ? portalStore.backgroundStyle : {}))

  /** 左上角站点名称（未自定义时显示系统名称） */
  const siteNameText = computed(() =>
    resolvePortalSiteName(settings.value, AppConfig.systemInfo.name)
  )

  /** 标题字号 */
  const titleSize = computed(() => normalizeTitleSize(settings.value.titleSize))

  /** 站点名称艺术字模板名称 */
  const siteNameThemeName = computed(() => {
    const key = normalizeSiteNameTheme(settings.value.siteNameTheme)
    return portalSiteNameThemes.find((item) => item.key === key)?.name ?? '经典手写'
  })

  /** 站点名称字号 */
  const siteNameSize = computed(() => normalizeSiteNameSize(settings.value.siteNameSize))

  /** 背景来源文案 */
  const backgroundSourceText = computed(() => {
    const { source, preset } = settings.value.background
    if (source === 'custom') return '自定义图片'
    return getPortalPreset(preset)?.name ?? '内置图像'
  })

  /** 填充方式文案 */
  const fitLabel = computed(
    () =>
      portalBackgroundFitOptions.find((item) => item.value === settings.value.background.fit)
        ?.label ?? '填充'
  )

  /** 打开编辑弹窗 */
  const openEditor = () => {
    dialogVisible.value = true
  }

  /** 恢复默认 */
  const handleReset = async () => {
    try {
      await ElMessageBox.confirm(
        '恢复默认后，登录页将恢复系统默认样式，自定义背景、站点名称及其艺术字样式、标题与标语都会被清除，是否继续？',
        '恢复默认样式',
        {
          confirmButtonText: '恢复默认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }

    resetting.value = true
    try {
      await portalStore.resetSettings()
      ElMessage.success('已恢复默认样式')
    } catch (error) {
      if (!(error instanceof HttpError)) {
        ElMessage.error(error instanceof Error ? error.message : '恢复默认失败，请重试')
      }
    } finally {
      resetting.value = false
    }
  }

  /** 进入页面时从服务端拉取最新配置 */
  onMounted(() => {
    portalStore.refreshSettings()
  })
</script>

<style lang="scss">
  @use './style';
</style>
