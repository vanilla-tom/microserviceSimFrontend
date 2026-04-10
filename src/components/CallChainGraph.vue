<template>
  <div class="call-chain-graph">
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
      <span class="legend-summary">{{ links.length }} 条链路</span>
    </div>

    <div v-if="orderedHosts.length === 0" class="empty-state">
      当前时间点暂无可展示的 VM 调用链。
    </div>

    <div v-else class="topology-viewport">
      <div ref="canvasRef" class="topology-canvas">
        <svg
          class="topology-links"
          :viewBox="`0 0 ${canvasSize.width} ${canvasSize.height}`"
          preserveAspectRatio="none"
        >
          <path
            v-for="link in renderedLinks"
            :key="`${link.source}-${link.target}`"
            class="topology-link"
            :d="link.path"
            :stroke="link.color"
          />
        </svg>

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
                  :ref="(el) => bindVmElement(vm.id, el)"
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
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  hosts: {
    type: Array,
    default: () => [],
  },
  links: {
    type: Array,
    default: () => [],
  },
  layerOrder: {
    type: Array,
    default: () => [],
  },
})

const layerColors = {
  RECEIVER: '#67c23a',
  PREPROCESSOR: '#409eff',
  RECOGNIZER: '#e6a23c',
  ANALYZER: '#f56c6c',
  STORAGE: '#909399',
}

const canvasRef = ref(null)
const canvasSize = ref({ width: 0, height: 0 })
const vmPositions = ref({})
const vmElements = new Map()

let resizeObserver = null
let measureFrame = null

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

const renderedLinks = computed(() => (
  props.links
    .map((link) => {
      const source = vmPositions.value[link.source]
      const target = vmPositions.value[link.target]
      if (!source || !target) {
        return null
      }

      const startX = source.x
      const startY = source.y
      const endX = target.x
      const endY = target.y
      const deltaX = endX - startX
      const direction = deltaX >= 0 ? 1 : -1
      const curveOffset = Math.max(42, Math.abs(deltaX) * 0.28)

      return {
        ...link,
        color: getLayerColor(link.source_layer),
        path: `M ${startX} ${startY} C ${startX + curveOffset * direction} ${startY}, ${endX - curveOffset * direction} ${endY}, ${endX} ${endY}`,
      }
    })
    .filter(Boolean)
))

function bindVmElement(vmId, el) {
  if (el) {
    vmElements.set(vmId, el)
  } else {
    vmElements.delete(vmId)
  }
  scheduleMeasure()
}

function scheduleMeasure() {
  if (measureFrame !== null) {
    cancelAnimationFrame(measureFrame)
  }
  measureFrame = requestAnimationFrame(() => {
    measureFrame = null
    measureLayout()
  })
}

function measureLayout() {
  if (!canvasRef.value) {
    return
  }

  const canvasRect = canvasRef.value.getBoundingClientRect()
  canvasSize.value = {
    width: Math.max(Math.round(canvasRect.width), canvasRef.value.scrollWidth, 1),
    height: Math.max(Math.round(canvasRect.height), canvasRef.value.scrollHeight, 1),
  }

  const nextPositions = {}
  vmElements.forEach((element, vmId) => {
    if (!element?.isConnected) {
      return
    }
    const rect = element.getBoundingClientRect()
    nextPositions[vmId] = {
      x: rect.left - canvasRect.left + rect.width / 2,
      y: rect.top - canvasRect.top + rect.height / 2,
    }
  })
  vmPositions.value = nextPositions
}

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

watch(
  () => [props.hosts, props.links, props.layerOrder],
  async () => {
    await nextTick()
    scheduleMeasure()
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  await nextTick()
  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    resizeObserver = new ResizeObserver(() => scheduleMeasure())
    resizeObserver.observe(canvasRef.value)
  }
  window.addEventListener('resize', scheduleMeasure)
  scheduleMeasure()
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (measureFrame !== null) {
    cancelAnimationFrame(measureFrame)
  }
  window.removeEventListener('resize', scheduleMeasure)
})
</script>

<style scoped>
.call-chain-graph {
  background: #fff;
  border: 1px solid #e6ebf2;
  border-radius: 14px;
  padding: 16px;
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

.legend-summary {
  margin-left: auto;
  color: #7e8aa0;
  font-size: 12px;
}

.empty-state {
  min-height: 240px;
  display: grid;
  place-items: center;
  color: #7b889f;
  border: 1px dashed #d8e0ec;
  border-radius: 14px;
  background: #fafcff;
}

.topology-viewport {
  overflow: auto;
}

.topology-canvas {
  position: relative;
  min-width: 960px;
  min-height: 320px;
}

.topology-links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.topology-link {
  fill: none;
  stroke-width: 2;
  opacity: 0.28;
}

.hosts-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
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

@media (max-width: 960px) {
  .legend-summary {
    margin-left: 0;
  }

  .topology-canvas {
    min-width: 720px;
  }
}
</style>
