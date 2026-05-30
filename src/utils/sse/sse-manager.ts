import { useUserStore } from '@/store/modules/user'

type SSEMessage = {
  taskId: string
  progress?: number
  status?: string
  message?: string
  [key: string]: any
}
type TaskCallback = (data: SSEMessage) => void

class SSEManager {
  private es: EventSource | null = null
  private listeners: Record<string, TaskCallback> = {}
  private accessToke: string = ''
  private baseUrl = ``

  // 获取单例
  public init(): SSEManager {
    if (!this.es) {
      const userStore = useUserStore()
      const token = userStore.accessToken
      if (token) {
        this.createConnection(token)
      }
    }
    return this
  }

  // 创建连接
  private createConnection(accessToken: string): void {
    if (this.es) {
      console.log('连接断开>>>')
      this.es.close()
    }
    this.accessToke = accessToken
    this.baseUrl = `/sse/sse?token=${this.accessToke}`
    this.es = new EventSource(this.baseUrl)

    this.es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('sse接收消息>>', data)
        const taskId = data.taskId
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
      setTimeout(() => this.createConnection(this.accessToke), 2000)
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
    this.es?.close()
    this.es = null
    this.listeners = {}
  }
}

// 全局单例
export const sse = new SSEManager()
