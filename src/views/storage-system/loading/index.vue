<template>
  <div v-show="visible" class="custom-loading-overlay">
    <div class="custom-loading-container">
      <!-- 方块加载动画 -->
      <div class="square-loader">
        <div class="square-box"></div>
      </div>
      <div class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const visible = ref(true)
  const text = ref('加载中...')

  const open = (msg?: string) => {
    if (msg) text.value = msg
    visible.value = true
  }

  const close = () => {
    visible.value = false
  }

  defineExpose({ open, close })
</script>

<style scoped>
  /* 全屏遮罩 */
  .custom-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  }

  .custom-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  /* 方块容器 */
  .square-loader {
    width: 40px;
    height: 40px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 方块本体 */
  .square-box {
    width: 32px;
    height: 32px;
    background-color: #ffffff;
    border-radius: 4px;
    animation: square-anim 1.2s infinite ease-in-out;
  }

  /* 方块动画：旋转 + 缩放 */
  @keyframes square-anim {
    0% {
      transform: scale(0.8) rotate(0deg);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.1) rotate(180deg);
      opacity: 1;
    }
    100% {
      transform: scale(0.8) rotate(360deg);
      opacity: 0.6;
    }
  }

  .loading-text {
    font-size: 14px;
    color: #fff;
  }
</style>
