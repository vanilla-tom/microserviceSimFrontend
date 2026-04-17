<template>
  <div class="call-chain-graph">
    <section class="topology-section">
      <div class="legend">
        <span class="legend-title">Layer</span>
        <span
            v-for="layer in layerOrder"
            :key="layer"
            class="legend-item"
            :style="{ backgroundColor: getLayerColor(layer) }"
        >
          {{ layer }}
        </span>
      </div>


        <div v-if="orderedHosts.length === 0" class="empty-state">
          当前时间点暂无可展示的 VM 调用链。
        </div>

        <div v-else class="topology-viewport">
          <div class="topology-canvas">
            <div class="topology-scroll">
            <div class="hosts-grid">
              <article
                  v-for="host in orderedHosts"
                  :key="host.id"
                  class="host-shell"
              >
                <header class="host-shell__header">
                  <span class="host-shell__title">{{ host.name }}</span>
                  <span class="host-shell__count">{{ host.vm_count }} VMs</span>
                </header>

                <div v-if="host.vms.length" class="vm-cloud">
                  <div
                      v-for="vm in host.vms"
                      :key="vm.id"
                      class="vm-item"
                  >
                    <div
                        class="vm-dot"
                        :style="getVmNodeStyle(vm.layer)"
                        :title="getVmTitle(vm, host)"
                    />
                    <span class="vm-label">{{ getVmLabel(vm) }}</span>
                  </div>
                </div>

                <div v-else class="host-shell__empty">
                  暂无 VM
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section-divider" />

    <section class="targets-section">
      <div class="targets-header">
        <span class="targets-title">目标</span>
        <span class="targets-count">{{ normalizedTargets.length }} 个</span>
      </div>

      <div class="targets-scroll">
        <div v-if="normalizedTargets.length === 0" class="targets-empty">
          当前时间点暂无目标。
        </div>

        <div v-else class="targets-grid">
          <article
              v-for="target in normalizedTargets"
              :key="`target-${target}`"
              class="target-card"
              @click="emit('target-click', target)"
          >
            <div class="target-label">Target</div>
            <div class="target-value">{{ target }}</div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hosts: {
    type: Array,
    default: () => [],
  },
  targets: {
    type: Array,
    default: () => [],
  },
  layerOrder: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['target-click'])

const layerColors = {
  RECEIVER: '#67c23a',
  PREPROCESSOR: '#409eff',
  RECOGNIZER: '#e6a23c',
  ANALYZER: '#f56c6c',
  STORAGE: '#909399',
}

const layerIndex = computed(() => {
  const map = new Map()
  props.layerOrder.forEach((layer, index) => map.set(layer, index))
  return map
})

const orderedHosts = computed(() => {
  const rankMap = layerIndex.value
  return [...props.hosts]
      .map(host => ({
        ...host,
        layers: [...(host.layers || [])].sort((left, right) => {
          const leftRank = rankMap.get(left) ?? Number.MAX_SAFE_INTEGER
          const rightRank = rankMap.get(right) ?? Number.MAX_SAFE_INTEGER
          if (leftRank !== rightRank) {
            return leftRank - rightRank
          }
          return left.localeCompare(right)
        }),
        vms: [...(host.vms || [])].sort((left, right) => {
          const leftRank = rankMap.get(left.layer) ?? Number.MAX_SAFE_INTEGER
          const rightRank = rankMap.get(right.layer) ?? Number.MAX_SAFE_INTEGER
          if (leftRank !== rightRank) {
            return leftRank - rightRank
          }
          return left.id.localeCompare(right.id)
        }),
      }))
      .sort((left, right) => {
        const leftRank = left.layers.length ? (rankMap.get(left.layers[0]) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
        const rightRank = right.layers.length ? (rankMap.get(right.layers[0]) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
        if (leftRank !== rightRank) {
          return leftRank - rightRank
        }

        const leftId = Number(left.id)
        const rightId = Number(right.id)
        if (!Number.isNaN(leftId) && !Number.isNaN(rightId)) {
          return leftId - rightId
        }
        return left.id.localeCompare(right.id)
      })
})

const normalizedTargets = computed(() => (
    [...props.targets].sort((left, right) => Number(left) - Number(right))
))

function getLayerColor(layer) {
  return layerColors[layer] || '#6b7a90'
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
      ? normalized.split('').map((part) => part + part).join('')
      : normalized
  const intValue = Number.parseInt(value, 16)
  const red = (intValue >> 16) & 255
  const green = (intValue >> 8) & 255
  const blue = intValue & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function getVmNodeStyle(layer) {
  const color = getLayerColor(layer)
  return {
    backgroundColor: color,
    boxShadow: `0 0 0 6px ${hexToRgba(color, 0.18)}`,
  }
}

function getVmLabel(vm) {
  const parts = String(vm.id || '').split('-')
  return parts.slice(0, 2).join('-') || vm.id
}

function getVmTitle(vm, host) {
  return [
    host.name,
    vm.id,
    vm.layer || 'UNKNOWN',
    vm.vm_type,
  ].join('\n')
}
</script>

<style scoped>
.call-chain-graph {
  background: #fff;
  border: 1px solid #e6ebf2;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.topology-section,
.targets-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.legend-title {
  color: #5d6b82;
  font-size: 13px;
  font-weight: 600;
}

.legend-item {
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.empty-state,
.targets-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: #7b889f;
  border: 1px dashed #d8e0ec;
  border-radius: 14px;
  background: #fafcff;
}

.topology-scroll {
  max-height: 340px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.targets-scroll {
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.topology-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
}

.topology-canvas {
  min-width: 960px;
}

.hosts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  min-height: 320px;
}

.host-shell {
  min-height: 150px;
  padding: 14px 14px 16px;
  border: 2px dashed #cfd8e6;
  border-radius: 18px;
  background: rgba(248, 251, 255, 0.75);
}

.host-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.host-shell__title {
  color: #24324a;
  font-size: 14px;
  font-weight: 700;
}

.host-shell__count {
  color: #7c8aa0;
  font-size: 11px;
  font-weight: 600;
}

.vm-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 14px;
  align-items: flex-start;
}

.vm-item {
  width: 56px;
  display: grid;
  justify-items: center;
  gap: 8px;
}

.vm-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.95);
}

.vm-label {
  width: 100%;
  color: #67758d;
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;
}

.host-shell__empty {
  min-height: 88px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #94a0b3;
  background: rgba(255, 255, 255, 0.72);
}

.section-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.targets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.targets-title {
  color: #24324a;
  font-size: 14px;
  font-weight: 700;
}

.targets-count {
  color: #7c8aa0;
  font-size: 12px;
  font-weight: 600;
}

.targets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.target-card {
  padding: 14px 12px;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  background: #f8fbff;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.target-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  border-color: #b9c9de;
}

.target-label {
  color: #7c8aa0;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.target-value {
  color: #24324a;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.topology-scroll::-webkit-scrollbar,
.targets-scroll::-webkit-scrollbar {
  width: 8px;
}

.topology-viewport::-webkit-scrollbar {
  height: 8px;
}

.topology-scroll::-webkit-scrollbar-thumb,
.targets-scroll::-webkit-scrollbar-thumb,
.topology-viewport::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.topology-scroll::-webkit-scrollbar-track,
.targets-scroll::-webkit-scrollbar-track,
.topology-viewport::-webkit-scrollbar-track {
  background: transparent;
}

@media (max-width: 960px) {
  .topology-canvas {
    min-width: 720px;
  }

  .topology-scroll {
    max-height: 300px;
  }

  .targets-scroll {
    max-height: 200px;
  }
}
</style>
