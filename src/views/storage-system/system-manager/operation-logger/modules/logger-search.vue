<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 表单数据双向绑定
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {
    // userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }


  // 表单配置
  const formItems = computed(() => [
    {
      label: '日志类型',
      key: 'logType',
      type: 'input',
      placeholder: '请输入日志类型 INFO ERROR SYSTEM',
      clearable: true
    },
    {
      label: '操作用户',
      key: 'operationOwner',
      type: 'input',
      props: { placeholder: '请输入操作用户' }
    },
    {
      label: '日志信息',
      key: 'operationMessage_Zh',
      type: 'input',
      props: { placeholder: '请输入日志信息' }
    }
  ])

  // 事件
  function handleReset() {
    console.log('重置表单')
    emit('reset')
  }

  async function handleSearch() {
    await searchBarRef.value.validate()
    emit('search', formData.value)
    console.log('表单数据', formData.value)
  }
</script>
