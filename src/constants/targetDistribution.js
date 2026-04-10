export const defaultTargetDistribution = {
  simulationDurationSeconds: 120,
  randomSeed: null,
  sensorGrid: {
    rows: 5,
    cols: 10,
    spacingMinKm: 200,
    spacingMaxKm: 300,
    originEastKm: 0,
    originNorthKm: 0,
    sensorAltitudeKm: 0,
    globalAzimuthDeg: 0,
    perSensorOverrides: [],
  },
  sensor: {
    rangeKm: 2000,
    horizontalFovDeg: 60,
    verticalFovDeg: 60,
  },
  targetGeneration: {
    activePhaseDurationMinMaxSec: [30, 90],
    activeAccelerationMinMaxKmS2: [0.02, 0.08],
    pitchDegMinMax: [35, 55],
    trajectoryYawDegMinMax: [-15, 15],
    reentryStartHeightMinMaxKm: [80, 150],
    reentryDiveTimeMinMaxSec: [20, 60],
    dragCoefficient: 0,
    launchEastMinMax: [-500, -200],
    launchNorthMinMax: [-200, 200],
    launchAltitudeKm: 0,
    impactRegionMode: 'SENSOR_BOUNDS',
    impactEastMinMax: [0, 1],
    impactNorthMinMax: [0, 1],
    spawnBatchStartSec: 0,
    spawnWindowSeconds: 20,
    spawnTotalCount: null,
    spawnRatePerSecond: 5,
    spawnTotalCap: 50,
    batchId: 0,
  },
}

export function cloneTargetDistribution(source = defaultTargetDistribution) {
  return JSON.parse(JSON.stringify(source))
}
