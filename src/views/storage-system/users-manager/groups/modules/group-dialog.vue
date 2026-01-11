<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户组' : '编辑用户组'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="用户组名" prop="groupName">
        <ElInput v-model="formData.groupName" placeholder="用户组名" />
      </ElFormItem>
      <ElFormItem label="用户组别名" prop="groupAlias">
        <ElInput v-model="formData.groupAlias" placeholder="用户组别名" />
      </ElFormItem>
      <ElFormItem label="描述信息" prop="groupDesc">
        <ElInput v-model="formData.groupDesc" placeholder="用户组描述信息" />
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
    groupData?: Partial<Api.Sys.SysGroup>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'groupAddSubmit', formData: Api.Sys.SysGroup): void
    (e: 'groupEditSubmit', formData: Api.Sys.SysGroup): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    groupName: '',
    groupAlias: '',
    groupDesc: ''
  })

  // 表单验证规则
  const rules: FormRules = {
    groupName: [
      { required: true, message: '请输入用户组名', trigger: 'blur' },
      { min: 2, max: 32, message: '长度在 2 到 32 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z_][a-zA-Z0-9_-]{0,31}$/,
        message: '用户组名格式仅支持字母、数字、下划线、连字符的组合',
        trigger: 'blur'
      }
    ],
    groupAlias: [
      { required: true, message: '请输如用户组别名', trigger: 'blur' },
      { min: 2, max: 32, message: '用户组别名长度再2~32个字符之间', trigger: 'blur' }
    ],
    groupDesc: [{ required: false, message: '输出描述信息', trigger: 'blur' }]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.groupData
    const row = props.groupData
    Object.assign(formData, {
      groupName: isEdit && row ? row.groupName || '' : '',
      groupAlias: isEdit && row ? row.groupAlias || '' : '',
      groupDesc: isEdit && row ? row.groupDesc || '' : ''
    })
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, formData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        if (dialogType.value == 'add') {
          emit('groupAddSubmit', formData)
        } else {
          emit('groupEditSubmit', formData)
        }
      }
    })
  }
</script>
