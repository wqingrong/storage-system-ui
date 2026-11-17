/**
 * 门户设置 - 内置资源、选项与样式计算
 */
import type { CSSProperties } from 'vue'
import type {
  PortalBackgroundFit,
  PortalPreset,
  PortalSettings,
  PortalSiteNameTheme,
  PortalSiteNameThemeOption
} from '@/types/portal'
import presetAurora from '@imgs/cover/img2.webp'
import presetSunset from '@imgs/cover/img1.webp'
import presetViolet from '@imgs/cover/img5.webp'
import presetPeach from '@imgs/cover/img9.webp'

/** 内置登录页背景图 */
export const portalBackgroundPresets: PortalPreset[] = [
  { key: 'aurora', name: '极光', image: presetAurora },
  { key: 'sunset', name: '暖阳', image: presetSunset },
  { key: 'violet', name: '紫霞', image: presetViolet },
  { key: 'peach', name: '蜜桃', image: presetPeach }
]

/** 背景填充方式选项 */
export const portalBackgroundFitOptions: Array<{ value: PortalBackgroundFit; label: string }> = [
  { value: 'cover', label: '填充' },
  { value: 'contain', label: '适应' },
  { value: 'tile', label: '平铺' },
  { value: 'center', label: '居中' }
]

/** 默认背景预设 */
export const DEFAULT_PORTAL_PRESET = 'aurora'

/** 标题字号可选值（px） */
export const portalTitleSizeOptions: number[] = [18, 20, 22, 24, 28, 32, 36, 40]

/** 默认标题字号（px） */
export const DEFAULT_PORTAL_TITLE_SIZE = 24

/** 标题字号允许范围（px） */
const TITLE_SIZE_MIN = 12
const TITLE_SIZE_MAX = 72

/* -------------------- 站点名称艺术字 -------------------- */

/** 站点名称字号可选值（px） */
export const portalSiteNameSizeOptions: number[] = [20, 24, 28, 30, 34, 38, 44, 50]

/** 默认站点名称字号（px） */
export const DEFAULT_PORTAL_SITE_NAME_SIZE = 30

/** 站点名称字号允许范围（px） */
const SITE_NAME_SIZE_MIN = 16
const SITE_NAME_SIZE_MAX = 56

/** 默认艺术字模板 */
export const DEFAULT_PORTAL_SITE_NAME_THEME: PortalSiteNameTheme = 'classic'

/** 艺术字表现手法 */
type SiteNameEffect =
  | 'gradient'
  | 'metal'
  | 'neon'
  | 'outline'
  | 'solid'
  | 'sticker'
  | 'brush'

/** 实色类模板的色调 */
type SiteNameTone = 'primary' | 'ink'

interface SiteNameThemeDef {
  /** 显示名称 */
  name: string
  /** 风格说明 */
  desc: string
  fontFamily: string
  fontWeight: CSSProperties['fontWeight']
  letterSpacing: string
  textTransform?: CSSProperties['textTransform']
  effect: SiteNameEffect
  tone?: SiteNameTone
}

/**
 * 艺术字模板：字体 + 效果
 * 颜色统一走 CSS 变量，浅色主题与图片背景（onImage）分别取值
 */
const SITE_NAME_THEME_DEFS: Record<PortalSiteNameTheme, SiteNameThemeDef> = {
  classic: {
    name: '经典手写',
    desc: '优雅手写体，英文站点名首选',
    fontFamily:
      "'Monotype Corsiva', 'Segoe Script', 'Snell Roundhand', '华文行楷', STXingkai, 'Brush Script MT', KaiTi, '楷体', cursive",
    fontWeight: 700,
    letterSpacing: '1px',
    effect: 'gradient'
  },
  metal: {
    name: '金属立体',
    desc: '冷色金属光泽，商务稳重',
    fontFamily: "'Trebuchet MS', 'Segoe UI', system-ui, '微软雅黑', sans-serif",
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    effect: 'metal'
  },
  neon: {
    name: '霓虹发光',
    desc: '边缘发光，深色背景最出彩',
    fontFamily: "'Segoe UI', 'PingFang SC', '微软雅黑', system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    effect: 'neon',
    tone: 'primary'
  },
  outline: {
    name: '空心描边',
    desc: '镂空大字，图片背景更醒目',
    fontFamily: "Impact, 'Arial Black', 'Segoe UI', '微软雅黑', sans-serif",
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    effect: 'outline'
  },
  serif: {
    name: '典雅衬线',
    desc: '衬线宽字距，沉稳克制',
    fontFamily: "Georgia, 'Times New Roman', 'Songti SC', '宋体', serif",
    fontWeight: 500,
    letterSpacing: '3px',
    effect: 'solid',
    tone: 'ink'
  },
  mono: {
    name: '科技等宽',
    desc: '等宽字母，工程师气质',
    fontFamily: "Consolas, 'Cascadia Mono', 'SF Mono', Monaco, 'Courier New', monospace",
    fontWeight: 600,
    letterSpacing: '1.5px',
    effect: 'solid',
    tone: 'primary'
  },
  brush: {
    name: '国风行楷',
    desc: '书法行楷，中文名称首选',
    fontFamily: "'STXingkai', '华文行楷', 'LiSu', '隶书', KaiTi, '楷体', serif",
    fontWeight: 500,
    letterSpacing: '2px',
    effect: 'brush'
  },
  poster: {
    name: '海报粗黑',
    desc: '超粗黑体加硬投影，冲击力强',
    fontFamily: "'Arial Black', Impact, 'Segoe UI Black', '微软雅黑', sans-serif",
    fontWeight: 900,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    effect: 'sticker'
  }
}

