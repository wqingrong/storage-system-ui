import { fetchSetNetworkConfig } from '@/api/network'
import type { NetworkInterface } from '@/entity/network'
import { isHttpError } from '@/utils/http/error'
import {
  buildHostSwitchPlan,
  switchToHost,
  willSwitchToDhcp,
  type HostSwitchPlan
} from '@/utils/network/host-switch'

export type NetworkSubmitStatus = 'saved' | 'switching' | 'dhcp' | 'failed'

/**
 * 命中地址切换时，保存请求的超时时间。
 * nmcli 正常几秒内就能完成，超过这个时间还没响应基本可以判定连接已经断了。
 */
const NETWORK_SWITCH_TIMEOUT = 12000

export interface NetworkSubmitResult {
  status: NetworkSubmitStatus
  /** status 为 switching 时的跳转计划 */
  plan?: HostSwitchPlan
  /** status 为 failed 时的具体原因 */
  error?: string
  /** 失败提示是否已由 http 拦截器弹出（组件无需重复提示） */
  errorShown?: boolean
}

/**
 * 提交网络配置并处理「改 IP 导致当前访问地址失效」的场景
 *
 * 判定与处理都收敛在这里，页面只负责提示和关闭弹窗：
 *   - 命中切换：关掉拦截器弹窗 → 断连也照常继续 → 后台探测新地址并跳转
 *   - 转 DHCP：新地址未知，交给调用方提示用户手动查看
 *   - 普通保存：维持原有行为
 *
 * @param payload 表单提交的配置
 * @param origin 修改前的配置（用于比对地址变化，缺省视为新建、不做切换）
 */
export async function submitNetworkConfig(
  payload: NetworkInterface,
  origin?: Partial<NetworkInterface> | null
): Promise<NetworkSubmitResult> {
  const plan = buildHostSwitchPlan(origin, payload)
  const toDhcp = willSwitchToDhcp(origin, payload)

  try {
    // 命中切换场景时关闭全局错误弹窗：断连在预期之内；
    // 同时给一个短超时，避免连接被静默丢弃时干等全局的 150s
    await fetchSetNetworkConfig(payload, {
      showErrorMessage: !plan,
      timeout: plan ? NETWORK_SWITCH_TIMEOUT : undefined
    })
  } catch (error) {
    if (!plan) {
      // 普通保存失败，拦截器已统一提示
      return { status: 'failed', errorShown: true }
    }
    if (!isHttpError(error) || !error.isNetworkError) {
      // 后端确实返回了错误（参数校验不通过等），配置没改成，不能跳转
      return {
        status: 'failed',
        error: isHttpError(error) ? error.message : '网络配置保存失败'
      }
    }
    // 连接被切断 —— 配置大概率已生效，继续往下走
  }

  if (plan) {
    // 不阻塞调用方：遮罩与倒计时由切换流程自己管理
    void switchToHost(plan)
    return { status: 'switching', plan }
  }
  if (toDhcp) return { status: 'dhcp' }
  return { status: 'saved' }
}
