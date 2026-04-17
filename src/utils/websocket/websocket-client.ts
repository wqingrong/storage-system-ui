// websocket-client.ts

// WebSocket 事件类型
type WebSocketEvent = 'open' | 'message' | 'error' | 'close'

// 连接状态枚举
enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}

// 配置选项接口
interface WebSocketClientOptions {
  reconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
  autoPong?: boolean
}

// 消息类型（可根据实际需求扩展）
interface BaseMessage {
  type: string
  [key: string]: any
}

// 事件回调类型
type EventCallback<T = any> = (data: T) => void

class WebSocketClient {
  private url: string
  private ws: WebSocket | null
  private reconnect: boolean
  private reconnectInterval: number
  private reconnectAttempts: number
  private currentAttempts: number
  private listeners: Map<WebSocketEvent, EventCallback[]>
  private autoPong: boolean
  private reconnectTimer: ReturnType<typeof setTimeout> | null

  constructor(url: string, options: WebSocketClientOptions = {}) {
    this.url = url
    this.ws = null
    this.reconnect = options.reconnect || false
    this.reconnectInterval = options.reconnectInterval || 3000
    this.reconnectAttempts = options.reconnectAttempts || 5
    this.currentAttempts = 0
    this.listeners = new Map<WebSocketEvent, EventCallback[]>()
    this.autoPong = options.autoPong !== false
    this.reconnectTimer = null
  }

  // 连接
  connect(): Promise<Event> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = (event: Event) => {
          console.log('WebSocket 连接成功')
          this.currentAttempts = 0
          this.emit('open', event)
          resolve(event)
        }

        this.ws.onmessage = (event: MessageEvent) => {
          let data: any = event.data

          // 自动解析 JSON
          try {
            data = JSON.parse(event.data)
            // 自动响应 pong
            if (this.autoPong && data.type === 'ping') {
              this.send({ type: 'pong' } as BaseMessage)
            }
          } catch (e) {
            // 不是 JSON 格式，保持原样
            console.error('error>>', e)
          }

          this.emit('message', data)
        }

        this.ws.onerror = (error: Event) => {
          console.error('WebSocket 错误:', error)
          this.emit('error', error)
          reject(error)
        }

        this.ws.onclose = (event: CloseEvent) => {
          console.log('WebSocket 连接关闭')
          this.emit('close', event)

          // 清除之前的重连定时器
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
          }

          // 自动重连
          if (this.reconnect && this.currentAttempts < this.reconnectAttempts) {
            this.currentAttempts++
            console.log(`尝试重连 (${this.currentAttempts}/${this.reconnectAttempts})...`)
            this.reconnectTimer = setTimeout(() => {
              this.connect().catch((err) => {
                console.error('重连失败:', err)
              })
            }, this.reconnectInterval)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // 发送消息
  send(data: string | BaseMessage): boolean {
    if (this.ws && this.ws.readyState === ReadyState.OPEN) {
      const message = typeof data === 'object' ? JSON.stringify(data) : data
      this.ws.send(message)
      return true
    }
    console.warn('WebSocket 未连接，消息未发送')
    return false
  }

  // 添加事件监听
  on(event: WebSocketEvent, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  // 移除事件监听
  off(event: WebSocketEvent, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 触发事件
  private emit(event: WebSocketEvent, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => callback(data))
    }
  }

  // 关闭连接
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // 获取连接状态
  getReadyState(): number {
    return this.ws ? this.ws.readyState : ReadyState.CLOSED
  }

  // 是否已连接
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === ReadyState.OPEN
  }

  // 获取重连次数
  getCurrentAttempts(): number {
    return this.currentAttempts
  }

  // 重置重连计数器
  resetAttempts(): void {
    this.currentAttempts = 0
  }
}

// 导出
export { WebSocketClient, WebSocketClientOptions, WebSocketEvent, BaseMessage, ReadyState }
