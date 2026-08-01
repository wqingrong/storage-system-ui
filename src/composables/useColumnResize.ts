import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 表格列宽拖拽调整 composable
 * @param elTableRef ElTable 组件实例的 ref
 */
export function useColumnResize(elTableRef: Ref<any>) {
  let resizeState: {
    startX: number
    startWidth: number
    targetTh: HTMLElement
    colIndex: number
    tableEl: HTMLElement
  } | null = null

  let guideLine: HTMLElement | null = null

  const MIN_COLUMN_WIDTH = 50

  /** 创建拖拽引导线 */
  const createGuideLine = (tableEl: HTMLElement) => {
    guideLine = document.createElement('div')
    guideLine.className = 'column-resize-guide-line'
    guideLine.style.cssText = `
      position: fixed;
      top: 0;
      width: 2px;
      height: 100vh;
      background-color: #409EFF;
      z-index: 99999;
      pointer-events: none;
      display: none;
    `
    document.body.appendChild(guideLine)
  }

  /** 更新引导线位置 */
  const updateGuideLine = (x: number) => {
    if (!guideLine) return
    guideLine.style.left = `${x}px`
    guideLine.style.display = 'block'
  }

  /** 隐藏引导线 */
  const hideGuideLine = () => {
    if (guideLine) {
      guideLine.style.display = 'none'
    }
  }

  /** 移除引导线 */
  const removeGuideLine = () => {
    if (guideLine) {
      guideLine.remove()
      guideLine = null
    }
  }

  /** 更新所有 colgroup 中对应列的宽度 */
  const updateColumnWidth = (tableEl: HTMLElement, colIndex: number, width: number) => {
    const colgroups = tableEl.querySelectorAll<HTMLElement>('colgroup')
    colgroups.forEach((colgroup) => {
      const cols = colgroup.querySelectorAll<HTMLElement>('col')
      if (cols[colIndex]) {
        cols[colIndex].style.width = `${width}px`
      }
    })

    // 同时更新所有 wrapper 中的表格（Element Plus 每个 wrapper 有独立的 table）
    const wrappers = tableEl.querySelectorAll<HTMLElement>(
      '.el-table__header-wrapper, .el-table__body-wrapper, .el-table__footer-wrapper'
    )
    wrappers.forEach((wrapper) => {
      const innerTable = wrapper.querySelector<HTMLElement>('table')
      if (innerTable) {
        const colgroup = innerTable.querySelector<HTMLElement>('colgroup')
        if (colgroup) {
          const cols = colgroup.querySelectorAll<HTMLElement>('col')
          if (cols[colIndex]) {
            cols[colIndex].style.width = `${width}px`
          }
        }
      }
    })
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!resizeState) return

    updateGuideLine(e.clientX)

    requestAnimationFrame(() => {
      if (!resizeState) return
      const deltaX = e.clientX - resizeState.startX
      const newWidth = Math.max(MIN_COLUMN_WIDTH, resizeState.startWidth + deltaX)
      updateColumnWidth(resizeState.tableEl, resizeState.colIndex, newWidth)
    })
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    hideGuideLine()
    // 延迟移除引导线，让视觉上有短暂停留
    setTimeout(() => {
      removeGuideLine()
    }, 100)
    resizeState = null
  }

  const onMouseDown = (e: MouseEvent) => {
    const handle = e.target as HTMLElement
    const th = handle.closest('th') as HTMLElement
    if (!th) return

    e.preventDefault()
    e.stopPropagation()

    const tableEl = th.closest('.el-table') as HTMLElement
    if (!tableEl) return

    // 通过 th 在兄弟节点中的位置来确定列索引
    const headerRow = th.parentElement
    if (!headerRow) return

    const allThs = Array.from(headerRow.querySelectorAll<HTMLElement>('th'))
    const colIndex = allThs.indexOf(th)
    if (colIndex < 0) return

    const rect = th.getBoundingClientRect()

    resizeState = {
      startX: e.clientX,
      startWidth: rect.width,
      targetTh: th,
      colIndex,
      tableEl
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    // 创建引导线
    if (!guideLine) {
      createGuideLine(tableEl)
    }
    updateGuideLine(e.clientX)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp, { once: true })
  }

  const setupResizeHandles = () => {
    const tableEl = elTableRef.value?.$el || elTableRef.value
    if (!tableEl) return

    // 清除旧的手柄
    tableEl.querySelectorAll('.column-resize-handle').forEach((el: HTMLElement) => el.remove())

    const headerWrapper = tableEl.querySelector('.el-table__header-wrapper')
    if (!headerWrapper) return

    const ths = headerWrapper.querySelectorAll<HTMLElement>('th')
    ths.forEach((th) => {
      const cellClass = th.className || ''
      // 跳过 selection 和 expand 列
      if (
        cellClass.includes('el-table__cell--selection') ||
        cellClass.includes('el-table__cell--expand')
      ) {
        return
      }

      const handle = document.createElement('div')
      handle.className = 'column-resize-handle'
      handle.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 8px;
        cursor: col-resize;
        z-index: 10;
        border-left: 1px solid #ebeef5;
      `
      handle.addEventListener('mouseenter', () => {
        handle.style.background = 'rgba(0, 0, 0, 0.06)'
        handle.style.borderLeft = '2px solid #409EFF'
      })
      handle.addEventListener('mouseleave', () => {
        handle.style.background = ''
        handle.style.borderLeft = '1px solid #ebeef5'
      })
      handle.addEventListener('mousedown', onMouseDown)
      // 阻止 click 事件冒泡到 th，避免触发表格排序
      handle.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation()
      })
      th.style.position = 'relative'
      th.appendChild(handle)
    })
  }

  onMounted(() => {
    setTimeout(() => {
      setupResizeHandles()
    }, 100)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    removeGuideLine()
  })

  return { setupResizeHandles }
}
