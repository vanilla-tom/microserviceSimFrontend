<template>
  <div class="host-grid">
    <div
      v-for="host in hosts"
      :key="host.host_id"
      class="host-card"
      :class="getHostStatus(host)"
      @click="$emit('select', host)"
    >
      <div class="host-header">
        <span class="host-id">Host {{ host.host_id }}</span>
        <el-tag size="small" type="info">{{ host.vm_count }} VMs</el-tag>
      </div>

      <div class="host-metrics">
        <template v-if="isHostOffline(host)">
          <div class="host-offline">
            已下机
          </div>
        </template>

        <template v-else>
          <div class="metric">
            <el-progress
                type="circle"
                :width="60"
                :percentage="host.cpu_usage * 100"
                :color="getProgressColor(host.cpu_usage)"
                :stroke-width="6"
                :format="p => p.toFixed(2) + '%'"
            />
            <span class="metric-label">CPU</span>
          </div>

          <div class="metric">
            <el-progress
                type="circle"
                :width="60"
                :percentage="host.memory_usage * 100"
                :color="getProgressColor(host.memory_usage)"
                :stroke-width="6"
                :format="p => p.toFixed(2) + '%'"
            />
            <span class="metric-label">内存</span>
          </div>
        </template>
      </div>

      <div class="vm-indicators">
        <div
          v-for="vm in host.vms.slice(0, 6)"
          :key="vm.vm_id"
          class="vm-dot"
          :title="`${vm.vm_type} (队列: ${vm.queue_length})`"
        />
        <span v-if="host.vms.length > 6" class="vm-more">
          +{{ host.vms.length - 6 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hosts: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])

function isHostOffline(host) {
  return Number(host.cpu_usage) === 0 && Number(host.memory_usage) === 0
}

function getHostStatus(host) {
  if (host.cpu_usage > 0.8 || host.memory_usage > 0.8) return 'danger'
  if (host.cpu_usage > 0.6 || host.memory_usage > 0.6) return 'warning'
  return 'normal'
}
//123
function getProgressColor(value) {
  if (value > 0.8) return '#f56c6c'
  if (value > 0.6) return '#e6a23c'
  return '#67c23a'
}
</script>

<style scoped>
.host-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.host-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.host-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.host-card.normal {
  border-color: transparent;
}

.host-card.warning {
  border-color: #e6a23c;
}

.host-card.danger {
  border-color: #f56c6c;
}

.host-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.host-id {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.host-metrics {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.vm-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.vm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
}

.vm-more {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
}

.host-offline {
  width: 100%;
  text-align: center;
  padding: 18px 0;
  font-size: 16px;
  font-weight: 600;
  color: #909399;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  background: #f5f7fa;
}
</style>
