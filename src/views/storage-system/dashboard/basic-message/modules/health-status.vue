<template>
  <div class="system-alarm-container">
    <!-- 模块标题 -->
    <div class="alarm-title">系统警报</div>

    <!-- 内容布局容器 -->
    <div class="alarm-content">
      <!-- 警告项 -->
      <div class="alarm-item">
        <div class="alarm-icon warning-icon">
          <!-- 警告三角图标 -->
          <svg viewBox="0 0 1024 1024" width="64" height="64">
            <path d="M512 64L64 896h896L512 64zm0 192l128 448H384l128-448z" fill="#868686" />
            <path d="M480 448h64v128h-64zm0 160h64v64h-64z" fill="#ffffff" />
          </svg>
        </div>
        <div class="alarm-label">警告</div>
        <div class="alarm-count">{{ warningCount }}</div>
      </div>

      <!-- 异常项 -->
      <div class="alarm-item">
        <div class="alarm-icon error-icon">
          <!-- 异常八边形禁止图标 -->
          <svg viewBox="0 0 1024 1024" width="64" height="64">
            <path
              d="M742.4 64H281.6L64 281.6v460.8L281.6 960h460.8L960 742.4V281.6L742.4 64zM512 640h-64V384h64v256z"
              fill="#868686"
            />
          </svg>
        </div>
        <div class="alarm-label">异常</div>
        <div class="alarm-count">{{ errorCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 动态数据 props，可从父组件传入接口数据
  const props = defineProps({
    // 警告数量，默认值对应截图 2
    warningCount: {
      type: Number,
      default: 2
    },
    // 异常数量，默认值对应截图 0
    errorCount: {
      type: Number,
      default: 0
    }
  })
</script>

<style scoped>
  /* 外层容器，和你之前存储概览卡片样式完全统一 */
  .system-alarm-container {
    padding: 20px;
    height: 80%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  }

  /* 模块大标题，左上角标题文字 */
  .alarm-title {
    font-size: 20px;
    font-weight: 500;
    color: #666666;
    margin-bottom: 48px;
  }

  /* 两个卡片横向布局容器 */
  .alarm-content {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
  }

  /* 单个警告/异常项 垂直居中布局（图标-文字-数字 从上到下） */
  .alarm-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  /* 图标容器 */
  .alarm-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 文字标签（警告/异常），原图亮绿色 */
  .alarm-label {
    font-size: 24px;
    color: #36b347;
    font-weight: 500;
  }

  /* 底部数字 */
  .alarm-count {
    font-size: 36px;
    color: #36b347;
    font-weight: 600;
    line-height: 1;
  }

  /* ========== 响应式适配，和之前组件移动端规则统一 ========== */
  @media (max-width: 768px) {
    .alarm-title {
      font-size: 18px;
      margin-bottom: 32px;
    }
    .alarm-label {
      font-size: 20px;
    }
    .alarm-count {
      font-size: 30px;
    }
    .alarm-icon svg {
      width: 52px;
      height: 52px;
    }
  }

  @media (max-width: 480px) {
    .alarm-content {
      flex-direction: column;
      gap: 40px;
    }
  }
</style>
