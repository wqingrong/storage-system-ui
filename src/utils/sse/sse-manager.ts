import { useUserStore } from '@/store/modules/user'
import { SSEEvent } from '@/entity/sse'

// type SSEMessage = {
//   taskId: string
//   progress?: number
//   status?: string
//   message?: string
//   [key: string]: any
// }
type TaskCallback = (data: SSEEvent) => void

class SSEManager {
  private es: EventSource | null = null
  private listeners: Record<string, TaskCallback> = {}
  private baseUrl = ``
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5

  // 获取单例：每次调用都会用最新的 token 重建连接
  public init(): SSEManager {
    // 先关闭旧连接
    this.close()
    // 用当前 store 中的 token 创建新连接
    const userStore = useUserStore()
    const token = userStore.accessToken
    if (token) {
      this.createConnection(token)
    }
    return this
  }

  // 创建连接
  private createConnection(accessToken: string): void {
    this.baseUrl = `/sse/sse?token=${accessToken}`
    this.es = new EventSource(this.baseUrl)

    this.es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('sse接收消息>>', data)
        const taskId = data.taskId || data.eventId || data.event
        if (taskId && this.listeners[taskId]) {
          this.listeners[taskId](data)
        }
      } catch (err) {
        console.error('SSE 解析失败', err)
      }
    }

    this.es.onerror = (event: any) => {
      console.error('【SSE ERROR】异常触发', event)
      this.es?.close()
      this.es = null

      // 重连时使用当前 store 中的最新 token，而非缓存值
      const userStore = useUserStore()
      const currentToken = userStore.accessToken
      if (currentToken && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        this.reconnectTimer = setTimeout(() => this.createConnection(currentToken), 2000)
      } else if (!currentToken) {
        console.warn('SSE 重连取消：未登录（无 token）')
      } else {
        console.warn('SSE 重连取消：已达最大重试次数')
      }
    }
  }

  // 订阅任务
  public subscribe(taskId: string, callback: TaskCallback): void {
    this.listeners[taskId] = callback
  }

  // 取消订阅
  public unsubscribe(taskId: string): void {
    delete this.listeners[taskId]
  }

  // 关闭连接
  public close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = 0
    this.es?.close()
    this.es = null
    this.listeners = {}
  }
}

// 全局单例
export const sse = new SSEManager()
