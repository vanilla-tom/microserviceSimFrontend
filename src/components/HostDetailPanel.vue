<template>
  <el-drawer
    :model-value="visible"
    :title="`Host ${host?.host_id || ''} 详情`"
    direction="rtl"
    size="500px"
    @close="$emit('close')"
  >
    <div v-if="host" class="host-detail">
      <!-- Current Stats -->
      <el-card class="stats-card" shadow="never">
        <template #header>
          <span>当前状态</span>
        </template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="CPU利用率">
            <el-progress
              :percentage="host.cpu_usage * 100"
              :color="getProgressColor(host.cpu_usage)"
              :stroke-width="10"
            />
          </el-descriptions-item>
          <el-descriptions-item label="内存利用率">
            <el-progress
              :percentage="host.memory_usage * 100"
              :color="getProgressColor(host.memory_usage)"
              :stroke-width="10"
            />
          </el-descriptions-item>
          <el-descriptions-item label="VM数量">
            <el-tag>{{ host.vm_count }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- History Charts -->
      <el-card class="chart-card" shadow="never" v-loading="historyLoading">
        <template #header>
          <div class="card-header">
            <span>历史趋势</span>
            <el-select v-model="timeWindow" size="small" style="width: 100px">
              <el-option label="30秒" :value="30" />
              <el-option label="1分钟" :value="60" />
            </el-select>
          </div>
        </template>
        <div class="charts-container">
          <div class="chart-wrapper">
            <h4>CPU利用率</h4>
            <v-chart class="chart" :option="cpuChartOption" autoresize />
          </div>
          <div class="chart-wrapper">
            <h4>内存利用率</h4>
            <v-chart class="chart" :option="memoryChartOption" autoresize />
          </div>
        </div>
      </el-card>

      <!-- VM List -->
      <el-card class="vm-card" shadow="never">
        <template #header>
          <span>虚拟机列表</span>
        </template>
        <el-collapse v-model="activeVm">
          <el-collapse-item
            v-for="vm in host.vms"
            :key="vm.vm_id"
            :name="vm.vm_id"
          >
            <template #title>
              <div class="vm-title">
                <span class="vm-id">{{ vm.vm_id }}</span>
                <el-tag size="small">{{ vm.vm_type }}</el-tag>
                <span class="vm-stats">
                  队列: {{ vm.queue_length }} | 运行: {{ vm.running_length }}
                </span>
              </div>
            </template>
            
            <!-- VM History Charts -->
            <div class="vm-charts" v-loading="vmHistoryLoading[vm.vm_id]">
              <div class="vm-chart-row">
                <div class="vm-chart">
                  <span class="chart-title">内存使用 (MB)</span>
                  <v-chart
                    class="mini-chart"
                    :option="getVmChartOption(vm.vm_id, 'memory')"
                    autoresize
                  />
                </div>
                <div class="vm-chart">
                  <span class="chart-title">队列长度</span>
                  <v-chart
                    class="mini-chart"
                    :option="getVmChartOption(vm.vm_id, 'queue')"
                    autoresize
                  />
                </div>
                <div class="vm-chart">
                  <span class="chart-title">运行任务</span>
                  <v-chart
                    class="mini-chart"
                    :option="getVmChartOption(vm.vm_id, 'running')"
                    autoresize
                  />
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import { simulationApi } from '@/api/simulation'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  host: {
    type: Object,
    default: null,
  },
  currentSimTime: {
    type: Number,
    default: 0,
  },
  taskId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'fetchHistory'])

const timeWindow = ref(60)
const activeVm = ref([])
const historyLoading = ref(false)
const vmHistoryLoading = ref({})
const hostHistory = ref(null)
const vmHistories = ref({})

async function fetchHistory({ type, hostId, vmId, startTime, endTime }) {
  try {
    if (type === 'host') {
      return await simulationApi.getHostHistory(props.taskId, hostId, startTime, endTime)
    } else if (type === 'vm') {
      return await simulationApi.getVmHistory(props.taskId, vmId, startTime, endTime)
    }
  } catch (err) {
    console.error('Failed to fetch history:', err)
    return null
  }
}

// Watch for host changes to fetch history
watch(() => props.host, async (newHost) => {
  if (newHost && props.visible) {
    await fetchHostHistory()
  }
})

watch(() => props.currentSimTime, async () => {
  if (props.host && props.visible) {
    await fetchHostHistory()
  }
})

watch(timeWindow, async () => {
  if (props.host && props.visible) {
    vmHistories.value = {}
    await fetchHostHistory()
  }
})

