export const FIDELITY_LOSS_WEIGHTS = Object.freeze({
  scope: 0.3,
  completeness: 0.25,
  visual: 0.35,
  reliability: 0.1,
});
export const RELIABILITY_DEBT_CAPACITY = 10;

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

export function resolveEvidenceSourceCommit(image, firstCommitByFile) {
  return image.sourceCommit ?? firstCommitByFile.get(image.repoPath) ?? null;
}

export function resolveEvidenceActivationIndex({
  asset,
  firstCommitByFile,
  commitIndexByHash,
  evidenceCommits,
}) {
  const sourceCommit = resolveEvidenceSourceCommit(asset, firstCommitByFile);
  const sourceIndex = sourceCommit
    ? commitIndexByHash.get(sourceCommit)
    : undefined;
  if (sourceIndex !== undefined) return sourceIndex;
  const sameDayIndex = evidenceCommits.findLastIndex(
    (commit) => commit.date === asset.day
  );
  if (sameDayIndex >= 0) return sameDayIndex;
  const priorIndex = evidenceCommits.findLastIndex(
    (commit) => commit.date < asset.day
  );
  return Math.max(0, priorIndex);
}

export function groupEvidenceFilesBySourceCommit(images) {
  const filesByCommit = new Map();
  for (const image of images) {
    if (!image.sourceCommit) continue;
    const files = filesByCommit.get(image.sourceCommit) ?? [];
    files.push(image.repoPath);
    filesByCommit.set(image.sourceCommit, files);
  }
  return filesByCommit;
}

export function isComparableImageGeometry(left, right) {
  const leftRatio = left.width / left.height;
  const rightRatio = right.width / right.height;
  const nativeTitlebarCompatible =
    (right.width === left.width * 2 &&
      [left.height * 2, left.height * 2 - 64].includes(right.height)) ||
    (left.width === right.width * 2 &&
      [right.height * 2, right.height * 2 - 64].includes(left.height));
  return (
    nativeTitlebarCompatible ||
    Math.abs(leftRatio - rightRatio) / leftRatio <= 0.015
  );
}

export function visualQualityBand(maePercent) {
  return maePercent >= 25
    ? 'critical'
    : maePercent >= 10
      ? 'poor'
      : maePercent >= 3
        ? 'noticeable'
        : 'close';
}

export function classifyRenderedTheme({
  meanLuminance,
  brightFraction,
  darkFraction,
}) {
  if (meanLuminance <= 70 && darkFraction >= 0.75) return 'dark';
  if (meanLuminance >= 190 && brightFraction >= 0.75) return 'light';
  return 'mixed';
}

export function captureMismatchReason({
  declaredLeftTheme: _declaredLeftTheme,
  declaredRightTheme: _declaredRightTheme,
  renderedLeftTheme,
  renderedRightTheme,
}) {
  if (
    renderedLeftTheme === 'mixed' ||
    renderedRightTheme === 'mixed' ||
    renderedLeftTheme === renderedRightTheme
  ) {
    return null;
  }
  return 'capture-theme-mismatch';
}

export function visualPairMatchesIssue(pair, issue) {
  const storyMatches = issue.affectedStoryIds
    ? issue.affectedStoryIds.includes(pair.storyId)
    : pair.storyId.startsWith(issue.affectedStoryPrefix);
  const stateMatches =
    !issue.affectedStateKeys || issue.affectedStateKeys.includes(pair.stateKey);
  const clientPairMatches =
    !issue.affectedClientPairs ||
    issue.affectedClientPairs.includes(`${pair.leftClient}:${pair.rightClient}`);
  return storyMatches && stateMatches && clientPairMatches;
}

export function visualSampleSupersessionAtCommit(
  sample,
  commitIndex,
  supersessionLedger,
  commitIndexByHash
) {
  return (
    supersessionLedger.find((entry) => {
      const supersededAtIndex = commitIndexByHash.get(entry.supersededAt);
      return (
        Number.isInteger(supersededAtIndex) &&
        supersededAtIndex <= commitIndex &&
        (!entry.affectedStateKeys ||
          entry.affectedStateKeys.includes(sample.stateKey)) &&
        (!entry.affectedClientPairs ||
          entry.affectedClientPairs.includes(
            `${sample.leftClient}:${sample.rightClient}`
          )) &&
        entry.affectedStoryPrefixes.some((prefix) =>
          sample.storyId.startsWith(prefix)
        )
      );
    }) ?? null
  );
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

export function reliabilityLossFromPoints(
  points,
  capacity = RELIABILITY_DEBT_CAPACITY
) {
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new RangeError('Reliability debt capacity must be positive');
  }
  return clamp01(points / capacity);
}

export function exponentialMovingAverage(values, alpha = 0.22) {
  if (!values.length) return [];
  const result = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    result.push(alpha * values[index] + (1 - alpha) * result[index - 1]);
  }
  return result;
}

export function weightedComponentContributions(previous, current, weights) {
  return Object.fromEntries(
    Object.keys(weights).map((key) => [
      key,
      (current[key] - previous[key]) * weights[key] * 100,
    ])
  );
}

export function daysWithCommitPoints(days, commitPoints) {
  const anchoredDays = new Set(commitPoints.map((point) => point.day));
  return days.filter((day) => anchoredDays.has(day));
}
