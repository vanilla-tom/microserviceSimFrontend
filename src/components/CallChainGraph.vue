<template>
  <div class="targets-container">
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
  targets: {
    type: Array,
    default: () => [],
  },
  // 保留原有 props 以兼容父组件传值，暂不删除
  hosts: {
    type: Array,
    default: () => [],
  },
  layerOrder: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['target-click'])

const normalizedTargets = computed(() => (
    [...props.targets].sort((left, right) => Number(left) - Number(right))
))
</script>

<style scoped>
.targets-container {
  background: #fff;
  border: 1px solid #e6ebf2;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.targets-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
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

.targets-scroll {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.targets-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: #7b889f;
  border: 1px dashed #d8e0ec;
  border-radius: 14px;
  background: #fafcff;
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

.targets-scroll::-webkit-scrollbar {
  width: 8px;
}

.targets-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.targets-scroll::-webkit-scrollbar-track {
  background: transparent;
}

@media (max-width: 960px) {
  .targets-scroll {
    max-height: 200px;
  }
}
</style>