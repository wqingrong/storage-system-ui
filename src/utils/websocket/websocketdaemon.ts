// composables/useWebSocketDaemon.ts
import { ref, onUnmounted, type Ref } from 'vue'

// WebSocket 事件类型
type WebSocketEvent = 'open' | 'message' | 'error' | 'close'

// 配置选项接口
interface WebSocketDaemonOptions {
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
  autoPong?: boolean
  heartbeatInterval?: number
  heartbeatTimeout?: number
  maxQueueSize?: number
  debug?: boolean
}

// 消息类型
interface BaseMessage {
  type: string
  timestamp?: number
  [key: string]: any
}

// 队列消息
interface QueuedMessage {
  id: string
  data: string | BaseMessage
  timestamp: number
  retries: number
}

// WebSocket Daemon 类
export class WebSocketDaemon {
  private url: string
  private ws: WebSocket | null = null
  private reconnect: boolean
  private reconnectInterval: number
  private reconnectAttempts: number
  private currentAttempts: number = 0
  private autoPong: boolean
  private heartbeatInterval: number
  private heartbeatTimeout: number
  private maxQueueSize: number
  private debug: boolean

  private listeners: Map<WebSocketEvent, Set<Function>> = new Map()
  private messageQueue: QueuedMessage[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatCheckTimer: ReturnType<typeof setTimeout> | null = null
  private isManuallyClosed: boolean = false
  private lastPongTime: number = Date.now()

  // 响应式状态
  public isConnected: Ref<boolean> = ref(false)
  public connectionStatus: Ref<'connecting' | 'connected' | 'disconnecting' | 'disconnected'> =
    ref('disconnected')
  public error: Ref<Event | null> = ref(null)
  public queueSize: Ref<number> = ref(0)

  constructor(options: WebSocketDaemonOptions) {
    this.url = options.url
    this.reconnect = options.reconnect ?? true
    this.reconnectInterval = options.reconnectInterval ?? 3000
    this.reconnectAttempts = options.reconnectAttempts ?? 10
    this.autoPong = options.autoPong ?? true // 是否自动回应
    this.heartbeatInterval = options.heartbeatInterval ?? 30000 // 心跳检查时间
    this.heartbeatTimeout = options.heartbeatTimeout ?? 10000 // 心跳超时时间
    this.maxQueueSize = options.maxQueueSize ?? 1000
    this.debug = options.debug ?? false

    this.log('WebSocket Daemon 初始化完成')
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[WebSocket Daemon]', ...args)
    }
  }

