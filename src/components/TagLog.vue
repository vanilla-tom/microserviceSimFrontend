<template>
  <div class="tag-log">
    <div v-if="!logs || logs.length === 0" class="log-empty">
      <el-empty description="暂无日志" />
    </div>
    <div v-else class="log-list" ref="listEl">
      <div v-for="(entry, index) in logs" :key="index" class="log-entry">
        <span class="log-time">{{ formatTime(entry.time) }}</span>
        <span class="log-message">{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  logs: { type: Array, default: () => [] },
})

const listEl = ref(null)

watch(() => props.logs, async () => {
  await nextTick()
  if (listEl.value) {
    listEl.value.scrollTop = listEl.value.scrollHeight
  }
})

function formatTime(ms) {
  if (ms == null) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}分${String(seconds).padStart(2, '0')}秒`
}
</script>

<style scoped>
.tag-log {
  width: 100%;
}

.log-empty {
  padding: 40px 0;
}

.log-list {
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.log-entry {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 9px 10px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  transition: background-color 0.15s;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry:hover {
  background: #f8fafc;
}

.log-time {
  flex-shrink: 0;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #0369a1;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  min-width: 68px;
  text-align: center;
}

.log-message {
  color: #1e293b;
  line-height: 1.5;
  word-break: break-all;
}

.log-list::-webkit-scrollbar {
  width: 6px;
}

.log-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
</style>
