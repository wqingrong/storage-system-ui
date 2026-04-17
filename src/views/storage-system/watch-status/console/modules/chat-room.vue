<!-- components/ChatRoom.vue -->
<template>
  <div class="chat-room">
    <!-- 连接状态栏 -->
    <div class="status-bar" :class="statusClass">
      <div class="status-indicator">
        <span class="dot" :class="statusDotClass"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
      <div class="connection-info">
        <span v-if="queueSize > 0" class="queue-badge"> 待发送: {{ queueSize }} </span>
        <button
          @click="handleConnection"
          :disabled="connectionStatus === 'connecting'"
          class="connection-btn"
        >
          {{ connectionStatus === 'connected' ? '断开' : '连接' }}
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      ⚠️ 连接错误: {{ error.message || '未知错误' }}
      <button @click="dismissError" class="dismiss-btn">×</button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" class="message" :class="message.type">
        <div class="message-header">
          <span class="sender">{{ message.sender }}</span>
          <span class="time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <input
        v-model="inputMessage"
        @keyup.enter="sendChatMessage"
        :disabled="!isConnected"
        placeholder="输入消息..."
        class="message-input"
      />
      <button
        @click="sendChatMessage"
        :disabled="!isConnected || !inputMessage.trim()"
        class="send-btn"
      >
        发送
      </button>
    </div>

    <!-- 在线用户 -->
    <div v-if="onlineUsers.length" class="users-panel">
      <h4>在线用户 ({{ onlineUsers.length }})</h4>
      <ul>
        <li v-for="user in onlineUsers" :key="user.id">
          {{ user.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick, watch } from 'vue'
  import { useWebSocketDaemon } from '@utils/websocket'

  // 消息接口
  interface ChatMessage {
    id: string
    type: 'user' | 'system' | 'broadcast'
    sender: string
    content: string
    timestamp: number
  }

  interface User {
    id: string
    name: string
  }

  // 组件 Props
  const props = defineProps<{
    userId: string
    userName: string
    roomId?: string
  }>()
  // WebSocket Daemon
  const { isConnected, connectionStatus, error, queueSize, send, on, off, reset, disconnect } =
    useWebSocketDaemon({
      url: `ws://localhost:9090/ws/ws?id=${props.userId}&room=${props.roomId || 'default'}`,
      reconnect: true,
      reconnectInterval: 3000,
      reconnectAttempts: 10,
      autoPong: false, // 是否自动回应
      heartbeatInterval: 30000,
      maxQueueSize: 500,
      heartbeatTimeout: 50000,
      debug: import.meta.env.DEV
    })

  // 响应式数据
  const messages = ref<ChatMessage[]>([])
  const inputMessage = ref('')
  const onlineUsers = ref<User[]>([])
  const messagesContainer = ref<HTMLElement>()

  // 计算属性
  const statusText = computed(() => {
    switch (connectionStatus.value) {
      case 'connecting':
        return '连接中...'
      case 'connected':
        return '已连接'
      case 'disconnecting':
        return '断开中...'
      case 'disconnected':
        return '已断开'
      default:
        return '未知'
    }
  })

  const statusClass = computed(() => {
    return {
      'status-connected': connectionStatus.value === 'connected',
      'status-disconnected': connectionStatus.value === 'disconnected',
      'status-connecting': connectionStatus.value === 'connecting'
    }
  })

  const statusDotClass = computed(() => {
    return {
      'dot-connected': connectionStatus.value === 'connected',
      'dot-disconnected': connectionStatus.value === 'disconnected',
      'dot-connecting': connectionStatus.value === 'connecting'
    }
  })

  // 方法
  const handleConnection = () => {
    if (connectionStatus.value === 'connected') {
      disconnect()
    } else {
      reset()
    }
  }

  const sendChatMessage = () => {
    const content = inputMessage.value.trim()
    if (!content || !isConnected.value) return

    const message = {
      type: 'chat',
      content,
      sender: props.userName,
      userId: props.userId,
      roomId: props.roomId,
      timestamp: Date.now()
    }

    send(message)
    inputMessage.value = ''
  }

  const addMessage = (msg: ChatMessage) => {
    messages.value.push(msg)

    // 自动滚动到底部
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const dismissError = () => {
    error.value = null
  }

  // WebSocket 事件处理
  const handleMessage = (data: any) => {
    switch (data.type) {
      case 'chat':
        addMessage({
          id: Date.now().toString(),
          type: 'user',
          sender: data.sender,
          content: data.content,
          timestamp: data.timestamp || Date.now()
        })
        break

      case 'system':
        addMessage({
          id: Date.now().toString(),
          type: 'system',
          sender: '系统',
          content: data.content,
          timestamp: Date.now()
        })
        break

      case 'broadcast':
        addMessage({
          id: Date.now().toString(),
          type: 'broadcast',
          sender: data.sender,
          content: data.content,
          timestamp: Date.now()
        })
        break

      case 'user_list':
        onlineUsers.value = data.users
        break
    }
  }

  const handleOpen = () => {
    addMessage({
      id: Date.now().toString(),
      type: 'system',
      sender: '系统',
      content: '连接成功，欢迎加入聊天室！',
      timestamp: Date.now()
    })

    // 发送加入房间消息
    send({
      type: 'join',
      userId: props.userId,
      userName: props.userName,
      roomId: props.roomId
    })
  }

  const handleClose = () => {
    addMessage({
      id: Date.now().toString(),
      type: 'system',
      sender: '系统',
      content: '连接已断开，正在尝试重连...',
      timestamp: Date.now()
    })
  }

  // 注册事件监听
  on('message', handleMessage)
  on('open', handleOpen)
  on('close', handleClose)

  // 组件卸载时清理
  onUnmounted(() => {
    off('message', handleMessage)
    off('open', handleOpen)
    off('close', handleClose)
  })

  // 监听在线用户变化
  watch(
    onlineUsers,
    (newUsers) => {
      console.log('在线用户更新:', newUsers)
    },
    { deep: true }
  )
</script>

<style scoped>
  .chat-room {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    background: #f5f5f5;
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e0e0e0;
  }

  .status-connected {
    background: #e8f5e9;
  }

  .status-disconnected {
    background: #ffebee;
  }

  .status-connecting {
    background: #fff3e0;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .dot-connected {
    background: #4caf50;
  }

  .dot-disconnected {
    background: #f44336;
    animation: none;
  }

  .dot-connecting {
    background: #ff9800;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .status-text {
    font-size: 14px;
    font-weight: 500;
  }

  .connection-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .queue-badge {
    background: #ff9800;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  .connection-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
  }

  .connection-btn:hover:not(:disabled) {
    opacity: 0.8;
  }

  .error-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message {
    padding: 10px;
    border-radius: 8px;
    max-width: 70%;
  }

  .message.user {
    background: #e3f2fd;
    align-self: flex-start;
  }

  .message.system {
    background: #f5f5f5;
    color: #666;
    font-style: italic;
    align-self: center;
    max-width: 90%;
  }

  .message.broadcast {
    background: #fff3e0;
    align-self: center;
    max-width: 80%;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 12px;
  }

  .sender {
    font-weight: bold;
    color: #1976d2;
  }

  .time {
    color: #999;
  }

  .message-content {
    word-wrap: break-word;
  }

  .input-area {
    display: flex;
    gap: 10px;
    padding: 20px;
    background: white;
    border-top: 1px solid #e0e0e0;
  }

  .message-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .message-input:focus {
    outline: none;
    border-color: #1976d2;
  }

  .send-btn {
    padding: 10px 20px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
  }

  .send-btn:hover:not(:disabled) {
    background: #1565c0;
  }

  .send-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .users-panel {
    position: fixed;
    right: 20px;
    top: 80px;
    width: 200px;
    background: white;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .users-panel h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
  }

  .users-panel ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .users-panel li {
    padding: 4px 0;
    font-size: 12px;
    color: #666;
  }
</style>
