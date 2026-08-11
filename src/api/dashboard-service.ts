import request from '@utils/http'
import { Api } from '@/typings/api'
import { VersionView } from '@/entity/dashboard'

export function fetchGetGeneralView() {
  return request.get<Api.Dashboard.GeneralView>({
    url: '/dashboard/getGeneralView',
    loading: true
  })
}

export function fetchGetVersionView() {
  return request.get<VersionView>({
    url: '/dashboard/version',
    loading: true
  })
}

/**
 * 系统升级（在线）
 * @param params
 */
export function fetchVersionUpgrade(params: any) {
  return request.post<any>({
    url: '/dashboard/upgrade',
    params,
    loading: true
  })
}

/**
 * 系统升级（离线）
 * @param formData FormData，包含 upgradeFile 文件
 */
export function fetchVersionUpgradeOffline(formData: FormData) {
  return request.post<any>({
    url: '/dashboard/upgrade',
    data: formData,
    loading: true
  })
}
