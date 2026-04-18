import { defineStore } from 'pinia'
import { useWebSocketDaemon } from '@utils/websocket'
export const websocketStore = defineStore('websocket', {
  state: () => ({
    // 这里会保存全局唯一的 ws 实例
    instance: null
  }),

  actions: {
    // 初始化全局 WebSocket（只调用一次）
    initGlobalWS(userId = '0', username = 'admin') {
      if (this.instance) {
        console.log('✅ WebSocket 已存在，不再重复创建')
        return this.instance
      }

      // 你原来的代码 👇 完全不变
      const ws = useWebSocketDaemon({
        url: `ws://localhost:9090/ws/ws?userId=${userId}&username=${username}`,
        reconnect: true,
        reconnectInterval: 3000,
        reconnectAttempts: 10,
        autoPong: false,
        heartbeatInterval: 30000,
        maxQueueSize: 500,
        heartbeatTimeout: 50000,
        debug: import.meta.env.DEV
      })
      this.instance = ws
      console.log('🌍 全局 WebSocket 已创建')
      return ws
    },

    // 获取全局实例（组件用）
    getWS() {
      if (!this.instance) {
        throw new Error('❌ 请先调用 initGlobalWS 初始化 WebSocket')
      }
      return this.instance
    }
  }
})
