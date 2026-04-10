<template>
  <div class="latency-chart">
    <!-- Statistics Cards -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-value">{{ formatLatency(stats.avg) }}</div>
        <div class="stat-label">平均延迟</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-value">{{ formatLatency(stats.median) }}</div>
        <div class="stat-label">中位延迟</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-value">{{ formatLatency(stats.p95) }}</div>
        <div class="stat-label">P95 延迟</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-value">{{ formatLatency(stats.p99) }}</div>
        <div class="stat-label">P99 延迟</div>
      </el-card>
    </div>

    <!-- Charts -->
    <div class="chart-container">
      <h4>总延迟分布</h4>
      <v-chart class="chart" :option="totalLatencyOption" autoresize />
    </div>

    <div class="chart-container">
      <h4>延迟分层分析</h4>
      <v-chart class="chart" :option="layerOption" autoresize />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const stats = computed(() => props.data.stats || { avg: 0, median: 0, p95: 0, p99: 0 })

const formatLatency = (value) => {
  if (value === undefined || value === null) return '-'
  return `${value.toFixed(3)}s`
}

const totalLatencyOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const p = params[0]
      return `时间: ${p.data[0].toFixed(2)}s<br/>延迟: ${p.data[1].toFixed(3)}s`
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '10%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    name: '时间 (秒)',
    min: 'dataMin',
  },
  yAxis: {
    type: 'value',
    name: '延迟 (秒)',
    axisLabel: {
      formatter: (value) => `${value.toFixed(2)}s`,
    },
  },
  series: [
    {
      name: '总延迟',
      type: 'scatter',
      symbolSize: 6,
      data: props.data.totalLatencySeries || [],
      itemStyle: {
        color: '#409eff',
        opacity: 0.6,
      },
    },
  ],
}))

const layerOption = computed(() => {
  const layers = props.data.layerSeries || {}
  const layerNames = {
    receiver: '接收层',
    preprocessor: '预处理层',
    recognizer: '识别层',
    analyzer: '分析层',
    storage: '存储层',
    waiting: '等待层',
  }

  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      top: 'bottom',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '时间 (秒)',
    },
    yAxis: {
      type: 'value',
      name: '延迟 (秒)',
      axisLabel: {
        formatter: (value) => `${value.toFixed(2)}s`,
      },
    },
    series: Object.entries(layers).map(([key, data], index) => ({
      name: layerNames[key] || key,
      type: 'bar',
      stack: 'total',
      data: data,
      itemStyle: {
        color: colors[index % colors.length],
      },
    })),
  }
})
</script>

<style scoped>
.latency-chart {
  padding: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-container h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.chart {
  width: 100%;
  height: 350px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
