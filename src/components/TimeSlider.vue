<template>
  <div class="time-slider">
    <div class="time-top">
      <div class="status-row">
        <el-tag :type="isLiveFollowing ? 'success' : 'info'">
          {{ isLiveFollowing ? '跟随实时' : '历史查看' }}
        </el-tag>
        <span class="timestamp">
          当前时间 {{ formatTime(currentTimestamp) }}
        </span>
        <span class="timestamp muted">
          数据时间范围 {{ formatTime(dataMinTimestamp) }} - {{ formatTime(dataMaxTimestamp) }}
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
      @update:model-value="$emit('seek', $event)"
    />

    <div class="time-bottom">
      <div class="window-picker">
        <span>显示窗口</span>
        <el-select :model-value="windowSizeMs" size="small" @update:model-value="$emit('update:window-size', $event)">
          <el-option label="30 秒" :value="30000" />
          <el-option label="1 分钟" :value="60000" />
          <el-option label="5 分钟" :value="300000" />
          <el-option label="10 分钟" :value="600000" />
        </el-select>
      </div>
      <span class="timestamp muted">
        当前窗口 {{ formatTime(visibleRange.start) }} - {{ formatTime(visibleRange.end) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentTimestamp: { type: Number, default: 0 },
  dataMinTimestamp: { type: Number, default: 0 },
  dataMaxTimestamp: { type: Number, default: 0 },
  windowSizeMs: { type: Number, default: 60000 },
  visibleRange: {
    type: Object,
    default: () => ({ start: 0, end: 0 }),
  },
  isLiveFollowing: { type: Boolean, default: true },
  canStepBack: { type: Boolean, default: false },
  canStepForward: { type: Boolean, default: false },
})

defineEmits(['seek', 'step-back', 'step-forward', 'reset-latest', 'update:window-size'])

const sliderValue = computed(() => props.currentTimestamp)

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
.time-bottom,
.status-row,
.action-row,
.window-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-top,
.time-bottom {
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
