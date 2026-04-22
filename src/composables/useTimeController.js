import { computed, ref } from 'vue'

export function useTimeController(options = {}) {
  const {
    initialWindowSizeMs = 60_000,
    stepMs = 5_000,
  } = options

  const currentTimestamp = ref(0)
  const dataMinTimestamp = ref(0)
  const dataMaxTimestamp = ref(0)
  const windowSizeMs = ref(initialWindowSizeMs)
  const isLiveFollowing = ref(true)

  const visibleRange = computed(() => ({
    start: Math.max(dataMinTimestamp.value, currentTimestamp.value - windowSizeMs.value),
    end: currentTimestamp.value,
  }))

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

  function setWindowSize(nextWindow) {
    windowSizeMs.value = nextWindow
  }

  return {
    currentTimestamp,
    dataMinTimestamp,
    dataMaxTimestamp,
    windowSizeMs,
    isLiveFollowing,
    visibleRange,
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
    setWindowSize,
  }
}
