<template>
  <ElDialog v-model="dialogVisible" title="新建文件夹" width="30%" align-center>
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="文件夹名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入文件夹名称" />
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
    type: string
    fatherPath: string
  }

  interface Emits {
    (e: 'update:visible', value: any): void
    (e: 'createDirectory', formData: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()

  const formData = reactive({
    name: '',
    fatherPath: '',
    isSkip: false
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入文件夹名称', trigger: 'blur' },
      { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' },
      {
        pattern: /^[^\\/:*?"<>|]+$/,
        message: '不能包含 \\ / : * ? " < > | 等特殊字符',
        trigger: 'blur'
      }
    ]
  }

  const initFormData = () => {
    formData.name = ''
    formData.fatherPath = props.fatherPath
  }

  watch(
    () => [props.visible, props.type],
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
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    // 只回传后端 NewDirectoryParam 需要的字段（name / fatherPath / isSkip）
    emit('createDirectory', {
      name: formData.name.trim(),
      fatherPath: formData.fatherPath,
      isSkip: false
    })
    dialogVisible.value = false
  }
</script>
