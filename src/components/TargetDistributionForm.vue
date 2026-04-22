<template>
  <div class="config-form">
    <div class="form-header">
      <h3>仿真参数选择</h3>
    </div>

    <el-form label-position="top">
      <section class="form-section">
        <div class="grid two">
          <el-form-item label="场景选择">
            <el-select v-model="model.scenario" class="full-width" @change="onScenarioChange">
              <el-option label="单方向单波次" value="single_dir_single_wave" />
              <el-option label="单方向多波次" value="single_dir_multi_wave" />
              <el-option label="多方向多波次" value="multi_dir_multi_wave" />
              <el-option label="自由组合" value="free_combination" />
            </el-select>
          </el-form-item>

          <el-form-item label="数据源">
            <el-select v-model="model.dataSource" class="full-width">
              <el-option label="数据源1" value="source1" />
              <el-option label="数据源2" value="source2" :disabled="model.scenario === 'free_combination'" />
              <el-option label="数据源3" value="source3" :disabled="model.scenario === 'free_combination'" />
            </el-select>
          </el-form-item>

          <el-form-item label="开启节点损毁">
            <el-switch v-model="model.enableNodeFailure" />
          </el-form-item>

          <el-form-item label="开启传感器损毁">
            <el-switch v-model="model.enableSensorFailure" />
          </el-form-item>
        </div>
      </section>
    </el-form>
  </div>
</template>

<script setup>
const model = defineModel({ type: Object, required: true })

function onScenarioChange(value) {
  if (value === 'free_combination') {
    model.value.dataSource = 'source1'
  }
}
</script>

<style scoped>
.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
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

.full-width {
  width: 100%;
}

@media (max-width: 960px) {
  .grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
