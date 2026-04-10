<template>
  <div class="config-form">
    <div class="form-toolbar">
      <div>
        <h3>目标分布配置</h3>
        <p>通过带说明的表单生成 `target-distribution.json`，避免直接上传文件。</p>
      </div>
      <div class="toolbar-actions">
        <el-button @click="restoreDefaults">恢复默认值</el-button>
        <el-button type="primary" plain @click="$emit('copy-request')">从已有任务复制</el-button>
      </div>
    </div>

    <el-form label-position="top" class="section-stack">
      <section class="form-section">
        <div class="section-heading">
          <h4>仿真基础</h4>
          <p>控制样本生成时长与随机种子。</p>
        </div>
        <div class="grid two">
          <el-form-item label="仿真时长（秒）">
            <el-input-number v-model="model.simulationDurationSeconds" :min="1" :step="10" />
          </el-form-item>
          <el-form-item label="随机种子">
            <el-input
              :model-value="seedDisplay"
              placeholder="留空表示沿用主配置"
              @input="handleSeedInput"
            />
          </el-form-item>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <h4>传感器阵列</h4>
          <p>定义站点规模、间距和布设原点。</p>
        </div>
        <div class="grid three">
          <el-form-item label="行数">
            <el-input-number v-model="model.sensorGrid.rows" :min="1" />
          </el-form-item>
          <el-form-item label="列数">
            <el-input-number v-model="model.sensorGrid.cols" :min="1" />
          </el-form-item>
          <el-form-item label="默认方位角（度）">
            <el-input-number v-model="model.sensorGrid.globalAzimuthDeg" :step="5" />
          </el-form-item>
          <el-form-item label="最小间距（km）">
            <el-input-number v-model="model.sensorGrid.spacingMinKm" :min="0" />
          </el-form-item>
          <el-form-item label="最大间距（km）">
            <el-input-number v-model="model.sensorGrid.spacingMaxKm" :min="0" />
          </el-form-item>
          <el-form-item label="传感器高度（km）">
            <el-input-number v-model="model.sensorGrid.sensorAltitudeKm" :step="0.1" />
          </el-form-item>
          <el-form-item label="原点东向（km）">
            <el-input-number v-model="model.sensorGrid.originEastKm" />
          </el-form-item>
          <el-form-item label="原点北向（km）">
            <el-input-number v-model="model.sensorGrid.originNorthKm" />
          </el-form-item>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <h4>传感器性能</h4>
          <p>全站共用的探测距离与视场角。</p>
        </div>
        <div class="grid three">
          <el-form-item label="探测距离（km）">
            <el-input-number v-model="model.sensor.rangeKm" :min="1" :step="50" />
          </el-form-item>
          <el-form-item label="水平视场（度）">
            <el-input-number v-model="model.sensor.horizontalFovDeg" :min="1" :max="180" />
          </el-form-item>
          <el-form-item label="垂直视场（度）">
            <el-input-number v-model="model.sensor.verticalFovDeg" :min="1" :max="180" />
          </el-form-item>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <h4>目标生成</h4>
          <p>设置弹道、发射落区和批量生成节奏。</p>
        </div>

        <div class="subheading">主动段与再入段</div>
        <div class="grid two">
          <RangeField v-model="model.targetGeneration.activePhaseDurationMinMaxSec" label="主动段时长（秒）" />
          <RangeField v-model="model.targetGeneration.activeAccelerationMinMaxKmS2" label="主动段加速度（km/s²）" :step="0.01" />
          <RangeField v-model="model.targetGeneration.pitchDegMinMax" label="俯仰角（度）" />
          <RangeField v-model="model.targetGeneration.trajectoryYawDegMinMax" label="偏航角（度）" />
          <RangeField v-model="model.targetGeneration.reentryStartHeightMinMaxKm" label="再入起始高度（km）" />
          <RangeField v-model="model.targetGeneration.reentryDiveTimeMinMaxSec" label="再入俯冲时长（秒）" />
        </div>

        <div class="grid two">
          <el-form-item label="阻力系数">
            <el-input-number v-model="model.targetGeneration.dragCoefficient" :min="0" :step="0.01" />
          </el-form-item>
          <el-form-item label="发射高度（km）">
            <el-input-number v-model="model.targetGeneration.launchAltitudeKm" :step="0.1" />
          </el-form-item>
        </div>

        <div class="subheading">发射区域</div>
        <div class="grid two">
          <RangeField v-model="model.targetGeneration.launchEastMinMax" label="发射东向范围（km）" />
          <RangeField v-model="model.targetGeneration.launchNorthMinMax" label="发射北向范围（km）" />
        </div>

        <div class="subheading">落区与批次</div>
        <div class="grid two">
          <el-form-item label="落区模式">
            <el-radio-group v-model="model.targetGeneration.impactRegionMode">
              <el-radio-button label="SENSOR_BOUNDS">沿用传感器边界</el-radio-button>
              <el-radio-button label="CUSTOM">自定义矩形</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="批次编号">
            <el-input-number v-model="model.targetGeneration.batchId" :min="0" />
          </el-form-item>
          <RangeField
            v-model="model.targetGeneration.impactEastMinMax"
            label="落区东向范围（km）"
            :disabled="model.targetGeneration.impactRegionMode !== 'CUSTOM'"
          />
          <RangeField
            v-model="model.targetGeneration.impactNorthMinMax"
            label="落区北向范围（km）"
            :disabled="model.targetGeneration.impactRegionMode !== 'CUSTOM'"
          />
        </div>

        <div class="grid three">
          <el-form-item label="批次开始时间（秒）">
            <el-input-number v-model="model.targetGeneration.spawnBatchStartSec" :min="0" />
          </el-form-item>
          <el-form-item label="生成速率（个/秒）">
            <el-input-number v-model="model.targetGeneration.spawnRatePerSecond" :min="0.1" :step="0.5" />
          </el-form-item>
          <el-form-item label="传感器跟踪上限">
            <el-input-number v-model="model.targetGeneration.spawnTotalCap" :min="1" />
          </el-form-item>
        </div>

        <el-form-item label="生成模式">
          <el-radio-group v-model="spawnMode">
            <el-radio-button label="window">按时间窗</el-radio-button>
            <el-radio-button label="count">按目标总数</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div class="grid two">
          <el-form-item label="时间窗长度（秒)">
            <el-input-number
              :model-value="model.targetGeneration.spawnWindowSeconds"
              :disabled="spawnMode !== 'window'"
              :min="1"
              @update:model-value="handleWindowChange"
            />
          </el-form-item>
          <el-form-item label="目标总数">
            <el-input-number
              :model-value="model.targetGeneration.spawnTotalCount"
              :disabled="spawnMode !== 'count'"
              :min="1"
              @update:model-value="handleCountChange"
            />
          </el-form-item>
        </div>
      </section>
    </el-form>

    <div class="summary-panel">
      <div>
        <span class="summary-label">预计传感器数量</span>
        <strong>{{ sensorCount }}</strong>
      </div>
      <div>
        <span class="summary-label">预计生成目标数</span>
        <strong>{{ estimatedTargets }}</strong>
      </div>
      <div>
        <span class="summary-label">落区模式</span>
        <strong>{{ model.targetGeneration.impactRegionMode === 'CUSTOM' ? '自定义区域' : '沿用传感器边界' }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { cloneTargetDistribution, defaultTargetDistribution } from '@/constants/targetDistribution'
import RangeField from '@/components/TargetDistributionRangeField.vue'

const model = defineModel({ type: Object, required: true })

defineEmits(['copy-request'])

const spawnMode = computed({
  get: () => (model.value.targetGeneration.spawnTotalCount == null ? 'window' : 'count'),
  set: (next) => {
    if (next === 'window') {
      model.value.targetGeneration.spawnTotalCount = null
      if (model.value.targetGeneration.spawnWindowSeconds == null) {
        model.value.targetGeneration.spawnWindowSeconds = 20
      }
    } else {
      model.value.targetGeneration.spawnWindowSeconds = null
      if (model.value.targetGeneration.spawnTotalCount == null) {
        model.value.targetGeneration.spawnTotalCount = 50
      }
    }
  },
})

const seedDisplay = computed(() => (
  model.value.randomSeed == null ? '' : String(model.value.randomSeed)
))

const sensorCount = computed(() => (
  model.value.sensorGrid.rows * model.value.sensorGrid.cols
))

const estimatedTargets = computed(() => {
  const config = model.value.targetGeneration
  if (config.spawnTotalCount != null) {
    return config.spawnTotalCount
  }
  const raw = Math.floor((config.spawnWindowSeconds || 0) * (config.spawnRatePerSecond || 0))
  return raw
})

function restoreDefaults() {
  model.value = cloneTargetDistribution(defaultTargetDistribution)
}

function handleSeedInput(value) {
  const trimmed = value.trim()
  model.value.randomSeed = trimmed === '' ? null : Number(trimmed)
}

function handleWindowChange(value) {
  model.value.targetGeneration.spawnWindowSeconds = value
  model.value.targetGeneration.spawnTotalCount = null
}

function handleCountChange(value) {
  model.value.targetGeneration.spawnTotalCount = value
  model.value.targetGeneration.spawnWindowSeconds = null
}
</script>

<style scoped>
.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-toolbar,
.summary-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.form-toolbar h3,
.section-heading h4 {
  margin: 0;
}

.form-toolbar p,
.section-heading p {
  margin: 6px 0 0;
  color: #6b7280;
}

.section-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  padding: 20px;
  border: 1px solid #d6dde8;
  border-radius: 18px;
  background: linear-gradient(180deg, #f9fbfd 0%, #ffffff 100%);
}

.grid {
  display: grid;
  gap: 16px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.subheading {
  margin: 8px 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: #475467;
}

.summary-panel {
  padding: 18px 20px;
  border-radius: 18px;
  background: #0f172a;
  color: #f8fafc;
}

.summary-panel > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #cbd5e1;
}

@media (max-width: 960px) {
  .form-toolbar,
  .summary-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .grid.two,
  .grid.three {
    grid-template-columns: 1fr;
  }
}
</style>
