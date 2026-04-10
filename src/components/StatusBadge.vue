<template>
  <el-tag :type="tagType" :size="size" effect="light">
    {{ statusText }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'default',
  },
})

const tagType = computed(() => {
  const typeMap = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return typeMap[props.status] || 'info'
})

const statusText = computed(() => {
  const textMap = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  }
  return textMap[props.status] || props.status
})
</script>
