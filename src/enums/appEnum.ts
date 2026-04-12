// 系统级别枚举

// 菜单类型
export enum MenuTypeEnum {
  LEFT = 'left',
  TOP = 'top',
  TOP_LEFT = 'top-left',
  DUAL_MENU = 'dual-menu'
}

// App theme enum
export enum SystemThemeEnum {
  DARK = 'dark',
  LIGHT = 'light',
  AUTO = 'auto'
}

// Menu theme enum
export enum MenuThemeEnum {
  DARK = 'dark',
  LIGHT = 'light',
  DESIGN = 'design'
}

// Menu close width
export enum MenuWidth {
  CLOSE = '70px'
}

// Language
export enum LanguageEnum {
  ZH = 'zh',
  EN = 'en'
}

// Icon type
export enum IconTypeEnum {
  CLASS_NAME = 'className',
  UNICODE = 'unicode'
}

// Container width
export enum ContainerWidthEnum {
  FULL = '100%',
  BOXED = '1200px'
}

// Background color enum
export enum BgColorEnum {
  PRIMARY = 'bg-primary',
  SECONDARY = 'bg-secondary',
  WARNING = 'bg-warning',
  ERROR = 'bg-error',
  SUCCESS = 'bg-success',
  DANGER = 'bg-danger',
  INFO = 'bg-info'
}
// 磁盘的健康状态
export enum HealthStatus {
  OK = 'OK', // 良好
  WARNING = 'warning', // 警告
  BAD = 'bad', // 故障
  UNKNOWN = 'unknown' // 未知
}

export enum PoolStatus {
  POOL_STATUS_STOP = 'STOP',
  POOL_STATUS_ACTIVE = 'ACTIVE',
  POOL_STATUS_INACTIVE = 'INACTIVE',
  POOL_STATUS_FAULTED = 'FAULTED',
  POOL_STATUS_OFFLINE = 'OFFLINE',
  POOL_STATUS_ONLINE = 'ONLINE',
  POOL_STATUS_CLEAN = 'CLEAN',
  POOL_STATUS_REMOVED = 'REMOVED',
  POOL_STATUS_DEGRADED = 'DEGRADED',
  POOL_STATUS_FAILED = 'FAILED',
  POOL_STATUS_UNAVAIL = 'UNAVAIL',
  POOL_STATUS_SUSPENDED = 'SUSPENDED',
  POOL_STATUS_SYNC = 'RESYNCING',
  POOL_STATUS_DEGRADATION = 'DEGRADATION',
  POOL_STATUS_WARRING = 'WARRING',
  POOL_STATUS_UNKNOWN = 'UNKNOWN'
}
export enum PoolType {
  POOL_TYPE_ZFS = 'ZFS',
  POOL_TYPE_SOFT_LVM = 'SOFT_LVM'
}
