<!-- 门户设置 - 登录样式编辑弹窗（参考群晖 DSM「登录样式」弹窗） -->
<template>
  <ElDialog
    v-model="visible"
    title="登录样式"
    width="640px"
    class="portal-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <!-- 标题和背景 -->
    <DsmSection title="标题和背景" dashed>
      <div class="dsm-field">
        <span class="dsm-field__label">站点名称：</span>
        <div class="dsm-field__control">
          <ElInput
            v-model="form.siteName"
            class="dsm-input"
            maxlength="40"
            clearable
            placeholder="显示在登录页左上角，留空使用系统名称"
          />
          <p class="dsm-media__tip">左上角只显示文字，字体与效果在下方「艺术字模板」中选择。</p>
        </div>
      </div>

      <div class="dsm-field">
        <span class="dsm-field__label">艺术字模板：</span>
        <div class="dsm-field__control">
          <div class="pn-themes">
            <button
              v-for="theme in portalSiteNameThemes"
              :key="theme.key"
              type="button"
              class="pn-theme"
              :class="{ 'is-active': form.siteNameTheme === theme.key }"
              :title="theme.desc"
              @click="form.siteNameTheme = theme.key"
            >
              <span class="pn-theme__demo" :style="getThemeDemoStyle(theme.key)">
                {{ themeDemoText }}
              </span>
              <span class="pn-theme__name">{{ theme.name }}</span>
            </button>
          </div>
          <p class="dsm-media__tip">
            登录页左上角站点名称使用的字体与艺术效果，共 {{ portalSiteNameThemes.length }}
            套；配色会自动适配是否启用背景图。
          </p>
        </div>
      </div>

      <div class="dsm-field">
        <span class="dsm-field__label">名称字号：</span>
        <div class="dsm-field__control dsm-field__control--inline">
          <ElSelect v-model="form.siteNameSize" class="dsm-title-size" size="small">
            <ElOption
              v-for="size in portalSiteNameSizeOptions"
              :key="size"
              :label="`${size} px`"
              :value="size"
            />
          </ElSelect>
          <span class="pn-size-preview" :style="siteSizePreviewStyle">
            {{ themeDemoText }}
          </span>
        </div>
      </div>

      <div class="dsm-field">
        <span class="dsm-field__label">登录页面标题：</span>
        <div class="dsm-field__control">
          <ElInput
            v-model="form.title"
            class="dsm-input"
            maxlength="40"
            clearable
            placeholder="请输入登录页面标题"
          />
        </div>
      </div>

      <div class="dsm-field">
        <span class="dsm-field__label">标题字号：</span>
        <div class="dsm-field__control dsm-field__control--inline">
          <ElSelect v-model="form.titleSize" class="dsm-title-size" size="small">
            <ElOption
              v-for="size in portalTitleSizeOptions"
              :key="size"
              :label="`${size} px`"
              :value="size"
            />
          </ElSelect>
          <span class="dsm-title-size__preview" :style="titlePreviewStyle">
            {{ form.title || '标题预览' }}
          </span>
        </div>
      </div>

      <div class="dsm-block">
        <div class="dsm-block__check">
          <ElCheckbox v-model="form.background.enabled">背景</ElCheckbox>
        </div>

        <div class="dsm-block__content" :class="{ 'is-disabled': !form.background.enabled }">
          <div class="dsm-media__preview" @click="pickImage">
            <div
              v-if="bgPreviewStyle.backgroundImage"
              class="dsm-media__imgs"
              :style="bgPreviewStyle"
            ></div>
            <div v-else class="dsm-media__imgs dsm-media__placeholder">点击选择图片</div>
            <div class="dsm-media__mask">更换图片</div>
          </div>

          <div class="dsm-media__side">
            <ElSelect v-model="bgImageModel" class="dsm-media__select" size="small">
              <ElOption
                v-for="preset in portalBackgroundPresets"
                :key="preset.key"
                :label="preset.name"
                :value="preset.key"
              />
              <ElOption label="自定义图片" value="custom" />
            </ElSelect>

            <button type="button" class="dsm-btn" @click="pickImage">选择图片</button>

            <ElSelect v-model="form.background.fit" class="dsm-media__select" size="small">
              <ElOption
                v-for="item in portalBackgroundFitOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>

            <p class="dsm-media__tip">建议 16:9 横向图片，2 MB 以内；整页铺满，登录表单以半透明卡片悬浮其上</p>
          </div>
        </div>
      </div>
    </DsmSection>

    <!-- 宣传标语 -->
    <DsmSection title="宣传标语" dashed>
      <div class="dsm-field">
        <span class="dsm-field__label">标语内容：</span>
        <div class="dsm-field__control">
          <ElInput
            v-model="form.slogan"
            class="dsm-input is-textarea"
            type="textarea"
            :rows="3"
            maxlength="80"
            show-word-limit
            placeholder="例如：安全、稳定、可扩展的企业级存储平台"
          />
          <p class="dsm-media__tip">显示在登录页标题下方，支持换行。</p>
        </div>
      </div>
    </DsmSection>

    <!-- 信息 -->
    <DsmSection title="信息" dashed>
      <p class="dsm-note">
        保存后立即生效，所有访问者打开登录页即可看到新的名称、标题、背景与标语。图片会等比压缩后上传到服务器的
        config/login_home 目录，名称、样式模板、字号、标题与标语以 JSON 形式保存在同一目录下。
      </p>
    </DsmSection>

    <!-- 隐藏的文件选择 -->
    <input
      ref="fileRef"
      class="portal-file-input"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
      @change="handleFileChange"
    />

    <template #footer>
      <div class="portal-dialog__footer">
        <button type="button" class="dsm-pill" :disabled="saving" @click="previewVisible = true">
          预览
        </button>
        <button type="button" class="dsm-pill" :disabled="saving" @click="visible = false">
          取消
        </button>
        <button
          type="button"
          class="dsm-pill dsm-pill--primary"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </template>
  </ElDialog>

  <!-- 预览当前编辑中的效果 -->
  <LoginPreviewDialog v-model="previewVisible" :settings="form" />