/** 艺术字模板选项（设置页选择用） */
export const portalSiteNameThemes: PortalSiteNameThemeOption[] = (
  Object.keys(SITE_NAME_THEME_DEFS) as PortalSiteNameTheme[]
).map((key) => ({ key, name: SITE_NAME_THEME_DEFS[key].name, desc: SITE_NAME_THEME_DEFS[key].desc }))

/** 同色系渐变文字：用渐变填充替代纯色 */
const GRADIENT_FILL: CSSProperties = {
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent'
}

/** 各效果在浅色主题 / 图片背景下的表现 */
function getSiteNameEffectStyle(
  effect: SiteNameEffect,
  tone: SiteNameTone,
  onImage: boolean
): CSSProperties {
  switch (effect) {
    case 'gradient':
      return {
        ...GRADIENT_FILL,
        backgroundImage: onImage
          ? 'linear-gradient(180deg, #ffffff 0%, #e9f2ff 54%, #c3daff 100%)'
          : 'linear-gradient(120deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 46%, var(--el-color-primary-dark-2) 100%)',
        filter: onImage
          ? 'drop-shadow(0 1px 2px rgb(0 0 0 / 38%)) drop-shadow(0 2px 12px rgb(0 0 0 / 42%))'
          : 'drop-shadow(0 2px 6px rgb(64 87 167 / 26%))'
      }

    case 'metal':
      return {
        ...GRADIENT_FILL,
        backgroundImage: onImage
          ? 'linear-gradient(180deg, #ffffff 0%, #dfe9f8 38%, #93a9c8 51%, #ffffff 62%, #c9d8ee 100%)'
          : 'linear-gradient(180deg, #f6faff 0%, #c3d6ef 38%, #7d95b8 51%, #ffffff 62%, #aec6e3 100%)',
        WebkitTextStroke: onImage ? '0.6px rgb(255 255 255 / 45%)' : '0.6px rgb(93 123 166 / 35%)',
        filter: onImage
          ? 'drop-shadow(0 2px 3px rgb(0 0 0 / 45%))'
          : 'drop-shadow(0 2px 3px rgb(24 40 72 / 32%))'
      }

    case 'neon':
      return {
        color: onImage ? '#fff' : 'var(--el-color-primary)',
        textShadow: onImage
          ? '0 0 6px rgb(150 205 255 / 92%), 0 0 18px rgb(90 160 255 / 78%), 0 0 34px rgb(60 120 255 / 55%)'
          : '0 0 1px var(--el-color-primary-light-5), 0 0 10px var(--el-color-primary-light-7), 0 0 22px var(--el-color-primary-light-8)'
      }

    case 'outline':
      return {
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: onImage
          ? '1.5px rgb(255 255 255 / 92%)'
          : '1.5px var(--el-color-primary)',
        filter: onImage
          ? 'drop-shadow(0 2px 10px rgb(0 0 0 / 55%))'
          : 'drop-shadow(0 1px 2px rgb(64 87 167 / 18%))'
      }

    case 'sticker':
      return {
        color: onImage ? '#fff' : 'var(--art-text-gray-900)',
        textShadow: onImage
          ? '2px 2px 0 rgb(0 0 0 / 55%), 4px 4px 12px rgb(0 0 0 / 45%)'
          : '2px 2px 0 #fff, 3px 4px 8px rgb(64 87 167 / 22%)'
      }

    case 'brush':
      return {
        ...GRADIENT_FILL,
        backgroundImage: onImage
          ? 'linear-gradient(180deg, #fff8ec 0%, #ffdca8 55%, #ffffff 100%)'
          : 'linear-gradient(120deg, #7a2c22 0%, #b9523a 50%, #7a2c22 100%)',
        filter: onImage
          ? 'drop-shadow(0 1px 2px rgb(0 0 0 / 40%)) drop-shadow(0 2px 12px rgb(0 0 0 / 40%))'
          : 'drop-shadow(0 2px 6px rgb(122 44 34 / 28%))'
      }

    default:
      return {
        color: onImage
          ? '#fff'
          : tone === 'ink'
            ? 'var(--art-text-gray-900)'
            : 'var(--el-color-primary)',
        textShadow: onImage ? '0 2px 12px rgb(0 0 0 / 50%)' : 'none'
      }
  }
}

