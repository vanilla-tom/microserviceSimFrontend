<template>
  <div class="monitor-view">
    <div class="monitor-header">
      <div>
        <el-button text @click="router.push('/')">返回首页</el-button>
        <h2>任务监控</h2>
        <p>等待、实时监控与回放共用同一套时间轴和数据面板。</p>
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
              <span>连接状态</span>
              <strong>{{ connectionLabel }}</strong>
            </div>
            <div class="info-card">
              <span>调度时间</span>
              <strong>{{ scheduledRealTimeText }}</strong>
            </div>
            <div class="info-card">
              <span>数据范围</span>
              <strong>{{ formatDuration(metadata?.duration_ms || 0) }}</strong>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <span>快照数</span>
              <strong>{{ summary.snapshot_count || 0 }}</strong>
            </div>
            <div class="summary-card">
              <span>主机峰值</span>
              <strong>{{ formatNumber(summary.host_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>VM 峰值</span>
              <strong>{{ formatNumber(summary.vm_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>CPU 峰值</span>
              <strong>{{ formatPercent(summary.cpu_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>内存峰值</span>
              <strong>{{ formatPercent(summary.memory_stats?.peak) }}</strong>
            </div>
            <div class="summary-card">
              <span>P95 延迟</span>
              <strong>{{ formatLatency(summary.latency_stats?.p95) }}</strong>
            </div>
          </div>
        </div>

        <TimeSlider
            v-if="metadata"
            :current-timestamp="timeController.currentTimestamp.value"
            :data-min-timestamp="timeController.dataMinTimestamp.value"
            :data-max-timestamp="timeController.dataMaxTimestamp.value"
            :window-size-ms="timeController.windowSizeMs.value"
            :visible-range="timeController.visibleRange.value"
            :is-live-following="timeController.isLiveFollowing.value"
            :can-step-back="timeController.canStepBack.value"
            :can-step-forward="timeController.canStepForward.value"
            @seek="handleSeek"
            @step-back="handleStepBack"
            @step-forward="handleStepForward"
            @reset-latest="handleResetLatest"
            @update:window-size="handleWindowChange"
        />

        <div class="panel-grid">
          <el-card class="main-panel" shadow="never">
            <template #header>
              <div class="panel-header">
                <span>集群快照</span>
                <span class="panel-hint">当前仿真时间 {{ formatDuration(currentSimTime) }}</span>
              </div>
            </template>
            <HostGrid :hosts="snapshot.hosts || []" @select="selectHost" />
          </el-card>

          <el-card class="main-panel" shadow="never">
            <template #header>
              <div class="panel-header">
                <span>调用链拓扑</span>
                <span class="panel-hint">按当前时间点推导层级链路</span>
              </div>
            </template>
            <CallChainGraph
                :hosts="callChain.hosts || []"
                :targets="targets"
                :layer-order="callChain.layer_order || metadata?.layer_order || []"
                @target-click="handleTargetClick"
            />
          </el-card>
        </div>

        <div class="event-grid">
          <el-card shadow="never">
            <template #header>
              <div class="panel-header">
                <span>当前统计</span>
                <span class="panel-hint">后端实时汇总</span>
              </div>
            </template>
            <div class="metric-list">
              <div class="metric-item">
                <span>平均主机数</span>
                <strong>{{ formatNumber(summary.host_stats?.avg) }}</strong>
              </div>
              <div class="metric-item">
                <span>平均 VM 数</span>
                <strong>{{ formatNumber(summary.vm_stats?.avg) }}</strong>
              </div>
              <div class="metric-item">
                <span>队列峰值</span>
                <strong>{{ formatNumber(summary.queue_stats?.peak) }}</strong>
              </div>
              <div class="metric-item">
                <span>解析异常行</span>
                <strong>{{ formatNumber(summary.parse_errors) }}</strong>
              </div>
            </div>
          </el-card>

          <el-card shadow="never">
            <template #header>
              <div class="panel-header">
                <span>事件计数</span>
                <span class="panel-hint">按后端已识别 JSONL 类型聚合</span>
              </div>
            </template>
            <div class="event-list">
              <div
                  v-for="(count, name) in summary.event_counts || {}"
                  :key="name"
                  class="event-item"
              >
                <span>{{ name }}</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </el-card>
        </div>

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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { simulationApi } from '@/api/simulation'
import { wsBaseURL } from '@/api/client'
import StatusBadge from '@/components/StatusBadge.vue'
import TimeSlider from '@/components/TimeSlider.vue'
import HostGrid from '@/components/HostGrid.vue'
import HostDetailPanel from '@/components/HostDetailPanel.vue'
import CallChainGraph from '@/components/CallChainGraph.vue'
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
const metadata = ref(null)
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
const callChain = ref({ hosts: [], layer_order: [] })
const targets = ref([])
const targetHistVisible = ref(false)
const targetHistLoading = ref(false)
const activeTargetId = ref(null)
const targetHistRows = ref([])
const connectionState = ref('disconnected')
const scheduledRealTime = ref(null)
const hostPanelVisible = ref(false)
const selectedHost = ref(null)
const timeController = useTimeController()
const hasReceivedLiveTick = ref(false)

let ws = null

const currentSimTime = computed(() => timeController.currentTimestamp.value)
const connectionLabel = computed(() => {
  const labels = {
    connecting: '连接中',
    connected: '已连接',
    waiting: '等待数据',
    disconnected: '未连接',
  }
  return labels[connectionState.value] || connectionState.value
})
const scheduledRealTimeText = computed(() => (
    scheduledRealTime.value ? new Date(scheduledRealTime.value).toLocaleTimeString('zh-CN') : '-'
))

onMounted(async () => {
  await initialize()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})

async function initialize() {
  loading.value = true
  try {
    task.value = await simulationApi.getTask(props.taskId)
    await loadSummary()
    await loadMetadata()
    if (task.value.status === 'pending' || task.value.status === 'running') {
      openSocket()
    } else {
      await refreshAt(timeController.currentTimestamp.value || metadata.value?.sim_time_max || 0)
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message
  } finally {
    loading.value = false
  }
}

async function loadMetadata() {
  try {
    metadata.value = await simulationApi.getSimulationMetadata(props.taskId)
    timeController.initialize({
      minTimestamp: metadata.value.sim_time_min,
      maxTimestamp: metadata.value.sim_time_max,
      current: task.value && (task.value.status === 'running' || task.value.status === 'pending')
          ? metadata.value.sim_time_min
          : metadata.value.sim_time_max,
    })
  } catch (err) {
    metadata.value = null
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

async function refreshAt(simTime) {
  const [snapshotData, callChainData, summaryData, targetsData] = await Promise.all([
    simulationApi.getSnapshot(props.taskId, simTime),
    simulationApi.getCallChain(props.taskId, simTime),
    simulationApi.getSimulationSummary(props.taskId),
    simulationApi.getTargets(props.taskId, simTime),
  ])
  snapshot.value = snapshotData
  callChain.value = callChainData
  summary.value = summaryData
  targets.value = targetsData.targets || []
}

function openSocket() {
  connectionState.value = 'connecting'
  ws = new WebSocket(`${wsBaseURL}/simulations/${props.taskId}/stream`)
  ws.onopen = () => {
    connectionState.value = 'connected'
  }
  ws.onmessage = async (event) => {
    const message = JSON.parse(event.data)
    const payload = message.data || {}
    switch (message.type) {
      case 'task_state':
        task.value = { ...task.value, ...payload }
        break
      case 'metadata':
        metadata.value = payload
        if (task.value && (task.value.status === 'running' || task.value.status === 'pending') && !hasReceivedLiveTick.value) {
          timeController.updateBounds(payload.sim_time_min, payload.sim_time_max, { snapToLatest: false })
        } else {
          timeController.updateBounds(payload.sim_time_min, payload.sim_time_max)
        }
        break
      case 'metrics_tick':
        hasReceivedLiveTick.value = true
        scheduledRealTime.value = payload.scheduled_real_time
        connectionState.value = 'connected'
        if (payload.snapshot) {
          snapshot.value = payload.snapshot
        }
        if (payload.call_chain) {
          callChain.value = payload.call_chain
        }
        if (metadata.value) {
          timeController.updateBounds(metadata.value.sim_time_min, payload.sim_time, {
            snapToLatest: timeController.isLiveFollowing.value,
          })
        }
        if (timeController.isLiveFollowing.value) {
          timeController.seek(payload.sim_time)
        }
        break
      case 'summary_update':
        summary.value = payload
        break
      case 'stream_status':
        connectionState.value = payload.status === 'waiting_for_new_data' ? 'waiting' : 'connected'
        scheduledRealTime.value = payload.scheduled_real_time
        break
      case 'complete':
        connectionState.value = 'disconnected'
        task.value = { ...task.value, status: 'completed' }
        await loadMetadata()
        await loadSummary()
        break
      case 'failed':
        connectionState.value = 'disconnected'
        if (payload.error_message) {
          error.value = payload.error_message
        }
        break
      default:
        break
    }
  }
  ws.onclose = () => {
    connectionState.value = 'disconnected'
  }
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
  timeController.resetToLatest()
  await refreshAt(timeController.currentTimestamp.value)
}

function handleWindowChange(nextWindow) {
  timeController.setWindowSize(nextWindow)
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
  router.push('/')
}

function formatPercent(value) {
  const safe = Number(value || 0)
  return `${(safe * 100).toFixed(1)}%`
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
.event-grid,
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.event-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.main-panel {
  border-radius: 22px;
}

.metric-list,
.event-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .info-strip,
  .summary-grid,
  .panel-grid,
  .event-grid {
    grid-template-columns: 1fr;
  }
}
</style>