  // 连接
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.log('已经连接')
        resolve()
        return
      }

      if (this.isManuallyClosed) {
        this.log('连接被手动关闭，跳过自动连接')
        reject(new Error('Connection manually closed'))
        return
      }

      this.connectionStatus.value = 'connecting'
      this.log(`正在连接 ${this.url}...`)

      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = (event: Event) => {
          this.log('连接成功')
          this.currentAttempts = 0
          this.isConnected.value = true
          this.connectionStatus.value = 'connected'
          this.error.value = null
          this.lastPongTime = Date.now()

          // 启动心跳
          this.startHeartbeat()

          // 发送队列中的消息
          this.flushMessageQueue()

          this.emit('open', event)
          resolve()
        }

        this.ws.onmessage = (event: MessageEvent) => {
          let data: any = event.data

          try {
            data = JSON.parse(event.data)
            console.log('接收到的响应信息>>', data)
            // 处理心跳
            if (this.autoPong && data.type === 'ping') {
              this.send({ type: 'pong', timestamp: Date.now() })
              return
            }
            if (data.type === 'pong') {
              this.lastPongTime = Date.now()
              this.log('收到心跳响应')
              return
            }
          } catch (e) {
            // 不是 JSON 格式，保持原样
            console.error(e)
          }

          this.emit('message', data)
        }

        this.ws.onerror = (error: Event) => {
          this.log('连接错误:', error)
          this.error.value = error
          this.emit('error', error)
          reject(error)
        }

        this.ws.onclose = (event: CloseEvent) => {
          this.log(`连接关闭: ${event.code} - ${event.reason}`)
          this.handleClose(event)
        }
      } catch (error) {
        this.log('连接异常:', error)
        reject(error)
      }
    })
  }

  // 处理关闭
  private handleClose(event: CloseEvent): void {
    this.isConnected.value = false
    this.connectionStatus.value = 'disconnected'
    this.ws = null
    this.stopHeartbeat()

    this.emit('close', event)

    // 自动重连
    if (!this.isManuallyClosed && this.reconnect && this.currentAttempts < this.reconnectAttempts) {
      this.currentAttempts++
      const remainingAttempts = this.reconnectAttempts - this.currentAttempts
      this.log(`将在 ${this.reconnectInterval}ms 后重连 (剩余尝试次数: ${remainingAttempts})`)

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
      }

      this.reconnectTimer = setTimeout(() => {
        this.connect().catch((err) => {
          this.log('重连失败:', err)
        })
      }, this.reconnectInterval)
    } else if (!this.isManuallyClosed && this.currentAttempts >= this.reconnectAttempts) {
      this.log('已达到最大重连次数，停止重连')
    }
  }

  // 发送消息
  send(data: string | BaseMessage, priority: boolean = false): string {
    const messageId = this.generateMessageId()
    const message: QueuedMessage = {
      id: messageId,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    // 检查队列大小
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.log('消息队列已满，丢弃最早的消息')
      this.messageQueue.shift()
    }

    if (priority) {
      this.messageQueue.unshift(message)
    } else {
      this.messageQueue.push(message)
    }

    this.queueSize.value = this.messageQueue.length

    // 如果连接已建立，立即发送
    if (this.isConnected.value && this.ws) {
      this.flushMessageQueue()
    }

    return messageId
  }

  // 刷新消息队列
  private flushMessageQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const queueCopy = [...this.messageQueue]
    this.messageQueue = []

    for (const message of queueCopy) {
      try {
        const rawMessage =
          typeof message.data === 'object' ? JSON.stringify(message.data) : message.data
        this.ws.send(rawMessage)
        this.log(`发送消息: ${message.id}`)
      } catch (error) {
        this.log(`发送消息失败: ${message.id}`, error)
        // 发送失败，重新加入队列
        if (message.retries < 3) {
          message.retries++
          this.messageQueue.push(message)
        } else {
          this.log(`消息 ${message.id} 达到最大重试次数，丢弃`)
        }
      }
    }

    this.queueSize.value = this.messageQueue.length
  }

  // 启动心跳
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected.value && this.ws) {
        // 发送心跳
        this.send({
          type: 'ping',
          timestamp: Date.now()
        })

        // 检查心跳超时
        if (this.heartbeatCheckTimer) {
          clearTimeout(this.heartbeatCheckTimer)
        }

        this.heartbeatCheckTimer = setTimeout(() => {
          const now = Date.now()
          if (now - this.lastPongTime > this.heartbeatTimeout) {
            this.log('心跳超时，主动关闭连接')
            this.ws?.close()
          }
        }, this.heartbeatTimeout)
      }
    }, this.heartbeatInterval)
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.heartbeatCheckTimer) {
      clearTimeout(this.heartbeatCheckTimer)
      this.heartbeatCheckTimer = null
    }
  }

  // 添加事件监听
  on(event: WebSocketEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  // 移除事件监听
  off(event: WebSocketEvent, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback)
    }
  }

  // 触发事件
  private emit(event: WebSocketEvent, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          this.log(`事件处理错误 (${event}):`, error)
        }
      })
    }
  }

  // 生成消息ID
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 手动关闭连接
  close(): void {
    this.log('手动关闭连接')
    this.isManuallyClosed = true
    this.connectionStatus.value = 'disconnecting'

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }

    this.isConnected.value = false
    this.connectionStatus.value = 'disconnected'
  }

  // 重置连接（手动重连）
  async reset(): Promise<void> {
    this.log('重置连接')
    this.close()
    this.isManuallyClosed = false
    this.currentAttempts = 0
    await this.connect()
  }

  // 清空消息队列
  clearQueue(): void {
    this.messageQueue = []
    this.queueSize.value = 0
    this.log('消息队列已清空')
  }

  // 获取连接状态
  getReadyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED
  }
}

// Vue Composable
export function useWebSocketDaemon(options: WebSocketDaemonOptions) {
  const daemon = new WebSocketDaemon(options)

  // 自动连接
  const autoConnect = true

  const connect = async () => {
    try {
      await daemon.connect()
      return true
    } catch (error) {
      console.error('WebSocket 连接失败:', error)
      return false
    }
  }

  const disconnect = () => {
    daemon.close()
  }

  const send = (data: string | BaseMessage, priority?: boolean) => {
    return daemon.send(data, priority)
  }

  const on = (event: WebSocketEvent, callback: Function) => {
    daemon.on(event, callback)
  }

  const off = (event: WebSocketEvent, callback: Function) => {
    daemon.off(event, callback)
  }

  // 自动连接
  if (autoConnect) {
    connect()
  }

  // 组件卸载时关闭连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    // 响应式状态
    isConnected: daemon.isConnected,
    connectionStatus: daemon.connectionStatus,
    error: daemon.error,
    queueSize: daemon.queueSize,

    // 方法
    connect,
    disconnect,
    send,
    on,
    off,
    reset: () => daemon.reset(),
    clearQueue: () => daemon.clearQueue(),
    getReadyState: () => daemon.getReadyState()
  }
}
