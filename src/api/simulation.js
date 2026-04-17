import client from './client'

export const simulationApi = {
  // List all tasks (history + current)
  async listTasks(params = {}) {
    const response = await client.get('/simulations', { params })
    return response.data
  },

  // Get task record (includes created_at)
  async getTask(taskId) {
    const response = await client.get(`/simulations/${taskId}`)
    return response.data
  },

  async createSimulation(targetDistribution = null) {
    const response = await client.post('/simulations', targetDistribution ? {
      target_distribution: targetDistribution,
    } : null)
    return response.data
  },

  // Get task status
  async getTaskStatus(taskId) {
    const response = await client.get(`/simulations/${taskId}/status`)
    return response.data
  },

  // Get list of result files
  async getResultFiles(taskId) {
    const response = await client.get(`/simulations/${taskId}/files`)
    return response.data
  },

  // Download a specific result file
  async downloadResultFile(taskId, filename) {
    const response = await client.get(`/simulations/${taskId}/files/${filename}`, {
      responseType: 'text',
    })
    return response.data
  },

  // Download the main result (fallback to first file)
  async getResult(taskId) {
    const response = await client.get(`/simulations/${taskId}/result`, {
      responseType: 'text',
    })
    return response.data
  },

  // Cancel a running or pending task, keep its record
  async cancelTask(taskId) {
    await client.post(`/simulations/${taskId}/cancel`)
  },

  // Delete a task record and remove its task data directory
  async deleteTask(taskId) {
    await client.delete(`/simulations/${taskId}`)
  },

  // Health check
  async healthCheck() {
    const response = await client.get('/health')
    return response.data
  },

  // === Replay API ===

  // Get simulation metadata
  async getSimulationMetadata(taskId) {
    const response = await client.get(`/simulations/${taskId}/metadata`)
    return response.data
  },

  async getSimulationSummary(taskId) {
    const response = await client.get(`/simulations/${taskId}/summary`)
    return response.data
  },

  async getSimulationTimeline(taskId, startTime, endTime, intervalMs = 1000) {
    const response = await client.get(`/simulations/${taskId}/timeline`, {
      params: { start_time: startTime, end_time: endTime, interval_ms: intervalMs },
    })
    return response.data
  },

  async getTaskConfig(taskId) {
    const response = await client.get(`/simulations/${taskId}/config`)
    return response.data
  },

  // Get snapshot at specific simulation time
  async getSnapshot(taskId, simTime) {
    const response = await client.get(`/simulations/${taskId}/snapshot`, {
      params: { sim_time: simTime },
    })
    return response.data
  },

  // Get host history
  async getHostHistory(taskId, hostId, startTime, endTime) {
    const response = await client.get(`/simulations/${taskId}/hosts/${hostId}/history`, {
      params: { start_time: startTime, end_time: endTime },
    })
    return response.data
  },

  // Get VM history
  async getVmHistory(taskId, vmId, startTime, endTime) {
    const response = await client.get(`/simulations/${taskId}/vms/${vmId}/history`, {
      params: { start_time: startTime, end_time: endTime },
    })
    return response.data
  },

  // Get call chain data
  async getCallChain(taskId, simTime) {
    const response = await client.get(`/simulations/${taskId}/call-chain`, {
      params: { sim_time: simTime },
    })
    return response.data
  },

  async getTargetHist(taskId, simTime, targetId) {
    const { data } = await client.get(`/simulations/${taskId}/target-hist`, {
      params: {
        sim_time: simTime,
        target_id: targetId,
      },
    })
    return data
  },

  async getTargets(taskId, simTime) {
    const { data } = await client.get(`/simulations/${taskId}/targets`, {
      params: {
        sim_time: simTime,
      },
    })
    return data
  },

  // Get detector/sensor data
  async getDetector(taskId, simTime) {
    const response = await client.get(`/detector`, {
      params: { sim_time: simTime },
    })
    return response.data
  },
}
