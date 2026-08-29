import type { Api } from '@/typings/api'

/** 任务类型：区分执行什么任务 */
export type TaskType = 'shell' | 'http' | 'func'

/**
 * 并发策略
 * SKIP：上一轮没跑完，本次触发直接跳过
 * WAIT：等待上一轮完成再跑
 * PARALLEL：同时跑多份
 */
export type ConcurrentPolicy = 'SKIP' | 'WAIT' | 'PARALLEL'

/** 任务状态 */
export type TaskStatus = 'ENABLED' | 'DISABLED' | 'PAUSED'

/** 上一次执行结果，空字符串表示无记录 */
export type TaskResult = 'success' | 'fail' | ''

/** 定时任务 */
export interface TimeTaskPlan {
  // ---------- 基础标识 ----------
  /** 任务唯一ID，uuid */
  id: string
  /** 任务名称 */
  name: string
  /** 任务描述 */
  description: string

  // ---------- 调度规则核心 ----------
  /** cron表达式，如 "0 3 * * *" 每天凌晨3点 */
  cronExpr: string
  /** 简单间隔模式（单位：纳秒），和cronExpr二选一 */
  interval?: number
  /** 任务开始生效时间 */
  startTime: Date
  /** 任务结束失效时间，零值代表永久有效 */
  endTime: Date

  // ---------- 执行配置 ----------
  /** 任务类型：shell/http/func 区分执行什么任务 */
  taskType: TaskType
  /** 任务执行参数，shell命令 / http url+body /函数参数json字符串 */
  payload: string
  /** 失败最大重试次数 */
  maxRetry: number
  /** 重试间隔（单位：纳秒） */
  retryDelay: number
  /** 单次执行超时时间（单位：纳秒） */
  timeout: number
  /** 并发策略 */
  concurrentPolicy: ConcurrentPolicy

  // ---------- 状态字段 ----------
  /** 任务状态：ENABLED启用 / DISABLED禁用 / PAUSED暂停 */
  status: TaskStatus

  // ---------- 运行时信息（调度后更新） ----------
  /** 上一次执行时间 */
  lastExecuteTime: Date
  lastExecuteTimeStr: string
  /** 上一次执行成功的时间 */
  lastExecuteSuccessTime: Date
  lastExecuteSuccessTimeStr: string
  /** 下一次计划执行时间 */
  nextExecuteTime: Date
  nextExecuteTimeStr: string
  /** 上一次执行结果 success/fail */
  lastResult: TaskResult
  /** 上一次错误信息 */
  lastErr: string

  // 数据库审计字段
  createdAt: Date
  updatedAt: Date
}

/** 定时任务分页列表 */
export type TimeTaskPlanList = Api.Common.PaginatedResponse<TimeTaskPlan>
