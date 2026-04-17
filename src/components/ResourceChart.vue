<template>
  <div class="resource-chart">
    <div class="chart-container">
      <h4>CPU 利用率</h4>
      <v-chart class="chart" :option="cpuOption" autoresize />
    </div>

    <div class="chart-container">
      <h4>内存利用率</h4>
      <v-chart class="chart" :option="ramOption" autoresize />
    </div>

    <div class="chart-container">
      <h4>虚拟机数量</h4>
      <v-chart class="chart" :option="vmOption" autoresize />
    </div>

    <div class="chart-container">
      <h4>云任务数</h4>
      <v-chart class="chart" :option="cloudletOption" autoresize />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

//
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const commonOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
  legend: {
    top: 'bottom',
    type: 'scroll',
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
}

const cpuOption = computed(() => ({
  ...commonOption,
  yAxis: {
    type: 'value',
    min: 0,
    max: 1,
    axisLabel: {
      formatter: (value) => `${(value * 100).toFixed(0)}%`,
    },
  },
  series: props.data.cpuSeries || [],
}))

const ramOption = computed(() => ({
  ...commonOption,
  yAxis: {
    type: 'value',
    min: 0,
    max: 1,
    axisLabel: {
      formatter: (value) => `${(value * 100).toFixed(0)}%`,
    },
  },
  series: props.data.ramSeries || [],
}))

const vmOption = computed(() => ({
  ...commonOption,
  yAxis: {
    type: 'value',
    min: 0,
    axisLabel: {
      formatter: '{value}',
    },
  },
  series: props.data.vmSeries || [],
}))

const cloudletOption = computed(() => ({
  ...commonOption,
  yAxis: {
    type: 'value',
    min: 0,
    axisLabel: {
      formatter: '{value}',
    },
  },
  series: props.data.cloudletSeries || [],
}))
</script>

<style scoped>
.resource-chart {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-container h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.chart {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .resource-chart {
    grid-template-columns: 1fr;
  }
}
</style>
