import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { simulationApi } from '@/api/simulation'

export const useSimulationStore = defineStore('simulation', () => {
  // State
  const tasks = ref([])
  const currentTask = ref(null)
  const pollingTimer = ref(null)
  const isLoading = ref(false)

  // Getters
  const sortedTasks = computed(() => {
    return [...tasks.value].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at)
    })
  })

  const pendingTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'pending')
  )

  const runningTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'running')
  )

  const completedTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'completed')
  )

  const failedTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'failed' || t.status === 'cancelled')
  )

  // Actions
  function upsertTask(task) {
    const index = tasks.value.findIndex((t) => t.task_id === task.task_id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...task }
    } else {
      tasks.value.push(task)
    }
  }

  function addTask(task) {
    tasks.value.push(task)
  }

  function updateTask(taskId, updates) {
    const index = tasks.value.findIndex((t) => t.task_id === taskId)
    const next = { ...(tasks.value[index] ?? { task_id: taskId }), ...updates }
    if (index !== -1) tasks.value[index] = next
    else tasks.value.push(next)
    if (currentTask.value?.task_id === taskId) {
      currentTask.value = { ...currentTask.value, ...next }
    }
  }

  function removeTask(taskId) {
    tasks.value = tasks.value.filter((t) => t.task_id !== taskId)
    if (currentTask.value?.task_id === taskId) {
      currentTask.value = null
    }
  }

  function setCurrentTask(task) {
    currentTask.value = task
  }

  // Polling
  async function startPolling(taskId) {
    // Stop any existing polling
    stopPolling()

    const poll = async () => {
      try {
        const status = await simulationApi.getTaskStatus(taskId)
        updateTask(taskId, status)

        // Stop polling if task is completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling()
        }
      } catch (error) {
        console.error('Polling error:', error)
        // Don't stop polling on error, retry next interval
      }
    }

    // Poll immediately
    await poll()

    // Then poll every 2 seconds
    pollingTimer.value = setInterval(poll, 2000)
  }

  function stopPolling() {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
    }
  }

  // Async actions
  async function fetchTasks(params = {}) {
    isLoading.value = true
    try {
      const data = await simulationApi.listTasks(params)
      tasks.value = data.tasks ?? []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTask(taskId) {
    const task = await simulationApi.getTask(taskId)
    upsertTask(task)
    return task
  }

  async function createSimulation(targetDistribution) {
    isLoading.value = true
    try {
      const result = await simulationApi.createSimulation(targetDistribution)
      // Refresh list from backend so history stays consistent across reloads.
      await fetchTasks()
      return result
    } finally {
      isLoading.value = false
    }
  }

  async function refreshTaskStatus(taskId) {
    try {
      const task = await simulationApi.getTask(taskId)
      upsertTask(task)
      return task
    } catch (error) {
      console.error('Failed to refresh task status:', error)
      throw error
    }
  }

  async function fetchTaskConfig(taskId) {
    const response = await simulationApi.getTaskConfig(taskId)
    return response.target_distribution
  }

  async function cancelTask(taskId) {
    isLoading.value = true
    try {
      await simulationApi.cancelTask(taskId)
      await fetchTasks()
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTask(taskId) {
    isLoading.value = true
    try {
      await simulationApi.deleteTask(taskId)
      removeTask(taskId)
      await fetchTasks()
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    tasks,
    currentTask,
    pollingTimer,
    isLoading,
    // Getters
    sortedTasks,
    pendingTasks,
    runningTasks,
    completedTasks,
    failedTasks,
    // Actions
    fetchTasks,
    fetchTask,
    addTask,
    updateTask,
    removeTask,
    setCurrentTask,
    startPolling,
    stopPolling,
    createSimulation,
    refreshTaskStatus,
    fetchTaskConfig,
    cancelTask,
    deleteTask,
  }
})
