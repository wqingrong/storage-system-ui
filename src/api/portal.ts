import request from '@/utils/http'
import type { PortalSettings } from '@/types/portal'

/** 图片上传结果 */
export interface PortalImageUploadResult {
  /** 保存后的文件名 */
  fileName: string
  /** 可直接访问的地址（带版本号，避免浏览器缓存） */
  url: string
}

/**
 * 获取门户设置（登录页标题、标语、背景与标识）
 * 登录页在未登录状态下调用，接口已加入后端白名单
 * @param silent 静默模式：失败时不弹出错误提示（登录页使用）
 */
export function fetchGetPortalSettings(silent = false) {
  return request.get<PortalSettings>({
    url: '/system/getPortalSettings',
    loading: false,
    showErrorMessage: !silent
  })
}

/** 保存门户设置 */
export function fetchSavePortalSettings(data: PortalSettings) {
  return request.post<PortalSettings>({
    url: '/system/savePortalSettings',
    data
  })
}

/**
 * 上传登录页背景图
 * @param file 图片文件
 * @param target background（背景图）
 */
export function fetchUploadPortalImage(file: File, target: 'background' = 'background') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target', target)
  return request.post<PortalImageUploadResult>({
    url: '/system/uploadPortalImage',
    data: formData,
    loading: false
  })
}