/** 填充方式对应的背景样式 */
const FIT_STYLE_MAP: Record<PortalBackgroundFit, CSSProperties> = {
  cover: { backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' },
  contain: {
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  },
  tile: { backgroundSize: 'auto', backgroundRepeat: 'repeat', backgroundPosition: 'center' },
  center: { backgroundSize: 'auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
}

/** 按标识获取预设 */
export function getPortalPreset(key: string): PortalPreset | undefined {
  return portalBackgroundPresets.find((item) => item.key === key)
}

/** 规范化标题字号，非法值回退到默认字号 */
export function normalizeTitleSize(size?: number): number {
  if (typeof size !== 'number' || !Number.isFinite(size)) return DEFAULT_PORTAL_TITLE_SIZE
  if (size < TITLE_SIZE_MIN || size > TITLE_SIZE_MAX) return DEFAULT_PORTAL_TITLE_SIZE
  return Math.round(size)
}

/** 规范化艺术字模板，未知模板回退到默认模板 */
export function normalizeSiteNameTheme(theme?: string): PortalSiteNameTheme {
  if (theme && theme in SITE_NAME_THEME_DEFS) return theme as PortalSiteNameTheme
  return DEFAULT_PORTAL_SITE_NAME_THEME
}

/** 规范化站点名称字号，非法值回退到默认字号 */
export function normalizeSiteNameSize(size?: number): number {
  if (typeof size !== 'number' || !Number.isFinite(size)) return DEFAULT_PORTAL_SITE_NAME_SIZE
  if (size < SITE_NAME_SIZE_MIN || size > SITE_NAME_SIZE_MAX) return DEFAULT_PORTAL_SITE_NAME_SIZE
  return Math.round(size)
}

/**
 * 生成站点名称艺术字样式（字体 + 效果）
 * @param settings 只依赖 siteNameTheme，便于模板卡片单独预览
 * @param options.onImage 是否铺在背景图上（决定配色）
 */
export function getPortalSiteNameStyle(
  settings: Pick<PortalSettings, 'siteNameTheme'>,
  options: { onImage?: boolean } = {}
): CSSProperties {
  const def = SITE_NAME_THEME_DEFS[normalizeSiteNameTheme(settings.siteNameTheme)]
  return {
    fontFamily: def.fontFamily,
    fontWeight: def.fontWeight,
    letterSpacing: def.letterSpacing,
    textTransform: def.textTransform,
    ...getSiteNameEffectStyle(def.effect, def.tone ?? 'primary', !!options.onImage)
  }
}

/**
 * 生成站点名称字号变量
 * 用 CSS 变量下发，便于小屏媒体查询用 min() 收窄字号
 */
export function getPortalSiteNameSizeStyle(
  settings: Pick<PortalSettings, 'siteNameSize'>,
  scale = 1
): CSSProperties & Record<'--site-name-size', string> {
  const size = Math.max(12, Math.round(normalizeSiteNameSize(settings.siteNameSize) * scale))
  return { '--site-name-size': `${size}px` }
}

/** 解析当前生效的背景图地址 */
export function resolvePortalBackgroundImage(settings: PortalSettings): string {
  const { enabled, source, preset, image } = settings.background
  if (!enabled) return ''
  if (source === 'custom') return image
  return getPortalPreset(preset)?.image ?? ''
}

/** 生成背景内联样式（用于整页背景） */
export function getPortalBackgroundStyle(settings: PortalSettings): CSSProperties {
  const image = resolvePortalBackgroundImage(settings)
  if (!image) return {}
  return {
    backgroundImage: `url("${image}")`,
    ...FIT_STYLE_MAP[settings.background.fit]
  }
}

/** 生成标题内联样式 */
export function getPortalTitleStyle(settings: PortalSettings): CSSProperties {
  return { fontSize: `${normalizeTitleSize(settings.titleSize)}px` }
}

/** 左上角站点名称，未设置时回退到系统默认名称 */
export function resolvePortalSiteName(settings: PortalSettings, fallback: string): string {
  return settings.siteName || fallback
}

/** 创建一份默认的门户设置 */
export function createDefaultPortalSettings(): PortalSettings {
  return {
    siteName: '',
    siteNameTheme: DEFAULT_PORTAL_SITE_NAME_THEME,
    siteNameSize: DEFAULT_PORTAL_SITE_NAME_SIZE,
    title: '',
    titleSize: DEFAULT_PORTAL_TITLE_SIZE,
    slogan: '',
    background: {
      enabled: false,
      source: 'preset',
      preset: DEFAULT_PORTAL_PRESET,
      image: '',
      fit: 'cover'
    }
  }
}

/**
 * 规范化后端返回的门户设置，补齐缺失字段
 * 后端字段可能为空或新增，避免登录页出现 undefined 渲染
 */
export function normalizePortalSettings(input?: Partial<PortalSettings> | null): PortalSettings {
  const base = createDefaultPortalSettings()
  if (!input) return base
  return {
    siteName: typeof input.siteName === 'string' ? input.siteName : base.siteName,
    siteNameTheme: normalizeSiteNameTheme(input.siteNameTheme),
    siteNameSize: normalizeSiteNameSize(input.siteNameSize),
    title: typeof input.title === 'string' ? input.title : base.title,
    titleSize: normalizeTitleSize(input.titleSize),
    slogan: typeof input.slogan === 'string' ? input.slogan : base.slogan,
    background: { ...base.background, ...(input.background ?? {}) }
  }
}
