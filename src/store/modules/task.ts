import { defineStore } from 'pinia'
import type { PhaseRecord, SSEEvent } from '@/entity/sse'
import { TaskPhase, Event } from '@/entity/sse'

export type { PhaseRecord, SSEEvent } from '@/entity/sse'

/** 任务记录 */
export interface TaskRecord {
  taskId: string
  eventType: Event
  phase: TaskPhase
  timestamp: string
  /** 按阶段顺序排列的 payload 历史 */
  history: PhaseRecord[]
  /** 最终是否已完成（completed/canceled/failed） */
  isFinished: boolean
}

/** 任务阶段显示配置 */
const PHASE_CONFIG: Record<TaskPhase, { label: string; icon: string; color: string }> = {
  [TaskPhase.Init]: { label: '任务受理', icon: '📋', color: '#909399' },
  [TaskPhase.Scanning]: { label: '扫描中', icon: '🔍', color: '#409eff' },
  [TaskPhase.Scanned]: { label: '扫描完成', icon: '✅', color: '#67c23a' },
  [TaskPhase.Deleting]: { label: '删除中', icon: '🗑️', color: '#e6a23c' },
  [TaskPhase.Completed]: { label: '删除成功', icon: '🎉', color: '#67c23a' },
  [TaskPhase.Canceled]: { label: '已取消', icon: '🚫', color: '#909399' },
  [TaskPhase.Failed]: { label: '删除失败', icon: '❌', color: '#f56c6c' }
}

export const useTaskStore = defineStore('task', {
  state: () => ({
    /** 所有任务记录，key 为 taskId */
    tasks: {} as Record<string, TaskRecord>
  }),

  getters: {
    /** 活跃任务数（未完成的任务） */
    activeCount(): number {
      return Object.values(this.tasks).filter((t) => !t.isFinished).length
    },

    /** 任务列表（按时间倒序） */
    taskList(): TaskRecord[] {
      return Object.values(this.tasks).sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
    },

    /** 活跃任务列表 */
    activeTasks(): TaskRecord[] {
      return this.taskList.filter((t) => !t.isFinished)
    },

    /** 获取阶段配置 */
    getPhaseConfig() {
      return (phase: TaskPhase) => PHASE_CONFIG[phase]
    },

    /** 阶段列表（有序） */
    phaseList(): TaskPhase[] {
      return [
        TaskPhase.Init,
        TaskPhase.Scanning,
        TaskPhase.Scanned,
        TaskPhase.Deleting,
        TaskPhase.Completed
      ]
    }
  },

  actions: {
    /** 处理收到的 SSE 删除事件 */
    handleDeleteEvent(data: SSEEvent): void {
      const {
        eventId: taskId,
        status: phase,
        time: timestamp,
        data: payload,
        event: eventType
      } = data

      const existing = this.tasks[taskId]
      const phaseRecord: PhaseRecord = { phase, payload, timestamp }

      // 判断是否为终态
      const isFinished =
        phase === TaskPhase.Completed || phase === TaskPhase.Canceled || phase === TaskPhase.Failed

      if (existing) {
        // 更新已有任务
        existing.phase = phase
        existing.timestamp = timestamp
        existing.isFinished = isFinished

        // 追加历史记录（去重：同阶段只保留最新一条）
        const existingIdx = existing.history.findIndex((h) => h.phase === phase)
        if (existingIdx >= 0) {
          existing.history[existingIdx] = phaseRecord
        } else {
          existing.history.push(phaseRecord)
        }
      } else {
        // 新建任务记录
        this.tasks[taskId] = {
          taskId,
          eventType,
          phase,
          timestamp,
          isFinished,
          history: [phaseRecord]
        }
      }
    },

    /** 移除已完成的任务 */
    removeTask(taskId: string): void {
      delete this.tasks[taskId]
    },

    /** 清空所有已完成任务 */
    clearFinished(): void {
      Object.entries(this.tasks).forEach(([id, task]) => {
        if (task.isFinished) {
          delete this.tasks[id]
        }
      })
    }
  }
})
