<template>
  <ElDialog v-model="dialogVisible" title="重命名" width="30%" align-center>
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="文件名称" :prop="fileInfo.name">
        <ElInput v-model="formData.name" placeholder="请输入重命名名称" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    fileInfo: any
  }

  interface Emits {
    (e: 'update:visible', value: any): void
    (e: 'submitRename', formData: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()

  const formData = reactive({
    name: ''
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入重命名名称', trigger: 'blur' },
      { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' },
      {
        pattern: /^[^\\/:*?"<>|]+$/,
        message: '不能包含 \\ / : * ? " < > | 等特殊字符',
        trigger: 'blur'
      }
    ]
  }

  const initFormData = () => {
    if (props.fileInfo) formData.name = props.fileInfo.name
  }

  watch(
    () => [props.visible],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => formRef.value?.clearValidate())
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        Object.assign(props.fileInfo, { name: formData.name })
        emit('submitRename', props.fileInfo) // 抛出数据
        dialogVisible.value = false
      }
    })
  }
</script>
