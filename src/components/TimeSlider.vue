<template>
  <div class="time-slider">
    <div class="time-top">
      <div class="status-row">
        <span class="timestamp">
          当前时间 {{ formatTime(sliderValue) }}
        </span>
        <span class="timestamp muted">
          仿真时间范围 {{ formatTime(dataMinTimestamp) }} - {{ formatTime(dataMaxTimestamp) }}
        </span>
      </div>
      <div class="action-row">
        <el-button @click="$emit('step-back')" :disabled="!canStepBack">回退</el-button>
        <el-button @click="$emit('step-forward')" :disabled="!canStepForward">前进</el-button>
        <el-button type="primary" plain @click="$emit('reset-latest')">回到最新</el-button>
      </div>
    </div>

    <el-slider
      :model-value="sliderValue"
      :min="dataMinTimestamp"
      :max="dataMaxTimestamp || dataMinTimestamp"
      :step="1000"
      :format-tooltip="formatTime"
      @input="handleSliderInput"
      @change="handleSliderChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  currentTimestamp: { type: Number, default: 0 },
  dataMinTimestamp: { type: Number, default: 0 },
  dataMaxTimestamp: { type: Number, default: 0 },
  canStepBack: { type: Boolean, default: false },
  canStepForward: { type: Boolean, default: false },
})

const emit = defineEmits(['seek', 'step-back', 'step-forward', 'reset-latest'])
const sliderValue = ref(props.currentTimestamp)

watch(() => props.currentTimestamp, (value) => {
  sliderValue.value = value
}, { immediate: true })

function handleSliderInput(value) {
  sliderValue.value = value
}

function handleSliderChange(value) {
  sliderValue.value = value
  emit('seek', value)
}

function formatTime(value) {
  const totalSeconds = Math.floor(value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hours = Math.floor(minutes / 60)
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
</script>

<style scoped>
.time-slider {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #d6dde8;
}

.time-top,
.status-row,
.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-top {
  justify-content: space-between;
}

.timestamp {
  font-size: 13px;
  color: #0f172a;
}

.timestamp.muted {
  color: #64748b;
}
</style>
