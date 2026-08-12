export const FIDELITY_LOSS_WEIGHTS = Object.freeze({
  scope: 0.3,
  completeness: 0.25,
  visual: 0.35,
  reliability: 0.1,
});

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

export function normalizeEvidenceName(name) {
  return name
    .toLowerCase()
    .replace(/\.(?:jpe?g|png)$/u, '')
    .replace(/^(?:web|lynx|native)[-_]?/u, '')
    .replace(/[-_]?(?:web|lynx|native)$/u, '') || 'raw';
}

export function visualLossFromSamples(samples, targetSampleCount = 12) {
  const observedMedian = median(samples);
  if (observedMedian === null) {
    return {
      loss: 0.5,
      confidence: 0,
      medianPercent: null,
      sampleCount: 0,
    };
  }
  const confidence = clamp01(samples.length / targetSampleCount);
  const observedLoss = clamp01(observedMedian / 10);
  return {
    loss: confidence * observedLoss + (1 - confidence) * 0.5,
    confidence,
    medianPercent: observedMedian,
    sampleCount: samples.length,
  };
}

export function calculateFidelityLoss({
  scopeCoverage,
  clientCompleteness,
  visualLoss,
  reliabilityLoss,
  weights = FIDELITY_LOSS_WEIGHTS,
}) {
  const components = {
    scope: 1 - clamp01(scopeCoverage),
    completeness: 1 - clamp01(clientCompleteness),
    visual: clamp01(visualLoss),
    reliability: clamp01(reliabilityLoss),
  };
  const weighted =
    components.scope * weights.scope +
    components.completeness * weights.completeness +
    components.visual * weights.visual +
    components.reliability * weights.reliability;
  return {
    loss: weighted * 100,
    components,
  };
}
