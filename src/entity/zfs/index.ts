// ZFS存储池状态查询的实体类数据结构
// 与后端 storage-system/device/zfs_device/zfsmodel 的 JSON 输出一一对应
// 接口来源: GET /zfs/getZPoolMap | /zfs/getZPoolSummary | /zfs/getZPoolDetail | POST /zfs/createZfsDataSet

/** 存储池整体健康状态(zpool status 原始状态) */
export type PoolHealthState =
  | 'ONLINE'
  | 'DEGRADED'
  | 'FAULTED'
  | 'SUSPENDED'
  | 'UNAVAIL'
  | 'REMOVED'
  | 'UNKNOWN'

/** 池健康等级，后端统一计算的一眼结论 */
export type HealthLevel = 'HEALTHY' | 'DEGRADED' | 'FAULTED' | 'UNKNOWN'

/** 单个VDEV设备状态 */
export type VdevState =
  | 'ONLINE'
  | 'FAULTED'
  | 'UNAVAIL'
  | 'OFFLINE'
  | 'REMOVED'
  | 'SPARE'
  | 'DEGRADED'
  | 'unknown'

/** VDEV类型 */
export type VdevType =
  | 'root'
  | 'mirror'
  | 'raidz1'
  | 'raidz2'
  | 'raidz3'
  | 'raidz'
  | 'draid'
  | 'disk'
  | 'log'
  | 'cache'
  | 'spare'
  | 'special'
  | 'unknown'

/** 扫描状态 */
export type ScrubState = 'NONE' | 'SCRUBBING' | 'COMPLETED' | 'ABORTED'

/** 重建状态 */
export type ResilverState = 'NONE' | 'RUNNING' | 'COMPLETED' | 'ABORTED' | 'FAILED'

/** 每个VDEV错误计数器 */
export interface VdevErrorStat {
  /** 读错误次数 */
  read_errors: number
  /** 写错误次数 */
  write_errors: number
  /** 校验错误次数，高危 */
  checksum_errors: number
}

/** vdev树节点，支持嵌套(mirror/raidz下面挂多个device) */
export interface VdevNode {
  /** 节点名称 */
  name: string
  /** vdev类型 */
  vdev_type: VdevType
  /** 节点状态 */
  state: VdevState
  /** 子vdev，raidz/mirror使用 */
  children: VdevNode[] | null
  /** 设备路径 /dev/disk/by-id/xxx */
  dev_path: string
  /** 聚合本vdev下全部错误 */
  error_stat: VdevErrorStat | null
  /** 慢IO/僵死盘标记，上层监控填充 */
  is_slow_io: string
  /** 慢IO描述 */
  slow_io_msg: string
  /** 故障辅助原因(如 cannot open) */
  aux: string
}

/** 永久损坏文件块，来自zpool status -v输出 */
export interface PermanentDamagedFile {
  /** 文件路径 */
  path: string
  /** 错误类型，例如: DATA, DNODE */
  error_type: string
}

/** 扫描信息 */
export interface ScrubInfo {
  /** 扫描状态 */
  state: ScrubState
  /** 扫描进度 0~100 */
  progress_pct: number
  /** scrub检出错误数 */
  total_errors: number
  /** 开始时间(RFC3339) */
  start_time: string | null
  /** 结束时间(RFC3339) */
  end_time: string | null
}

/** 重建/替换磁盘重建信息 */
export interface ResilverInfo {
  /** 重建状态 */
  state: ResilverState
  /** 重建进度 0~100 */
  progress_pct: number
  /** 重建检出错误数 */
  total_errors: number
  /** 开始时间(RFC3339) */
  start_time: string | null
  /** 结束时间(RFC3339) */
  end_time: string | null
}

/** ZIL/SLOG设备状态 */
export interface ZilSlogInfo {
  /** 是否存在SLOG设备 */
  has_slog_device: boolean
  /** SLOG设备损坏 */
  slog_damaged: boolean
  /** ZIL日志回放失败 */
  zil_replay_fail: boolean
  /** 存在丢失同步数据风险 */
  lost_sync_data: boolean
}

/** ARC缓存统计，来自kstat */
export interface ArcStat {
  /** ARC最大字节数 */
  arc_max_bytes: number
  /** ARC当前字节数 */
  arc_size_bytes: number
  /** 总命中率 */
  hit_rate_pct: number
  /** 元数据命中率 */
  meta_hit_rate_pct: number
  /** ARC过大有OOM风险 */
  oom_risk: boolean
}

/** L2ARC二级缓存统计 */
export interface L2ArcStat {
  /** 设备是否存在 */
  device_exist: boolean
  /** L2ARC设备损坏 */
  device_fault: boolean
  /** 命中率 */
  hit_rate_pct: number
}

/** 异常标记位，全部bool，方便告警判断 */
export interface PoolAbnormalFlags {
  /** 池降级 */
  has_degraded: boolean
  /** 池故障 */
  has_faulted: boolean
  /** 池IO挂起 */
  has_suspended: boolean
  /** 任意设备有cksum错误 */
  any_cksum_error: boolean
  /** 读写错误 */
  any_read_write_error: boolean
  /** 存在永久损坏文件 */
  has_permanent_damaged: boolean
  /** scrub检出错误 */
  scrub_has_error: boolean
  /** 重建失败 */
  resilver_failed: boolean
  /** SLOG设备损坏 */
  slog_damaged: boolean
  /** 空间使用率>95% */
  pool_space_critical: boolean
  /** spa_sync/txg提交卡住 */
  txg_hang_detected: boolean
  /** 检测到慢IO */
  slow_io_detected: boolean
}

