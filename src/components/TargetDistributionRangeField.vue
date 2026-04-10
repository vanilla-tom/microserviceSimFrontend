<template>
  <el-form-item :label="label">
    <div class="range-row">
      <el-input-number
        :model-value="modelValue[0]"
        :disabled="disabled"
        :step="step"
        class="range-input"
        @update:model-value="updateValue(0, $event)"
      />
      <span class="range-separator">至</span>
      <el-input-number
        :model-value="modelValue[1]"
        :disabled="disabled"
        :step="step"
        class="range-input"
        @update:model-value="updateValue(1, $event)"
      />
    </div>
  </el-form-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  step: {
    type: Number,
    default: 1,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

function updateValue(index, value) {
  const next = [...props.modelValue]
  next[index] = value
  emit('update:modelValue', next)
}
</script>

<style scoped>
.range-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.range-input {
  flex: 1;
}

.range-separator {
  color: #667085;
  font-size: 13px;
}
</style>
