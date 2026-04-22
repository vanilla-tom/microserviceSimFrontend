import { computed, ref } from 'vue'

export function useTimeController(options = {}) {
  const {
    stepMs = 5_000,
  } = options

  const currentTimestamp = ref(0)
  const dataMinTimestamp = ref(0)
  const dataMaxTimestamp = ref(0)
  const isLiveFollowing = ref(true)

  const hasRange = computed(() => dataMaxTimestamp.value > dataMinTimestamp.value)
  const canStepBack = computed(() => currentTimestamp.value > dataMinTimestamp.value)
  const canStepForward = computed(() => currentTimestamp.value < dataMaxTimestamp.value)

  function initialize({ minTimestamp = 0, maxTimestamp = 0, current = null } = {}) {
    dataMinTimestamp.value = minTimestamp
    dataMaxTimestamp.value = maxTimestamp
    currentTimestamp.value = current ?? maxTimestamp
    isLiveFollowing.value = true
  }

  function updateBounds(minTimestamp, maxTimestamp, options = {}) {
    const { snapToLatest = isLiveFollowing.value } = options
    dataMinTimestamp.value = minTimestamp
    dataMaxTimestamp.value = maxTimestamp
    if (snapToLatest) {
      currentTimestamp.value = maxTimestamp
      return
    }
    currentTimestamp.value = clamp(currentTimestamp.value)
  }

  function clamp(value) {
    return Math.max(dataMinTimestamp.value, Math.min(value, dataMaxTimestamp.value))
  }

  function seek(timestamp) {
    currentTimestamp.value = clamp(timestamp)
    isLiveFollowing.value = currentTimestamp.value >= dataMaxTimestamp.value
  }

  function seekBy(deltaMs) {
    seek(currentTimestamp.value + deltaMs)
  }

  function stepBack() {
    seekBy(-stepMs)
  }

  function stepForward() {
    seekBy(stepMs)
  }

  function resetToLatest() {
    currentTimestamp.value = dataMaxTimestamp.value
    isLiveFollowing.value = true
  }

  return {
    currentTimestamp,
    dataMinTimestamp,
    dataMaxTimestamp,
    isLiveFollowing,
    hasRange,
    canStepBack,
    canStepForward,
    initialize,
    updateBounds,
    seek,
    seekBy,
    stepBack,
    stepForward,
    resetToLatest,
  }
}
