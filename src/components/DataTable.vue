<template>
  <div class="data-table">
    <div class="table-header">
      <h4>{{ title }}</h4>
      <el-button type="primary" size="small" @click="downloadCSV">
        <el-icon><Download /></el-icon>
        下载 CSV
      </el-button>
    </div>

    <el-table
      :data="paginatedData"
      style="width: 100%"
      height="500"
      border
      stripe
    >
      <el-table-column
        v-for="col in columns"
        :key="col"
        :prop="col"
        :label="col"
        min-width="120"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ formatValue(row[col]) }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 50, 100, 500]"
      :total="data.length"
      layout="total, sizes, prev, pager, next"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: '数据表格',
  },
  filename: {
    type: String,
    default: 'data.csv',
  },
})

const currentPage = ref(1)
const pageSize = ref(50)

const columns = computed(() => {
  if (props.data.length === 0) return []
  return Object.keys(props.data[0])
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.data.slice(start, end)
})

const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(4)
  }
  return value
}

const downloadCSV = () => {
  if (props.data.length === 0) return

  // Convert data to CSV
  const headers = columns.value.join(',')
  const rows = props.data.map((row) =>
    columns.value
      .map((col) => {
        const value = row[col]
        if (value === null || value === undefined) return ''
        // Escape values with commas or quotes
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(',')
  )

  const csv = [headers, ...rows].join('\n')

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = props.filename
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<style scoped>
.data-table {
  padding: 10px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-header h4 {
  margin: 0;
  color: #303133;
}

.pagination {
  margin-top: 15px;
  justify-content: flex-end;
}
</style>
