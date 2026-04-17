<template>
  <div class="sensor-panel">
    <div v-if="!sensors || sensors.length === 0" class="empty-state">
      <el-empty description="暂无传感器数据" />
    </div>
    <div v-else class="sensor-list">
      <div
          v-for="sensor in sensors"
          :key="sensor.id"
          class="sensor-card"
      >
        <div class="sensor-header">
          <div class="sensor-title-wrapper">
            <span class="sensor-icon">
              <el-icon><Cpu /></el-icon>
            </span>
            <span class="sensor-title">Sensor {{ sensor.id }}</span>
          </div>
          <el-tag size="small" type="info" effect="plain">{{ sensor.datas?.length || 0 }} 条记录</el-tag>
        </div>
        <div class="sensor-table-wrapper">
          <table class="sensor-table">
            <thead>
            <tr>
              <th class="col-id">ID</th>
              <th class="col-time">Time</th>
              <th class="col-source">SourceData</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="(data, index) in sensor.datas"
                :key="index"
            >
              <td class="col-id">
                <span class="id-badge">{{ index + 1 }}</span>
              </td>
              <td class="col-time">
                <div class="time-cell">
                  <el-icon><Timer /></el-icon>
                  <span>{{ formatTime(data.time) }}</span>
                </div>
              </td>
              <td class="col-source">
                <div class="source-data">
                  <div
                      v-for="(item, idx) in data.source_data"
                      :key="idx"
                      class="source-data-item"
                  >
                    <span class="data-label">Target {{ item.local_target_id }}</span>
                    <span class="data-value">{{ formatSourceData(item) }}</span>
                  </div>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Cpu, Timer } from '@element-plus/icons-vue'

defineProps({
  sensors: {
    type: Array,
    default: () => [],
  },
})

function formatTime(ms) {
  if (!ms && ms !== 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}分${seconds}秒`
}

function formatSourceData(item) {
  const parts = []
  if (item.azimuth_deg !== undefined) {
    parts.push(`azimuth_deg ${item.azimuth_deg.toFixed(2)}°`)
  }
  if (item.elevation_deg !== undefined) {
    parts.push(`elevation_deg ${item.elevation_deg.toFixed(2)}°`)
  }
  if (item.slant_range_km !== undefined) {
    parts.push(`slant_range_km ${item.slant_range_km.toFixed(2)}km`)
  }
  return parts.join(' · ')
}
</script>

<style scoped>
.sensor-panel {
  width: 100%;
}

.empty-state {
  padding: 40px 0;
}

.sensor-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(3 * 200px);
  overflow-y: auto;
  padding-right: 4px;
}

.sensor-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.sensor-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.sensor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.sensor-title-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sensor-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 10px;
  color: white;
  font-size: 18px;
}

.sensor-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
}

.sensor-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.sensor-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.sensor-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.sensor-table th {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.sensor-table th:first-child {
  border-top-left-radius: 12px;
}

.sensor-table th:last-child {
  border-top-right-radius: 12px;
}

.sensor-table tbody {
  display: block;
  max-height: calc(3 * 52px);
  overflow-y: auto;
}

.sensor-table thead,
.sensor-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.sensor-table tbody tr {
  transition: background-color 0.2s ease;
}

.sensor-table tbody tr:hover {
  background-color: #f8fafc;
}

.sensor-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 12px;
}

.sensor-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 12px;
}

.sensor-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.sensor-table tbody tr:last-child td {
  border-bottom: none;
}

/* 列宽定义 */
.col-id {
  width: 70px;
  text-align: center;
}

.col-time {
  width: 140px;
}

.col-source {
  width: auto;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
  font-weight: 700;
  font-size: 12px;
  border-radius: 8px;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  font-weight: 600;
  color: #0369a1;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 8px 12px;
  border-radius: 8px;
  width: fit-content;
}

.time-cell .el-icon {
  color: #0284c7;
  font-size: 14px;
}

.source-data {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-data-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.data-label {
  color: #64748b;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
  min-width: 70px;
}

.data-value {
  color: #334155;
  font-weight: 500;
  font-size: 12px;
}

/* 自定义滚动条样式 */
.sensor-table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.sensor-table-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.sensor-table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.sensor-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.sensor-table tbody::-webkit-scrollbar {
  width: 6px;
}

.sensor-table tbody::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.sensor-table tbody::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.sensor-table tbody::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* sensor-list 滚动条样式 */
.sensor-list::-webkit-scrollbar {
  width: 6px;
}

.sensor-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.sensor-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.sensor-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
