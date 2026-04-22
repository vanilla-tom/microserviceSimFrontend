<template>
  <div class="sensor-panel">
    <div v-if="!sensors || sensors.length === 0" class="empty-state">
      <el-empty description="暂无传感器数据" />
    </div>
    <div v-else class="sensor-list">
      <div v-for="sensor in sensors" :key="sensor.id" class="sensor-row-wrapper">
        <div class="sensor-row" :class="{ disabled: !sensor.status }" @click="sensor.status && toggleSensor(sensor.id)">
          <div class="sensor-row-left">
            <el-icon class="expand-icon" :class="{ expanded: expandedId === sensor.id }">
              <ArrowRight />
            </el-icon>
            <span class="sensor-id-label">Sensor {{ sensor.id }}</span>
          </div>
          <el-tag
            :type="sensor.status ? 'success' : 'danger'"
            size="small"
            effect="plain"
          >
            {{ sensor.status ? '正常' : '已损毁' }}
          </el-tag>
        </div>

        <div v-if="expandedId === sensor.id" class="sensor-detail">
          <div v-if="detailLoading" class="detail-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中…</span>
          </div>
          <template v-else-if="hasDetailRows(sensor.id)">
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
                  <tr v-for="(data, index) in getDetailRows(sensor.id)" :key="index">
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
          </template>
          <div v-else class="detail-empty">无数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowRight, Loading, Timer } from '@element-plus/icons-vue'
import { simulationApi } from '@/api/simulation'

const props = defineProps({
  sensors: { type: Array, default: () => [] },
  taskId: { type: String, default: '' },
  simTime: { type: Number, default: 0 },
})

const expandedId = ref(null)
const detailCache = ref({})
const detailLoading = ref(false)

watch(() => props.simTime, () => {
  detailCache.value = {}
  expandedId.value = null
})

async function toggleSensor(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  if (detailCache.value[id] !== undefined) return

  detailLoading.value = true
  try {
    const data = await simulationApi.getDetector(props.taskId, props.simTime, id)
    detailCache.value[id] = data ?? null
  } catch {
    detailCache.value[id] = null
  } finally {
    detailLoading.value = false
  }
}

function formatTime(ms) {
  if (!ms && ms !== 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}分${seconds}秒`
}

function getDetailRows(id) {
  const detail = detailCache.value[id]
  if (Array.isArray(detail)) return detail
  if (Array.isArray(detail?.datas)) return detail.datas
  return []
}

function hasDetailRows(id) {
  return getDetailRows(id).length > 0
}

function formatSourceData(item) {
  const parts = []
  if (item.azimuth_deg !== undefined) parts.push(`azimuth_deg ${item.azimuth_deg.toFixed(2)}°`)
  if (item.elevation_deg !== undefined) parts.push(`elevation_deg ${item.elevation_deg.toFixed(2)}°`)
  if (item.slant_range_km !== undefined) parts.push(`slant_range_km ${item.slant_range_km.toFixed(2)}km`)
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
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
}

.sensor-row-wrapper {
  border-bottom: 1px solid #f1f5f9;
}

.sensor-row-wrapper:last-child {
  border-bottom: none;
}

.sensor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.15s;
  user-select: none;
}

.sensor-row:hover:not(.disabled) {
  background: #f8fafc;
}

.sensor-row.disabled {
  cursor: default;
  opacity: 0.55;
}

.sensor-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-icon {
  font-size: 13px;
  color: #94a3b8;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.sensor-id-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* Detail area */
.sensor-detail {
  padding: 12px 8px 16px;
  background: #f8fafc;
  border-radius: 0 0 8px 8px;
}

.detail-loading,
.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: #94a3b8;
  font-size: 13px;
}

.detail-loading .el-icon {
  font-size: 18px;
}

/* Table */
.sensor-table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
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
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.sensor-table th:first-child { border-top-left-radius: 10px; }
.sensor-table th:last-child  { border-top-right-radius: 10px; }

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
  transition: background-color 0.2s;
}

.sensor-table tbody tr:hover {
  background-color: #f1f5f9;
}

.sensor-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #cbd5e1;
  vertical-align: middle;
}

.sensor-table tbody tr:last-child td { border-bottom: none; }

.col-id     { width: 70px; text-align: center; }
.col-time   { width: 140px; }
.col-source { width: auto; }

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

.time-cell .el-icon { color: #0284c7; font-size: 14px; }

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
  background: #fff;
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

.sensor-list::-webkit-scrollbar,
.sensor-table tbody::-webkit-scrollbar,
.sensor-table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.sensor-list::-webkit-scrollbar-track,
.sensor-table tbody::-webkit-scrollbar-track,
.sensor-table-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.sensor-list::-webkit-scrollbar-thumb,
.sensor-table tbody::-webkit-scrollbar-thumb,
.sensor-table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
</style>
