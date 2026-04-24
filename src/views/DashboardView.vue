<template>
  <div class="dashboard-view">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="hero-sub">微服务仿真平台</p>
        <h1 class="hero-title">Simulation Control Center</h1>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <span>总任务数</span>
          <strong>{{ store.tasks.length }}</strong>
        </div>
        <div class="stat-card">
          <span>运行中</span>
          <strong>{{ store.runningTasks.length }}</strong>
        </div>
        <div class="stat-card">
          <span>已完成</span>
          <strong>{{ store.completedTasks.length }}</strong>
        </div>
        <div class="stat-card">
          <span>失败</span>
          <strong>{{ store.failedTasks.length }}</strong>
        </div>
      </div>
    </section>

    <div class="layout">
      <el-card class="form-card" shadow="never">
        <TargetDistributionForm v-model="draftConfig" />

        <div class="submit-bar">
          <span class="helper-text">提交后由后端生成任务目录配置文件并启动仿真。</span>
          <el-button type="primary" size="large" :loading="creating" @click="createTask">
            启动仿真
          </el-button>
        </div>
      </el-card>

      <el-card class="task-card" shadow="never">
        <template #header>
          <div class="task-header">
            <span>最近任务</span>
            <el-button text @click="store.fetchTasks()">刷新</el-button>
          </div>
        </template>

        <el-table
          :data="store.sortedTasks"
          v-loading="store.isLoading"
          empty-text="暂无任务"
          height="100%"
        >
          <el-table-column prop="task_id" label="任务编号" min-width="180">
            <template #default="{ row }">
              <button class="task-link" @click="openTask(row.task_id)">{{ row.task_id }}</button>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <StatusBadge :status="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" min-width="150">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button
                  text type="primary"
                  :disabled="viewCooldown(row) > 0"
                  @click="openTask(row.task_id)"
                >{{ viewCooldown(row) > 0 ? `${viewCooldown(row)}s` : '查看' }}</el-button>
                <el-button
                  v-if="row.status === 'pending' || row.status === 'running'"
                  text type="warning"
                  :disabled="viewCooldown(row) > 0"
                  @click="stopTask(row.task_id)"
                >{{ viewCooldown(row) > 0 ? `${viewCooldown(row)}s` : '停止' }}</el-button>
                <el-button
                  v-else
                  text type="danger"
                  @click="deleteTask(row.task_id)"
                >删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TargetDistributionForm from '@/components/TargetDistributionForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useSimulationStore } from '@/stores/simulation'

const router = useRouter()
const store = useSimulationStore()

const draftConfig = ref({
  scenario: 'free_combination',
  dataSource: 'source1',
  enableNodeFailure: false,
  enableSensorFailure: false,
})
const creating = ref(false)
const now = ref(Date.now())
let ticker = null

onMounted(() => {
  store.fetchTasks()
  ticker = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  clearInterval(ticker)
})

function viewCooldown(row) {
  if (row.status !== 'running' && row.status !== 'pending') return 0
  const ageMs = now.value - new Date(row.created_at).getTime()
  return Math.max(0, Math.ceil((5000 - ageMs) / 1000))
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function createTask() {
  creating.value = true
  try {
    const result = await store.createSimulation(draftConfig.value)
    ElMessage.success(`任务已启动：${result.task_id}`)
    store.fetchTasks()
  } finally {
    creating.value = false
  }
}

function openTask(taskId) {
  router.push(`/task/${taskId}`)
}

async function stopTask(taskId) {
  try {
    await store.cancelTask(taskId)
    ElMessage.success('已发送停止指令')
  } catch {
    // error message shown by api client interceptor
  }
}

async function deleteTask(taskId) {
  try {
    await ElMessageBox.confirm(
      `删除后将移除任务记录，并清空 data/${taskId} 下的文件，且不可恢复。`,
      '确认删除仿真记录',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    await store.deleteTask(taskId)
    ElMessage.success('仿真记录已删除')
  } catch (error) {
    if (error !== 'cancel') {
      throw error
    }
  }
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1480px;
  margin: 0 auto;
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 30px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(125, 211, 252, 0.28), transparent 35%),
    linear-gradient(135deg, #082f49 0%, #0f172a 48%, #111827 100%);
  color: #f8fafc;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.hero-sub {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.hero-title {
  margin: 0;
  font-size: 42px;
  font-weight: 700;
  line-height: 1.15;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(110px, 1fr));
  gap: 14px;
  min-width: 280px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.stat-card span {
  color: #94a3b8;
  font-size: 12px;
}

.stat-card strong {
  font-size: 32px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 24px;
}

.form-card,
.task-card {
  border-radius: 24px;
}

.submit-bar,
.task-header,
.row-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.submit-bar {
  margin-top: 24px;
}

.helper-text {
  font-size: 13px;
  color: #64748b;
}

.task-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 1100px) {
  .hero-panel,
  .layout {
    grid-template-columns: 1fr;
    display: grid;
  }

  .hero-stats {
    min-width: 0;
  }
}
</style>
