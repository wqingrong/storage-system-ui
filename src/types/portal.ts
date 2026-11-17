/**
 * 门户设置（登录页外观）
 */

/** 背景图填充方式 */
export type PortalBackgroundFit = 'cover' | 'contain' | 'tile' | 'center'

/** 背景图来源 */
export type PortalBackgroundSource = 'preset' | 'custom'

/** 背景配置 */
export interface PortalBackground {
  /** 是否启用背景图 */
  enabled: boolean
  /** 来源：内置预设 / 自定义图片 */
  source: PortalBackgroundSource
  /** 内置预设标识 */
  preset: string
  /** 自定义图片（dataURL 或服务器地址） */
  image: string
  /** 填充方式 */
  fit: PortalBackgroundFit
}

/** 站点名称艺术字模板 */
export type PortalSiteNameTheme =
  | 'classic'
  | 'metal'
  | 'neon'
  | 'outline'
  | 'serif'
  | 'mono'
  | 'brush'
  | 'poster'

/** 站点名称艺术字模板选项 */
export interface PortalSiteNameThemeOption {
  /** 模板标识 */
  key: PortalSiteNameTheme
  /** 显示名称 */
  name: string
  /** 风格说明 */
  desc: string
}

/** 门户设置 */
export interface PortalSettings {
  /** 登录页左上角站点名称，为空时使用系统默认名称 */
  siteName: string
  /** 站点名称艺术字模板 */
  siteNameTheme: PortalSiteNameTheme
  /** 站点名称字号（px） */
  siteNameSize: number
  /** 登录页面标题 */
  title: string
  /** 标题字号（px） */
  titleSize: number
  /** 宣传标语 */
  slogan: string
  /** 背景 */
  background: PortalBackground
}

/** 内置背景预设 */
export interface PortalPreset {
  /** 唯一标识 */
  key: string
  /** 显示名称 */
  name: string
  /** 图片地址 */
  image: string
}
