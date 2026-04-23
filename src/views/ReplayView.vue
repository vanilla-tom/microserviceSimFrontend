<template>
  <div class="monitor-view">
    <div class="monitor-header">
      <div>
        <el-button plain @click="router.push('/')">← 返回首页</el-button>
        <h2>任务监控</h2>
        <p>实时监控与状态回放共用同一套时间轴和数据面板。</p>
      </div>
      <div class="header-actions">
        <StatusBadge v-if="task" :status="task.status" size="large" />
        <el-button
            v-if="task && (task.status === 'running' || task.status === 'pending')"
            type="danger"
            plain
            @click="cancelTask"
        >
          取消任务
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="content">
      <el-alert v-if="error" :title="error" type="error" show-icon />

      <template v-else-if="task">
        <div class="top-grid">
          <div class="info-strip">
            <div class="info-card">
              <span>任务编号</span>
              <strong>{{ task.task_id }}</strong>
            </div>
            <div class="info-card">
              <span>快照数</span>
              <strong>{{ summary.snapshot_count || 0 }}</strong>
            </div>
            <div class="info-card">
              <span>系统处理间断数</span>
              <strong>{{ summary.interruption_count ?? 0 }}</strong>
            </div>
            <div class="info-card">
              <span>仿真时间范围</span>
              <strong>{{ formatDuration(summary.sim_time_min ?? 0) }} – {{ formatDuration(summary.sim_time_max ?? 0) }}</strong>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <span>传感器数</span>
              <strong>{{ summary.detector_count || 0 }}</strong>
            </div>
            <div class="summary-card">
              <span>处理目标数峰值</span>
              <strong>{{ summary.target_count_peak || 0 }}</strong>
            </div>
            <div class="summary-card">
              <span>主机数峰值</span>
              <strong>{{ formatNumber(summary.host_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>微服务数峰值</span>
              <strong>{{ formatNumber(summary.vm_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>CPU 利用率峰值</span>
              <strong>{{ formatPercent(summary.cpu_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>内存利用率峰值</span>
              <strong>{{ formatPercent(summary.memory_stats?.peak) }}</strong>
            </div>
          </div>
        </div>

        <TimeSlider
            :current-timestamp="timeController.currentTimestamp.value"
            :data-min-timestamp="timeController.dataMinTimestamp.value"
            :data-max-timestamp="timeController.dataMaxTimestamp.value"
            :can-step-back="timeController.canStepBack.value"
            :can-step-forward="timeController.canStepForward.value"
            @seek="handleSeek"
            @step-back="handleStepBack"
            @step-forward="handleStepForward"
            @reset-latest="handleResetLatest"
        />

        <div class="panel-grid">
          <el-card class="main-panel" shadow="never">
            <template #header>
              <div class="panel-header">
                <span>集群快照</span>
                <span class="panel-hint">当前仿真时刻的集群状态</span>
              </div>
            </template>
            <HostGrid :hosts="snapshot.hosts || []" @select="selectHost" />
          </el-card>

          <el-card class="main-panel" shadow="never">
            <template #header>
              <div class="panel-header">
                <span>目标列表</span>
                <span class="panel-hint">截至当前仿真时刻的目标统计</span>
              </div>
            </template>
            <CallChainGraph
                :targets="targets"
                :sensor-count="summary.detector_count || 0"
                @target-click="handleTargetClick"
            />
          </el-card>
        </div>

        <el-card class="sensor-section" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>传感器数据</span>
              <span class="panel-hint">截至当前仿真时刻的探测器数据</span>
            </div>
          </template>
          <SensorPanel :sensors="sensorData" :task-id="props.taskId" :sim-time="currentSimTime" />
        </el-card>

        <el-card class="sensor-section" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>资源管理日志</span>
              <span class="panel-hint">截至当前仿真时刻的最近 100 条信息</span>
            </div>
          </template>
          <ResourceLog :logs="resourceLog" />
        </el-card>

        

        <HostDetailPanel
            :visible="hostPanelVisible"
            :host="selectedHost"
            :current-sim-time="currentSimTime"
            :task-id="taskId"
            @close="hostPanelVisible = false"
        />


        <el-dialog
            v-model="targetHistVisible"
            :title="activeTargetId === null ? '目标历史' : `目标 ${activeTargetId} 历史`"
            width="980px"
            destroy-on-close
        >
          <div v-loading="targetHistLoading" class="target-history-dialog">
            <el-table
                :data="targetHistRows"
                border
                stripe
                empty-text="当前目标暂无历史记录"
            >
              <el-table-column prop="time" label="时间" min-width="140">
                <template #default="scope">
                  {{ formatDuration(scope.row.time) }}
                </template>
              </el-table-column>
              <el-table-column prop="recognition_mods" label="分类识别模块" min-width="260">
                <template #default="scope">
                  {{ formatModuleList(scope.row.recognition_mods) }}
                </template>
              </el-table-column>
              <el-table-column prop="fusion_mods" label="数据融合模块" min-width="260">
                <template #default="scope">
                  {{ formatModuleList(scope.row.fusion_mods) }}
                </template>
              </el-table-column>
              <el-table-column prop="event" label="事件" min-width="180" />
            </el-table>
          </div>
        </el-dialog>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { simulationApi } from '@/api/simulation'
import StatusBadge from '@/components/StatusBadge.vue'
import TimeSlider from '@/components/TimeSlider.vue'
import HostGrid from '@/components/HostGrid.vue'
import HostDetailPanel from '@/components/HostDetailPanel.vue'
import CallChainGraph from '@/components/CallChainGraph.vue'
import SensorPanel from '@/components/SensorPanel.vue'
import ResourceLog from '@/components/ResourceLog.vue'
import { useTimeController } from '@/composables/useTimeController'

const props = defineProps({
  taskId: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const task = ref(null)
const summary = ref({
  host_stats: {},
  vm_stats: {},
  cpu_stats: {},
  memory_stats: {},
  queue_stats: {},
  latency_stats: {},
  event_counts: {},
  snapshot_count: 0,
})
const snapshot = ref({ hosts: [] })
const sensorData = ref([])
const resourceLog = ref([])
const targets = ref([])
const targetHistVisible = ref(false)
const targetHistLoading = ref(false)
const activeTargetId = ref(null)
const targetHistRows = ref([])
const hostPanelVisible = ref(false)
const selectedHost = ref(null)
const timeController = useTimeController()

const currentSimTime = computed(() => timeController.currentTimestamp.value)

onMounted(async () => {
  await initialize()
})

async function initialize() {
  loading.value = true
  try {
    task.value = await simulationApi.getTask(props.taskId)
    await loadSummary()
    const initMax = summary.value.sim_time_max ?? 0
    timeController.initialize({
      minTimestamp: summary.value.sim_time_min ?? 0,
      maxTimestamp: initMax,
      current: initMax,
    })
    await refreshAt(initMax || 0)
    // For running tasks the bounds may have advanced during the fetch; snap to the new latest.
    timeController.resetToLatest()
    const latestTime = timeController.currentTimestamp.value
    if (latestTime !== initMax) {
      await refreshAt(latestTime)
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

async function loadSummary() {
  try {
    summary.value = await simulationApi.getSimulationSummary(props.taskId)
  } catch (err) {
    summary.value = {
      host_stats: {},
      vm_stats: {},
      cpu_stats: {},
      memory_stats: {},
      queue_stats: {},
      latency_stats: {},
      event_counts: {},
      snapshot_count: 0,
    }
  }
}

async function refreshAt(simTime, options = {}) {
  const { summaryData: prefetchedSummary = null } = options
  const [snapshotData, summaryData, targetsData, detectorData, logData] = await Promise.all([
    simulationApi.getSnapshot(props.taskId, simTime),
    prefetchedSummary ? Promise.resolve(prefetchedSummary) : simulationApi.getSimulationSummary(props.taskId),
    simulationApi.getTargets(props.taskId, simTime),
    simulationApi.getDetectorList(props.taskId, simTime).catch(() => ({ sensor: [] })),
    simulationApi.getResourceLog(props.taskId, simTime).catch(() => []),
  ])
  snapshot.value = snapshotData
  summary.value = summaryData
  targets.value = targetsData.targets || []
  sensorData.value = detectorData.sensor || []
  resourceLog.value = Array.isArray(logData) ? logData : (logData.logs ?? logData.records ?? [])
  timeController.updateBounds(
    summaryData.sim_time_min ?? timeController.dataMinTimestamp.value,
    summaryData.sim_time_max ?? timeController.dataMaxTimestamp.value,
    { snapToLatest: false },
  )
}

async function handleSeek(timestamp) {
  timeController.seek(timestamp)
  await refreshAt(timeController.currentTimestamp.value)
}

async function handleStepBack() {
  timeController.stepBack()
  await refreshAt(timeController.currentTimestamp.value)
}

async function handleStepForward() {
  timeController.stepForward()
  await refreshAt(timeController.currentTimestamp.value)
}

async function handleResetLatest() {
  const [latestTask, latestSummary] = await Promise.all([
    simulationApi.getTask(props.taskId),
    simulationApi.getSimulationSummary(props.taskId),
  ])
  task.value = latestTask
  summary.value = latestSummary
  timeController.updateBounds(
    latestSummary.sim_time_min ?? timeController.dataMinTimestamp.value,
    latestSummary.sim_time_max ?? timeController.dataMaxTimestamp.value,
    { snapToLatest: true },
  )
  await refreshAt(timeController.currentTimestamp.value, { summaryData: latestSummary })
}

function selectHost(host) {
  selectedHost.value = host
  hostPanelVisible.value = true
}

async function handleTargetClick(targetId) {
  activeTargetId.value = targetId
  targetHistVisible.value = true
  targetHistLoading.value = true
  try {
    const result = await simulationApi.getTargetHist(props.taskId, currentSimTime.value, targetId)
    targetHistRows.value = result.records || []
  } catch (err) {
    targetHistRows.value = []
    ElMessage.error(err.response?.data?.error || err.message || '目标历史加载失败')
  } finally {
    targetHistLoading.value = false
  }
}

async function cancelTask() {
  await simulationApi.cancelTask(props.taskId)
  ElMessage.success('任务已取消')
  task.value = await simulationApi.getTask(props.taskId)
}

function formatPercent(value) {
  const safe = Number(value || 0)
  return `${(safe * 100).toFixed(2)}%`
}

function formatLatency(value) {
  const safe = Number(value || 0)
  return `${safe.toFixed(2)}s`
}

function formatNumber(value) {
  const safe = Number(value || 0)
  return safe.toFixed(safe >= 10 ? 0 : 1)
}

function formatDuration(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}分 ${seconds}秒`
}

function formatModuleList(modules) {
  return Array.isArray(modules) && modules.length ? modules.join(', ') : '-'
}
</script>

<style scoped>
.monitor-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1480px;
  margin: 0 auto;
}

.monitor-header,
.info-strip,
.summary-grid,
.panel-grid,
.header-actions,
.panel-header {
  display: flex;
  gap: 16px;
}

.monitor-header,
.panel-header {
  justify-content: space-between;
  align-items: center;
}

.monitor-header h2 {
  margin: 8px 0 6px;
}

.monitor-header p,
.panel-hint {
  color: #64748b;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.target-history-dialog {
  min-height: 220px;
}

.top-grid {
  display: grid;
  gap: 18px;
}

.info-strip,
.summary-grid,
.metric-list,
.event-list {
  display: grid;
  gap: 16px;
}

.info-strip {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.info-card,
.summary-card,
.metric-item,
.event-item {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #d6dde8;
}

.info-card span,
.summary-card span,
.metric-item span,
.event-item span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}

.info-card strong,
.summary-card strong,
.metric-item strong,
.event-item strong {
  color: #0f172a;
  font-size: 22px;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.main-panel {
  border-radius: 22px;
}

.sensor-section {
  border-radius: 22px;
  margin-top: 18px;
}

.metric-list,
.event-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .info-strip,
  .summary-grid,
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
