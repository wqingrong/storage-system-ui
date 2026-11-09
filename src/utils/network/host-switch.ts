import { ElLoading, ElMessageBox } from 'element-plus'
import { AddressMethod, type NetworkInterface } from '@/entity/network'

/**
 * 网络配置生效后的「地址切换」工具
 *
 * 为什么不能直接写在接口的成功回调里：
 *   后端 setNetworkConfig 内部会执行 `nmcli connection up <iface>`，
 *   如果改的正好是「当前访问所用的网卡」，连接会在响应返回之前就断开，
 *   前端拿到的往往是 Network Error —— 但配置其实已经生效了。
 *
 * 所以正确姿势是：
 *   1. 提交前先算清楚「当前访问地址会不会失效」；
 *   2. 提交时关掉拦截器的错误弹窗，由这里接管结果；
 *   3. 无论接口成功还是断连，都以「新地址能否探通」来决定是否跳转。
 */

/** 探测/等待新地址时的默认参数 */
const DEFAULT_TIMEOUT = 20000
const DEFAULT_INTERVAL = 1500
/** 单次探测超时 */
const PROBE_TIMEOUT = 2500

/** 地址切换计划 */
export interface HostSwitchPlan {
  /** 切换后的 IP */
  toIp: string
  /** 切换后的完整地址（保留协议、端口、路径、查询与 hash） */
  toUrl: string
  /** 切换前的完整地址，用于兜底提示 */
  fromUrl: string
}

/** 从接口配置里取出静态 IPv4 地址（DHCP / 无地址时返回空数组） */
export function collectStaticIPv4(config?: Partial<NetworkInterface> | null): string[] {
  if (!config || config.ipv4Method !== AddressMethod.STATIC) return []
  return (config.ipv4Addresses ?? [])
    .map((item) => (item?.address ?? '').trim())
    .filter((ip) => ip.length > 0)
}

/** 用新 IP 拼出访问地址，协议 / 端口 / 路径全部沿用当前页面 */
function buildUrl(ip: string): string {
  const { protocol, port, pathname, search, hash } = window.location
  // IPv6 需要方括号包裹
  const host = ip.includes(':') ? `[${ip}]` : ip
  // 默认端口时 location.port 是空串，拼出来正好不带端口
  return `${protocol}//${host}${port ? `:${port}` : ''}${pathname}${search}${hash}`
}

/**
 * 判断保存网络配置后，当前访问地址是否必然失效
 *
 * 只有同时满足下面三条才会返回计划：
 *   1. 当前访问的 IP 属于这块网卡（改前或改后），说明改的就是正在用的口；
 *   2. 改后的地址里已经没有当前访问的 IP，说明连接一定会断；
 *   3. 改后至少还有一个可用的静态 IPv4。
 *
 * @returns 需要跳转时返回计划，不需要跳转（或无法自动跳转）时返回 null
 */
export function buildHostSwitchPlan(
  prev?: Partial<NetworkInterface> | null,
  next?: Partial<NetworkInterface> | null
): HostSwitchPlan | null {
  const currentHost = window.location.hostname
  const prevIps = collectStaticIPv4(prev)
  const nextIps = collectStaticIPv4(next)

  // 当前访问地址与这块网卡无关（改的是别的网口），不影响本次会话
  if (!prevIps.includes(currentHost) && !nextIps.includes(currentHost)) return null

  // 改后仍然保留当前 IP（例如只是新增一个地址），连接不会断
  if (nextIps.includes(currentHost)) return null

  const toIp = nextIps[0]
  if (!toIp || toIp === currentHost) return null

  return {
    toIp,
    toUrl: buildUrl(toIp),
    fromUrl: window.location.href
  }
}

/**
 * 当前网卡被切成 DHCP 时，新地址由服务端分配，前端无法预知。
 * 这种情况不能自动跳转，只能提示用户去路由器/服务端查看。
 */
export function willSwitchToDhcp(
  prev?: Partial<NetworkInterface> | null,
  next?: Partial<NetworkInterface> | null
): boolean {
  if (!next || next.ipv4Method !== AddressMethod.DHCP) return false
  return collectStaticIPv4(prev).includes(window.location.hostname)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * 探测目标地址是否可达
 *
 * 用 no-cors 请求：拿不到响应体，但只要网络层能建立连接就会 resolve，
 * 足够判断「新 IP 上的服务是否已经起来了」。失败/超时一律当作不可达。
 */
export function probeHost(url: string, timeoutMs = PROBE_TIMEOUT): Promise<boolean> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  // 加随机参数，绕开浏览器与中间层的缓存
  const probeUrl = `${url}${url.includes('?') ? '&' : '?'}_probe=${Date.now()}`

  return fetch(probeUrl, {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    signal: controller.signal
  })
    .then(() => true)
    .catch(() => false)
    .finally(() => window.clearTimeout(timer))
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return map[char] ?? char
  })
}

export interface SwitchOptions {
  /** 最长等待新地址生效的时间，默认 20s */
  timeoutMs?: number
  /** 探测间隔，默认 1.5s */
  intervalMs?: number
}

/**
 * 执行地址切换：等新地址探通后跳过去
 *
 * 这里刻意不区分「接口成功」和「接口断连」——两种情况都可能是配置已生效，
 * 唯一可信的依据是「新地址有没有响应」。
 */
export async function switchToHost(
  plan: HostSwitchPlan,
  options: SwitchOptions = {}
): Promise<void> {
  const { timeoutMs = DEFAULT_TIMEOUT, intervalMs = DEFAULT_INTERVAL } = options

  const loading = ElLoading.service({
    lock: true,
    text: `网络配置已提交，正在等待 ${plan.toIp} 响应…`,
    background: 'rgba(255, 255, 255, 0.92)'
  })

  const deadline = Date.now() + timeoutMs
  let jumped = false

  try {
    while (Date.now() < deadline) {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      loading.setText(`网络配置已提交，正在等待 ${plan.toIp} 响应… 剩余 ${remain}s`)

      if (await probeHost(plan.toUrl)) {
        loading.setText('新地址已就绪，正在跳转…')
        jumped = true
        // 用 replace 而不是 href：避免用户点「后退」回到已经失效的旧地址
        window.location.replace(plan.toUrl)
        return
      }
      await sleep(intervalMs)
    }
  } finally {
    // 已经跳转时页面正在卸载，此时关掉遮罩反而会闪一下旧页面
    if (!jumped) loading.close()
  }

  await ElMessageBox.alert(
    `新地址 <b>${escapeHtml(plan.toIp)}</b> 暂未探测到响应。` +
      '<br/>请确认网线、网关与 VLAN 配置是否正确；' +
      '<br/>若使用 HTTPS 且为自签证书，浏览器可能拦住了探测请求，直接点下面的地址访问即可。' +
      `<br/><a href="${escapeHtml(plan.toUrl)}" target="_self">${escapeHtml(plan.toUrl)}</a>`,
    '地址切换未完成',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '我知道了',
      type: 'warning'
    }
  ).catch(() => {
    // 关闭弹窗即可
  })
}

/** 提示用户「已切到 DHCP，无法自动跳转」 */
export async function notifyDhcpSwitch(): Promise<void> {
  await ElMessageBox.alert(
    '网卡已切换为 DHCP 模式，新的 IP 由服务端分配，页面无法自动跳转。' +
      '<br/>请在路由器管理页面查看该设备的新地址后再访问。',
    '请手动访问新地址',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '我知道了',
      type: 'info'
    }
  ).catch(() => {
    // 关闭弹窗即可
  })
}
