<template>
  <!-- 折叠分区：参考群晖 DSM 控制面板的分组标题样式 -->
  <section class="dsm-section" :class="{ 'is-open': open }">
    <button
      type="button"
      class="dsm-section__head"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg class="dsm-section__chevron" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3.6 10.2 8 5.8l4.4 4.4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="dsm-section__title">{{ title }}</span>
    </button>

    <div class="dsm-section__divider" :class="{ 'is-dashed': dashed }"></div>

    <div v-show="open" class="dsm-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DsmSection' })

  const props = withDefaults(
    defineProps<{
      /** 分区标题 */
      title: string
      /** 分隔线是否为虚线（弹窗内使用） */
      dashed?: boolean
      /** 默认是否展开 */
      defaultOpen?: boolean
    }>(),
    { dashed: false, defaultOpen: true }
  )

  const open = ref(props.defaultOpen)
</script>