</template>

<script setup lang="ts">
  import type { CSSProperties } from 'vue'
  import type { PortalSettings, PortalSiteNameTheme } from '@/types/portal'
  import AppConfig from '@/config'
  import { usePortalStore } from '@/store/modules/portal'
  import { fetchUploadPortalImage } from '@/api/portal'
  import { HttpError } from '@/utils/http/error'
  import {
    createDefaultPortalSettings,
    getPortalPreset,
    getPortalSiteNameStyle,
    normalizeSiteNameSize,
    normalizeTitleSize,
    portalBackgroundFitOptions,
    portalBackgroundPresets,
    portalSiteNameSizeOptions,
    portalSiteNameThemes,
    portalTitleSizeOptions
  } from '@/config/portal'
  import { BACKGROUND_IMAGE_OPTIONS, processImageFile } from './image'
  import DsmSection from './dsm-section.vue'
  import LoginPreviewDialog from './login-preview-dialog.vue'

  defineOptions({ name: 'PortalSettingDialog' })

  const props = defineProps<{ modelValue: boolean }>()
  const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()

  const portalStore = usePortalStore()

  const visible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
  })

  const previewVisible = ref(false)
  const fileRef = ref<HTMLInputElement>()
  /** 保存中（含图片上传） */
  const saving = ref(false)

  /** dataURL 的 MIME 与后端允许的扩展名映射 */
  const MIME_EXT_MAP: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  }

  /** 编辑中的表单（深拷贝，取消不影响已保存配置） */
  const form = ref<PortalSettings>(createDefaultPortalSettings())

  /** 打开弹窗时同步已保存配置 */
  watch(
    visible,
    (value) => {
      if (!value) return
      form.value = JSON.parse(JSON.stringify(portalStore.settings)) as PortalSettings
    },
    { immediate: true }
  )

  /** 背景图选择项：预设标识或 custom */
  const bgImageModel = computed({
    get: () => (form.value.background.source === 'custom' ? 'custom' : form.value.background.preset),
    set: (value: string) => {
      if (value === 'custom') {
        form.value.background.source = 'custom'
        if (!form.value.background.image) {
          pickImage()
        }
        return
      }
      form.value.background.source = 'preset'
      form.value.background.preset = value
      form.value.background.enabled = true
    }
  })

  /** 背景缩略图样式（缩略图统一按填充展示） */
  const bgPreviewStyle = computed(() => {
    const { source, preset, image } = form.value.background
    const src = source === 'custom' ? image : (getPortalPreset(preset)?.image ?? '')
    return src ? { backgroundImage: `url("${src}")` } : {}
  })

  /** 字号预览样式 */
  const titlePreviewStyle = computed<CSSProperties>(() => ({
    fontSize: `${normalizeTitleSize(form.value.titleSize)}px`
  }))

  /** 模板卡片示例文字：优先使用当前填写的站点名称 */
  const themeDemoText = computed(() => {
    const name = form.value.siteName.trim() || AppConfig.systemInfo.name
    return name.length > 14 ? `${name.slice(0, 14)}…` : name
  })

  /** 模板卡片用浅色主题配色，字号固定，保证不同模板之间可对比 */
  const getThemeDemoStyle = (key: PortalSiteNameTheme) => getPortalSiteNameStyle({ siteNameTheme: key })

  /** 名称字号实时预览：套用当前选中的模板 */
  const siteSizePreviewStyle = computed<CSSProperties>(() => ({
    ...getPortalSiteNameStyle({ siteNameTheme: form.value.siteNameTheme }),
    fontSize: `${normalizeSiteNameSize(form.value.siteNameSize)}px`
  }))

  /** 触发文件选择 */
  const pickImage = () => {
    fileRef.value?.click()
  }

  /** 处理图片选择 */
  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // 允许重复选择同一张图片
    input.value = ''
    if (!file) return

    try {
      form.value.background.image = await processImageFile(file, BACKGROUND_IMAGE_OPTIONS)
      form.value.background.source = 'custom'
      form.value.background.enabled = true
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '图片处理失败，请重试')
    }
  }

  /** 将压缩后的 dataURL 还原为文件，供上传使用 */
  const dataUrlToFile = (dataUrl: string): File => {
    const [meta, base64] = dataUrl.split(',')
    const mime = /:(.*?);/.exec(meta ?? '')?.[1] ?? 'image/png'
    const ext = MIME_EXT_MAP[mime] ?? 'png'

    const binary = atob(base64 ?? '')
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new File([bytes], `background.${ext}`, { type: mime })
  }

  /** 未上传过的本地图片（dataURL）先上传到服务器，返回可访问地址 */
  const uploadLocalImage = async (value: string) => {
    if (!value.startsWith('data:')) return value
    const result = await fetchUploadPortalImage(dataUrlToFile(value))
    return result.url
  }

  /** 保存 */
  const handleSave = async () => {
    const { background } = form.value

    if (background.enabled && background.source === 'custom' && !background.image) {
      ElMessage.warning('请先选择自定义背景图片')
      return
    }

    const payload: PortalSettings = {
      ...form.value,
      siteName: form.value.siteName.trim(),
      siteNameSize: normalizeSiteNameSize(form.value.siteNameSize),
      title: form.value.title.trim(),
      titleSize: normalizeTitleSize(form.value.titleSize),
      slogan: form.value.slogan.trim(),
      background: { ...background }
    }

    saving.value = true
    try {
      // 自定义背景图：本地压缩后的 dataURL 先上传，拿到服务器地址再保存配置
      if (payload.background.enabled && payload.background.source === 'custom') {
        payload.background.image = await uploadLocalImage(payload.background.image)
      }

      await portalStore.saveSettings(payload)
      ElMessage.success('登录样式已保存')
      emit('saved')
      visible.value = false
    } catch (error) {
      // 接口错误已由请求层统一提示，这里只兜底图片处理异常
      if (!(error instanceof HttpError)) {
        ElMessage.error(error instanceof Error ? error.message : '保存失败，请重试')
      }
    } finally {
      saving.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .portal-file-input {
    display: none;
  }

  .dsm-media__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--art-text-gray-400);
  }

  .dsm-block__content.is-disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  :deep(.is-textarea .el-textarea__inner) {
    font-size: 13px;
    line-height: 1.7;
  }
</style>
