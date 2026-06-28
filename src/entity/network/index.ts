/** 网络接口类型 */
export enum InterfaceType {
  ETHERNET = 'ethernet',
  BRIDGE = 'bridge',
  BOND = 'bond',
  VLAN = 'vlan',
  TUNNEL = 'tunnel',
  LOOPBACK = 'loopback'
}

// 接口状态
export enum InterfaceState {
  UP = 'up',
  DOWN = 'down',
  UNKNOWN = 'unknown'
}

/** IP 版本 */
export enum IPVersion {
  IPv4 = 'ipv4',
  IPv6 = 'ipv6'
}

/** 地址获取方式 */
export enum AddressMethod {
  STATIC = 'static',
  DHCP = 'dhcp',
  AUTO = 'auto',
  NONE = 'none'
}

/** 网络命名空间 */
export enum NetNamespace {
  DEFAULT = 'default'
  // 可扩展其他命名空间
}

/** IP 地址配置 */
export interface IPAddress {
  /** IP 地址 (如 "192.168.1.100") */
  address: string
  /** 子网掩码 (如 "24" 或 "255.255.255.0") */
  prefix: number | string
  /** IP 版本 */
  version: IPVersion
  /** 可选：地址标签 (用于 ifconfig 别名) */
  label?: string
}

/** IP 地址范围 (用于 DHCP 池) */
export interface IPRange {
  start: string
  end: string
  prefix: number
}

/** 网络接口配置 (核心对象) */
export interface NetworkInterface {
  /** 接口名称 (如 eth0, wlan0) */
  name: string
  /** 接口类型 */
  type: InterfaceType
  /** 当前状态 */
  state: InterfaceState
  /** MAC 地址 */
  macAddress: string
  /** 接口描述/别名 */
  description?: string
  /** 所属网络命名空间 */
  namespace?: NetNamespace | string
  speed: string
  // --- IP 配置 ---
  /** IPv4 地址列表 (支持多地址) */
  ipv4Addresses: IPAddress[]
  /** IPv6 地址列表 */
  ipv6Addresses: IPAddress[]
  /** 地址获取方式 (IPv4) */
  ipv4Method: AddressMethod
  /** 地址获取方式 (IPv6) */
  ipv6Method: AddressMethod

  // --- 网关与路由 ---
  /** 默认网关 IPv4 */
  gateway4?: string
  /** 默认网关 IPv6 */
  gateway6?: string
  /** 自定义静态路由 */
  routes: StaticRoute[]

  // --- DNS ---
  /** DNS 服务器列表 */
  dnsServers: string[]
  /** DNS 搜索域 */
  dnsSearchDomains?: string[]

  // --- 高级配置 ---
  /** MTU 大小 */
  mtu?: number
  /** 是否启用 (up/down) */
  enabled: boolean
  /** 是否开机自启 */
  autoStart: boolean
  /** VLAN ID (仅当 type 为 vlan) */
  vlanId?: number
  /** 物理父接口 (VLAN/Bond 使用) */
  parentInterface?: string

  /** 最后修改时间 */
  updatedAt?: Date
  /** 创建时间 */
  createdAt?: Date
  isExpanded: boolean
}

/** 静态路由 */
export interface StaticRoute {
  /** 目标网络 (如 "192.168.2.0/24") */
  destination: string
  /** 网关地址 */
  gateway: string
  /** 出接口 (可选) */
  interface?: string
  /** 路由优先级 (metric) */
  metric?: number
  /** 路由表 ID */
  table?: number
}

/** DNS 全局配置 */
export interface DNSConfig {
  /** 系统级 DNS 服务器 */
  nameservers: string[]
  /** 搜索域列表 */
  searchDomains?: string[]
  /** 解析器选项 (如 ndots, timeout) */
  options?: Record<string, any>
}
