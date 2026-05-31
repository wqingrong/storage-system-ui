import { createVNode, render, VNode } from 'vue'
import Loading from './index.vue'

let loadingInstance: VNode | null = null
let container: HTMLElement | null = null

export const loading = {
  open(text?: string) {
    // 防止重复打开
    if (loadingInstance) return

    // 1. 创建容器
    container = document.createElement('div')
    document.body.appendChild(container)

    // 2. 创建 VNode
    loadingInstance = createVNode(Loading, {
      text: text || '加载中...'
    })

    // 3. 渲染到容器
    render(loadingInstance, container)
  },

  close() {
    if (!loadingInstance || !container) return

    // 4. 调用组件内部关闭方法
    loadingInstance.component?.exposed?.close()

    // 5. 销毁实例
    setTimeout(() => {
      if (container) {
        render(null, container)
        document.body.removeChild(container)
        loadingInstance = null
        container = null
      }
    }, 100)
  }
}