/** 健康问题明细，供告警和UI直接展示 */
export interface ProblemDetail {
  /** 出问题的设备/vdev名称 */
  device: string
  /** 问题类型 FAULTED / UNAVAIL / CKSUM_ERROR / SCRUB_ERROR ... */
  issue_type: string
  /** 含aux原因的可读描述 */
  message: string
}

/** 池健康报告：等级 + 异常标记 + 问题明细 */
export interface PoolHealth {
  /** 一眼结论 */
  level: HealthLevel
  /** 异常标记位 */
  flags: PoolAbnormalFlags
  /** 具体问题列表 */
  problems: ProblemDetail[]
}

/** 一个存储池完整模型，对外暴露的主结构体 */
export interface ZFSPool {
  /** 池名称 */
  pool_name: string
  /** 池UUID */
  uuid: string
  /** 池整体健康状态 */
  health_state: PoolHealthState
  /** failmode: wait / continue / panic */
  fail_mode: string
  /** 总容量(字节) */
  total_bytes: number
  /** 已用容量(字节) */
  used_bytes: number
  /** 剩余容量(字节) */
  free_bytes: number
  /** vdev树根节点 */
  root_vdev: VdevNode | null
  /** 健康报告，驱动刷新时统一计算 */
  health: PoolHealth | null
  /** 永久损坏文件列表 */
  damaged_files: PermanentDamagedFile[]
  /** 扫描信息 */
  scrub: ScrubInfo
  /** 重建信息 */
  resilver: ResilverInfo
  /** ZIL/SLOG状态 */
  zil_slog: ZilSlogInfo
  /** ARC缓存统计 */
  arc_stat: ArcStat
  /** L2ARC统计 */
  l2arc_stat: L2ArcStat
  /** 告警聚合标记 */
  abnormal_flags: PoolAbnormalFlags
  /** 导入时间(RFC3339) */
  imported_at: string
  /** 最近一次scrub完成时间(RFC3339) */
  last_scrub_complete: string | null
  /** 数据集列表 */
  data_sets: ZFSDataSet[]
}

/** 池健康概览，列表页/告警使用，一行一个池 */
export interface PoolSummary {
  /** 池名称 */
  pool_name: string
  /** 一眼结论 */
  health_level: HealthLevel
  /** zpool原始状态 */
  health_state: PoolHealthState
  /** 总容量(字节) */
  total_bytes: number
  /** 已用容量(字节) */
  used_bytes: number
  /** 剩余容量(字节) */
  free_bytes: number
  /** 使用率百分比 */
  usage_pct: number
  /** 问题数 */
  problem_count: number
  /** 快照生成时间(RFC3339) */
  updated_at: string
}

export interface ZFSDataSet {
  name: string
  device_path: string
  type: string
  pool_name: string
  mount_point: string
  total_bytes: number
  used_bytes: number
  free_bytes: number
  use_ratio: number
  is_mount: boolean
}

/** GET /zfs/getZPoolMap 返回结构: 池名 → 完整池信息 */
export type ZFSPoolMap = Record<string, ZFSPool>

/** 创建ZFS数据集(存储空间)的请求参数，与后端 zfsmodel.NewZFSDataSet 的 JSON 标签一一对应 */
export interface NewZfsDataSet {
  /** 存储池名称 */
  storage_pool_name: string
  /** 存储池类型 ZFS / SOFT_LVM */
  pool_type: string
  /** 备注信息 */
  desc_txt: string
  /** 空间大小(纯数字，单位由 unit 字段决定) */
  space_size: string
  /** 文件系统，zfs存储池固定为 zfs */
  file_system: string
  /** 空间大小单位，最小为G，最大不超过存储池总容量的单位，如 G / T / P；按比例分配时为 % */
  unit: string
  /** 最大空间(0~100，单位固定为%，占存储池总容量的百分比) */
  max_space_size: string
}

/** ZFS踢盘请求参数，与后端 zfsmodel.KickVdevNode 的 JSON 标签一一对应 */
export interface KickVdevNode {
  /** 存储池名称 */
  pool_name: string
  /** vdev设备路径，如 /dev/disk/by-id/wwn-xxx */
  vdev_path: string
  /** 节点名称(磁盘的by-id名，如 wwn-0x5000cca...，用于拼 /dev/disk/by-id/<name>) */
  vdev_name: string
  /** 节点类型，踢盘固定为 disk */
  vdev_type: VdevType
  /** 是否强制踢出 */
  is_force: boolean
  /** 序列号(后端仅用于日志展示，vdev树未返回真实序列号，以by-id名兜底) */
  serial_number: string
}

/** ZFS引入磁盘请求参数，与后端 zfsmodel.ImportDiskNode 的 JSON 标签一一对应 */
export interface ImportDiskParams {
  /** 存储池名称 */
  pool_name: string
  /** 待引入的磁盘vdev节点(后端取 name 拼 /dev/disk/by-id/<name> 执行 zpool online) */
  device: VdevNode
}