watch(activeVm, async (vms) => {
  // Fetch history for newly expanded VMs
  for (const vmId of vms) {
    if (!vmHistories.value[vmId]) {
      await fetchVmHistory(vmId)
    }
  }
})

async function fetchHostHistory() {
  if (!props.host) return
  
  historyLoading.value = true
  try {
    const endTime = props.currentSimTime
    const startTime = endTime - timeWindow.value * 1000
    const data = await fetchHistory({
      type: 'host',
      hostId: props.host.host_id,
      startTime,
      endTime,
    })
    if (data) {
      hostHistory.value = data
    }
  } finally {
    historyLoading.value = false
  }
}

async function fetchVmHistory(vmId) {
  vmHistoryLoading.value[vmId] = true
  try {
    const endTime = props.currentSimTime
    const startTime = endTime - timeWindow.value * 1000
    const data = await fetchHistory({
      type: 'vm',
      vmId,
      startTime,
      endTime,
    })
    if (data) {
      vmHistories.value[vmId] = data
    }
  } finally {
    vmHistoryLoading.value[vmId] = false
  }
}

function getProgressColor(value) {
  if (value > 0.8) return '#f56c6c'
  if (value > 0.6) return '#e6a23c'
  return '#67c23a'
}

function normalizeTimeData(rawData) {
  if (!rawData || rawData.length === 0) return []
  if (Array.isArray(rawData[0])) {
    // [[x, y], ...] format — x is absolute sim-time in seconds; make relative
    const minX = rawData[0][0]
    return rawData.map(([x, y]) => [+(x - minX).toFixed(1), y])
  } else {
    // [y, y, ...] format — use index as x (sample index)
    return rawData.map((y, i) => [i, y])
  }
}

function buildUsageChartOption(rawData, color) {
  const data = normalizeTimeData(rawData)
  const maxX = data.length > 0 ? data[data.length - 1][0] : timeWindow.value
  const isPairFormat = rawData.length > 0 && Array.isArray(rawData[0])

  // Compute y-axis range from data with padding
  let yMin = 0
  let yMax = 1
  if (data.length > 0) {
    const yValues = data.map(([, y]) => y)
    const dataMin = Math.min(...yValues)
    const dataMax = Math.max(...yValues)
    const span = dataMax - dataMin || 0.05  // avoid zero span when flat line
    const pad = span * 0.3
    yMin = Math.max(0, dataMin - pad)
    yMax = Math.min(1, dataMax + pad)
    // Round to 2 decimal places for cleaner tick values
    yMin = Math.floor(yMin * 100) / 100
    yMax = Math.ceil(yMax * 100) / 100
  }

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        const xLabel = isPairFormat ? `${p.value[0]}s` : `#${p.value[0]}`
        return `${xLabel}<br/>${(p.value[1] * 100).toFixed(1)}%`
      },
    },
    grid: { left: '20%', right: '8%', top: '12%', bottom: '22%' },
    xAxis: {
      type: 'value',
      min: 0,
      max: maxX || timeWindow.value,
      name: isPairFormat ? 's' : '',
      nameLocation: 'end',
      nameGap: 4,
      nameTextStyle: { fontSize: 11, color: '#909399' },
      splitNumber: 4,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitNumber: 4,
      axisLabel: {
        fontSize: 11,
        formatter: v => `${(v * 100).toFixed(1)}%`,
      },
    },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color },
      areaStyle: { opacity: 0.2, color },
    }],
  }
}

const cpuChartOption = computed(() => {
  const rawData = hostHistory.value?.series?.cpu?.data || []
  return buildUsageChartOption(rawData, '#5470c6')
})

const memoryChartOption = computed(() => {
  const rawData = hostHistory.value?.series?.memory?.data || []
  return buildUsageChartOption(rawData, '#91cc75')
})

function getVmChartOption(vmId, seriesKey) {
  const data = vmHistories.value[vmId]?.series?.[seriesKey]?.data || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '15%', right: '5%', top: '10%', bottom: '20%' },
    xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1 },
    }],
  }
}
</script>

<style scoped>
.host-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card,
.chart-card,
.vm-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.charts-container {
  display: flex;
  gap: 16px;
}

.chart-wrapper {
  flex: 1;
}

.chart-wrapper h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #606266;
}

.chart {
  height: 180px;
}

.vm-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.vm-id {
  font-weight: 500;
}

.vm-stats {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.vm-charts {
  padding: 8px 0;
}

.vm-chart-row {
  display: flex;
  gap: 12px;
}

.vm-chart {
  flex: 1;
}

.chart-title {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.mini-chart {
  height: 80px;
}
</style>
