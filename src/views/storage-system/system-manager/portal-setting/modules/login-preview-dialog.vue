<!-- 门户设置 - 登录页效果预览 -->
<template>
  <ElDialog
    v-model="visible"
    title="登录页预览"
    width="900px"
    class="portal-preview-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="pv-stage" :class="{ 'has-image': !!backgroundImage }" :style="bgStyle">
      <!-- 左上角站点名称（艺术字模板 + 按预览比例缩放） -->
      <div class="pv-brand" :style="[siteNameStyle, siteNameSizeStyle]">{{ siteName }}</div>

      <!-- 标题与标语 -->
      <div class="pv-text">
        <h3 :style="titleStyle">{{ titleText }}</h3>
        <p v-if="sloganText">{{ sloganText }}</p>
      </div>

      <!-- 右侧半透明悬浮登录卡片 -->
      <div class="pv-card">
        <div class="pv-form-title">{{ $t('login.title') }}</div>
        <div class="pv-form-sub">{{ $t('login.subTitle') }}</div>
        <div class="pv-field"></div>
        <div class="pv-field"></div>
        <div class="pv-slider">{{ $t('login.sliderText') }}</div>
        <div class="pv-submit">{{ $t('login.btnText') }}</div>
      </div>
    </div>

    <p class="pv-plain-tip">
      预览为效果示意：背景图铺满整页，登录表单为半透明卡片悬浮在右侧；小屏幕下自动隐藏左侧文字。
    </p>

    <template #footer>
      <div class="portal-dialog__footer">
        <button type="button" class="dsm-pill" @click="visible = false">关闭</button>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useI18n } from 'vue-i18n'
  import { usePortalStore } from '@/store/modules/portal'
  import type { PortalSettings } from '@/types/portal'
  import {
    getPortalBackgroundStyle,
    getPortalSiteNameSizeStyle,
    getPortalSiteNameStyle,
    getPortalTitleStyle,
    resolvePortalBackgroundImage,
    resolvePortalSiteName
  } from '@/config/portal'

  /** 预览区相对真实登录页的缩放比（舞台 900×420 约为整页的一半） */
  const PREVIEW_SCALE = 0.5

  defineOptions({ name: 'LoginPreviewDialog' })

  const props = defineProps<{
    modelValue: boolean
    /** 传入待预览的配置，不传则使用已保存的配置 */
    settings?: PortalSettings | null
  }>()

  const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

  const { t } = useI18n()
  const portalStore = usePortalStore()

  const visible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
  })

  const source = computed<PortalSettings>(() => props.settings ?? portalStore.settings)

  const backgroundImage = computed(() => resolvePortalBackgroundImage(source.value))
  const bgStyle = computed(() => getPortalBackgroundStyle(source.value))
  const titleStyle = computed(() => getPortalTitleStyle(source.value))

  const siteName = computed(() => resolvePortalSiteName(source.value, AppConfig.systemInfo.name))
  /** 站点名称艺术字：与登录页使用同一套模板，配色随是否有背景图切换 */
  const siteNameStyle = computed(() =>
    getPortalSiteNameStyle(source.value, { onImage: !!backgroundImage.value })
  )
  const siteNameSizeStyle = computed(() =>
    getPortalSiteNameSizeStyle(source.value, PREVIEW_SCALE)
  )
  const titleText = computed(() => source.value.title || t('login.leftView.title'))
  const sloganText = computed(() => source.value.slogan || t('login.leftView.subTitle'))
</script>
