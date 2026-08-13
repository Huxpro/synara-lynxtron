import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import {
  calculateFidelityLoss,
  captureMismatchReason,
  classifyRenderedTheme,
  exponentialMovingAverage,
  isComparableImageGeometry,
  median,
  normalizeEvidenceName,
  visualQualityBand,
  visualLossFromSamples,
  weightedComponentContributions,
  FIDELITY_LOSS_WEIGHTS,
} from './fidelity-loss.logic.mjs';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDirectory, '../../..');
const evidenceRoot = resolve(
  repoRoot,
  'shots/2026-08-04/p10-perceptual-fidelity'
);
const archivePath = resolve(evidenceRoot, 'screenshot-archive.js');
const outputJsonPath = resolve(evidenceRoot, 'fidelity-loss.json');
const outputJsPath = resolve(evidenceRoot, 'fidelity-loss.js');
const comparableClients = ['web', 'lynx', 'native'];
const visualRollingWindowSize = 24;
const emaAlpha = 0.18;
const remoteAssetCache = mkdtempSync(
  join(tmpdir(), 'synara-fidelity-assets-cache-')
);
mkdirSync(remoteAssetCache, { recursive: true });
process.on('exit', () => {
  rmSync(remoteAssetCache, { force: true, recursive: true });
});

const reliabilityLedger = [
  {
    id: 'viewport-state-fanout',
    severityPoints: 1,
    introduced: '664d8063e',
    fixed: null,
    summary: 'Viewport hydration race and duplicated resize subscriptions',
  },
  {
    id: 'titlebar-drag-controls',
    severityPoints: 3,
    introduced: 'bc846aab4',
    fixed: '3b9e343cc',
    summary: 'Focusable titlebar controls participated in the drag region',
  },
  {
    id: 'native-preview-startup',
    severityPoints: 3,
    introduced: '7165953da',
    fixed: '13561914d',
    summary: 'Explorer preview initializer crashed the Native runtime',
  },
];
const harnessIssueLedger = [
  {
    id: 'p9-command-menu-theme-mismatch',
    type: 'capture-theme-mismatch',
    detectedAt: '75a03632e',
    affectedStoryPrefix:
      '2026-08-03--p9-u5-composer--browser--command-menu--',
    summary:
      'Web command-menu screenshots rendered dark while Web and Lynx assertions both declared light.',
    severityPoints: 2,
    resolvedBy: ['9a75c7560', '32d83f97a'],
    resolution:
      'Current light Web/Lynx evidence converged to 98.7% parity, followed by synchronized Native certification.',
    resolutionStoryPrefixes: [
      '2026-08-04--p10-perceptual-fidelity--browser--skill-menu-filtered',
      '2026-08-04--p10-perceptual-fidelity--final-overlays--mention-menu-filtered',
      '2026-08-04--p10-perceptual-fidelity--final-overlays--skill-menu-filtered',
    ],
  },
];

function parseGlobalAssignment(source) {
  return JSON.parse(
    source
      .replace(/^globalThis\.[A-Z0-9_]+ = /u, '')
      .replace(/;\s*$/u, '')
  );
}

function git(...arguments_) {
  return execFileSync('git', arguments_, {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
}

function commitMetadata(commit) {
  const [hash, timestamp, ...subject] = git(
    'show',
    '-s',
    '--format=%H%x09%ad%x09%s',
    '--date=iso-strict',
    commit
  ).split('\t');
  return {
    hash,
    shortHash: hash.slice(0, 9),
    timestamp,
    date: timestamp.slice(0, 10),
    subject: subject.join('\t'),
  };
}

function commitsByDay(firstDay, lastDay) {
  const rows = git(
    'log',
    '--format=%H%x09%ad%x09%s',
    '--date=short',
    `--since=${firstDay} 00:00:00`,
    `--until=${lastDay} 23:59:59`,
    '--reverse'
  )
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [hash, date, ...subject] = row.split('\t');
      return { hash, shortHash: hash.slice(0, 9), date, subject: subject.join('\t') };
    });
  return Map.groupBy(rows, (row) => row.date);
}

function evidenceCommitHistory(firstDay, lastDay) {
  const output = git(
    'log',
    '--reverse',
    '--format=@@%H%x09%ad%x09%s',
    '--date=iso-strict',
    '--name-only',
    '--diff-filter=AM',
    `--since=${firstDay} 00:00:00`,
    `--until=${lastDay} 23:59:59`,
    '--',
    ...days.map((day) => `shots/${day}`)
  );
  const commits = [];
  let current = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('@@')) {
      const [hash, timestamp, ...subject] = line.slice(2).split('\t');
      current = {
        hash,
        shortHash: hash.slice(0, 9),
        timestamp,
        date: timestamp.slice(0, 10),
        subject: subject.join('\t'),
        files: [],
      };
      commits.push(current);
    } else if (line && current) {
      current.files.push(line);
    }
  }
  return commits;
}

function firstAddedCommitByFile(firstDay, lastDay) {
  const output = git(
    'log',
    '--reverse',
    '--format=@@%H',
    '--name-only',
    '--diff-filter=A',
    `--since=${firstDay} 00:00:00`,
    `--until=${lastDay} 23:59:59`,
    '--',
    ...days.map((day) => `shots/${day}`)
  );
  const result = new Map();
  let currentHash = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('@@')) currentHash = line.slice(2);
    else if (line && currentHash && !result.has(line)) result.set(line, currentHash);
  }
  return result;
}

function imagesByNormalizedName(story, client) {
  const result = new Map();
  for (const image of story.images.filter((entry) => entry.client === client)) {
    const key = normalizeEvidenceName(image.name);
    const entries = result.get(key) ?? [];
    entries.push(image);
    result.set(key, entries);
  }
  return result;
}

function readEvidenceDeclaration(imagePath) {
  const assertionsPath = resolve(
    repoRoot,
    imagePath.replace(/screenshot\.png$/u, 'assertions.json')
  );
  if (!existsSync(assertionsPath)) return {};
  try {
    const assertions = JSON.parse(readFileSync(assertionsPath, 'utf8'));
    return {
      theme: assertions.theme ?? null,
      snapshotSha256: assertions.snapshotSha256 ?? null,
      viewport: assertions.viewport ?? null,
    };
  } catch {
    return {};
  }
}

async function imageMaePercent(leftPath, rightPath) {
  const [resolvedLeftPath, resolvedRightPath] = await Promise.all([
    resolveImagePath(leftPath),
    resolveImagePath(rightPath),
  ]);
  const left = sharp(resolvedLeftPath).removeAlpha();
  const right = sharp(resolvedRightPath).removeAlpha();
  const [leftMetadata, rightMetadata] = await Promise.all([
    left.metadata(),
    right.metadata(),
  ]);
  const leftRatio = leftMetadata.width / leftMetadata.height;
  if (!isComparableImageGeometry(leftMetadata, rightMetadata)) {
    return { accepted: false, reason: 'aspect-ratio-mismatch' };
  }
  const width = Math.min(leftMetadata.width, rightMetadata.width);
  const height = Math.min(
    leftMetadata.height,
    rightMetadata.height,
    Math.round(width / leftRatio)
  );
  const [leftPixels, rightPixels] = await Promise.all([
    left.resize(width, height, { fit: 'fill' }).raw().toBuffer(),
    right.resize(width, height, { fit: 'fill' }).raw().toBuffer(),
  ]);
  let total = 0;
  let leftLuminanceTotal = 0;
  let rightLuminanceTotal = 0;
  let leftBright = 0;
  let rightBright = 0;
  let leftDark = 0;
  let rightDark = 0;
  const pixelCount = leftPixels.length / 3;
  for (let index = 0; index < leftPixels.length; index += 1) {
    total += Math.abs(leftPixels[index] - rightPixels[index]);
    if (index % 3 === 0) {
      const leftLuminance =
        0.2126 * leftPixels[index] +
        0.7152 * leftPixels[index + 1] +
        0.0722 * leftPixels[index + 2];
      const rightLuminance =
        0.2126 * rightPixels[index] +
        0.7152 * rightPixels[index + 1] +
        0.0722 * rightPixels[index + 2];
      leftLuminanceTotal += leftLuminance;
      rightLuminanceTotal += rightLuminance;
      if (leftLuminance > 220) leftBright += 1;
      if (rightLuminance > 220) rightBright += 1;
      if (leftLuminance < 50) leftDark += 1;
      if (rightLuminance < 50) rightDark += 1;
    }
  }
  const maePercent = (total / leftPixels.length / 255) * 100;
  const leftImageStats = {
    meanLuminance: leftLuminanceTotal / pixelCount,
    brightFraction: leftBright / pixelCount,
    darkFraction: leftDark / pixelCount,
  };
  const rightImageStats = {
    meanLuminance: rightLuminanceTotal / pixelCount,
    brightFraction: rightBright / pixelCount,
    darkFraction: rightDark / pixelCount,
  };
  return {
    accepted: true,
    maePercent,
    parityPercent: Math.max(0, 100 - maePercent),
    qualityBand: visualQualityBand(maePercent),
    leftImageStats,
    rightImageStats,
    renderedLeftTheme: classifyRenderedTheme(leftImageStats),
    renderedRightTheme: classifyRenderedTheme(rightImageStats),
  };
}

async function resolveImagePath(filePath) {
  if (existsSync(filePath)) return filePath;
  const repoPath = filePath
    .slice(repoRoot.length + 1)
    .split('\\')
    .join('/');
  const url = `${archive.assetBaseUrl}/${repoPath}`;
  const extension = repoPath.split('.').at(-1);
  const cacheKey = createHash('sha256').update(url).digest('hex');
  const cachePath = resolve(remoteAssetCache, `${cacheKey}.${extension}`);
  if (!existsSync(cachePath)) {
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        writeFileSync(cachePath, Buffer.from(await response.arrayBuffer()));
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise((resolveDelay) =>
            setTimeout(resolveDelay, 250 * 2 ** attempt)
          );
        }
      }
    }
    if (lastError) throw lastError;
  }
  return cachePath;
}

async function visualSamples(stories, commitIndexByHash, firstCommitByFile) {
  const accepted = [];
  const rejected = [];
  const harness = [];
  for (const story of stories) {
    for (const [leftClient, rightClient] of [
      ['web', 'lynx'],
      ['lynx', 'native'],
    ]) {
      const left = imagesByNormalizedName(story, leftClient);
      const right = imagesByNormalizedName(story, rightClient);
      for (const key of new Set([...left.keys()].filter((name) => right.has(name)))) {
        const leftImages = left.get(key);
        const rightImages = right.get(key);
        const pairCount = Math.min(leftImages.length, rightImages.length);
        for (let index = 0; index < pairCount; index += 1) {
          const pair = {
            storyId: story.id,
            leftClient,
            rightClient,
            left: leftImages[index].repoPath,
            right: rightImages[index].repoPath,
            stateKey: key,
          };
          const leftCommit = firstCommitByFile.get(pair.left);
          const rightCommit = firstCommitByFile.get(pair.right);
          const leftCommitIndex = commitIndexByHash.get(leftCommit);
          const rightCommitIndex = commitIndexByHash.get(rightCommit);
          const activationCommitIndex = Math.max(
            leftCommitIndex ?? 0,
            rightCommitIndex ?? 0
          );
          const result = await imageMaePercent(
            resolve(repoRoot, pair.left),
            resolve(repoRoot, pair.right)
          );
          const leftDeclaration = readEvidenceDeclaration(pair.left);
          const rightDeclaration = readEvidenceDeclaration(pair.right);
          const mismatchReason = captureMismatchReason({
            declaredLeftTheme: leftDeclaration.theme,
            declaredRightTheme: rightDeclaration.theme,
            renderedLeftTheme: result.renderedLeftTheme,
            renderedRightTheme: result.renderedRightTheme,
          });
          const harnessIssue = harnessIssueLedger.find((issue) =>
            pair.storyId.startsWith(issue.affectedStoryPrefix)
          );
          if (
            result.accepted &&
            mismatchReason === 'capture-theme-mismatch' &&
            harnessIssue
          ) {
            harness.push({
              ...pair,
              ...result,
              activationCommitIndex,
              mismatchReason,
              harnessIssueId: harnessIssue.id,
              leftDeclaration,
              rightDeclaration,
            });
            continue;
          }
          if (result.accepted) {
            accepted.push({ ...pair, ...result, activationCommitIndex });
          } else {
            rejected.push({ ...pair, ...result, activationCommitIndex });
          }
        }
      }
    }
  }
  return { accepted, rejected, harness };
}

function completeness(stories, activeImagePaths = null) {
  let expected = 0;
  let observed = 0;
  for (const story of stories) {
    const clients = new Set(
      story.images
        .filter((image) => !activeImagePaths || activeImagePaths.has(image.repoPath))
        .map((image) => image.client)
    );
    if ([...clients].every((client) => client === 'evidence')) {
      expected += 1;
      observed += 1;
      continue;
    }
    expected += comparableClients.length;
    observed += comparableClients.filter((client) => clients.has(client)).length;
  }
  return expected ? observed / expected : 0;
}

function activeReliabilityEvents(timestamp, ledger) {
  return ledger.filter(
    (entry) =>
      entry.introducedMetadata.timestamp <= timestamp &&
      (!entry.fixedMetadata || entry.fixedMetadata.timestamp > timestamp)
  );
}

const archive = parseGlobalAssignment(readFileSync(archivePath, 'utf8'));
const days = archive.days.map((entry) => entry.day);
const dayCommits = commitsByDay(days[0], days.at(-1));
const ledger = reliabilityLedger.map((entry) => ({
  ...entry,
  introducedMetadata: commitMetadata(entry.introduced),
  fixedMetadata: entry.fixed ? commitMetadata(entry.fixed) : null,
}));
const harnessLedger = harnessIssueLedger.map((entry) => ({
  ...entry,
  detectedMetadata: commitMetadata(entry.detectedAt),
  resolvedMetadata: entry.resolvedBy.map(commitMetadata),
}));
const evidenceCommits = [
  ...evidenceCommitHistory(days[0], days.at(-1)),
  ...ledger.flatMap((entry) =>
    [entry.introducedMetadata, entry.fixedMetadata]
      .filter(Boolean)
      .map((metadata) => ({ ...metadata, files: [], reliabilityOnly: true }))
  ),
]
  .filter(
    (commit, index, commits) =>
      commits.findIndex((candidate) => candidate.hash === commit.hash) === index
  )
  .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
const commitIndexByHash = new Map(
  evidenceCommits.map((commit, index) => [commit.hash, index])
);
const firstCommitByFile = firstAddedCommitByFile(days[0], days.at(-1));
const maximumReliabilityPoints = Math.max(
  1,
  ledger.reduce((total, entry) => total + entry.severityPoints, 0) +
    harnessLedger.reduce((total, entry) => total + entry.severityPoints, 0)
);
const allSamples = await visualSamples(
  archive.stories,
  commitIndexByHash,
  firstCommitByFile
);
for (const issue of harnessLedger) {
  const resolutionPairs = allSamples.accepted.filter((pair) =>
    issue.resolutionStoryPrefixes.some((prefix) =>
      pair.storyId.startsWith(prefix)
    )
  );
  issue.resolutionEvidence = {
    pairCount: resolutionPairs.length,
    minimumParityPercent: resolutionPairs.length
      ? Math.min(...resolutionPairs.map((pair) => pair.parityPercent))
      : null,
    medianParityPercent: resolutionPairs.length
      ? median(resolutionPairs.map((pair) => pair.parityPercent))
      : null,
    maximumParityPercent: resolutionPairs.length
      ? Math.max(...resolutionPairs.map((pair) => pair.parityPercent))
      : null,
    pairs: resolutionPairs.map(
      ({
        storyId,
        leftClient,
        rightClient,
        left,
        right,
        stateKey,
        maePercent,
        parityPercent,
        qualityBand,
      }) => ({
        storyId,
        leftClient,
        rightClient,
        left,
        right,
        stateKey,
        maePercent,
        parityPercent,
        qualityBand,
      })
    ),
  };
}
const storyActivationCommitIndex = new Map(
  archive.stories.map((story) => [
    story.id,
    Math.min(
      ...story.images.map(
        (image) =>
          commitIndexByHash.get(firstCommitByFile.get(image.repoPath)) ??
          evidenceCommits.length - 1
      )
    ),
  ])
);
const imageActivationCommitIndex = new Map(
  archive.stories.flatMap((story) =>
    story.images.map((image) => [
      image.repoPath,
      commitIndexByHash.get(firstCommitByFile.get(image.repoPath)) ??
        evidenceCommits.length - 1,
    ])
  )
);
const commitPoints = [];
let bestLoss = Number.POSITIVE_INFINITY;
let previousComponents = null;

for (let commitIndex = 0; commitIndex < evidenceCommits.length; commitIndex += 1) {
  const commit = evidenceCommits[commitIndex];
  const activeStories = archive.stories.filter(
    (story) => storyActivationCommitIndex.get(story.id) <= commitIndex
  );
  const activeImagePaths = new Set(
    [...imageActivationCommitIndex]
      .filter(([, activationIndex]) => activationIndex <= commitIndex)
      .map(([file]) => file)
  );
  const acceptedPairs = allSamples.accepted.filter(
    (sample) => sample.activationCommitIndex <= commitIndex
  );
  const rejectedPairs = allSamples.rejected.filter(
    (sample) => sample.activationCommitIndex <= commitIndex
  );
  const harnessPairs = allSamples.harness.filter(
    (sample) => sample.activationCommitIndex <= commitIndex
  );
  const activatedHarnessPairs = allSamples.harness.filter(
    (sample) => sample.activationCommitIndex === commitIndex
  );
  const activatedRejectedPairs = allSamples.rejected.filter(
    (sample) => sample.activationCommitIndex === commitIndex
  );
  const rollingPairs = acceptedPairs.slice(-visualRollingWindowSize);
  const visual = visualLossFromSamples(
    rollingPairs.map((sample) => sample.maePercent)
  );
  const previousVisual = commitPoints.at(-1)?.visual ?? null;
  const events = activeReliabilityEvents(commit.timestamp, ledger);
  const harnessEvents = harnessLedger.filter(
    (event) =>
      event.detectedMetadata.timestamp <= commit.timestamp &&
      event.resolvedMetadata.every(
        (resolution) => resolution.timestamp > commit.timestamp
      )
  );
  const reliabilityPoints =
    events.reduce(
    (total, event) => total + event.severityPoints,
    0
    ) +
    harnessEvents.reduce(
      (total, event) => total + event.severityPoints,
      0
    );
  const scopeCoverage = activeStories.length / archive.storyCount;
  const clientCompleteness = completeness(activeStories, activeImagePaths);
  const calculated = calculateFidelityLoss({
    scopeCoverage,
    clientCompleteness,
    visualLoss: visual.loss,
    reliabilityLoss: reliabilityPoints / maximumReliabilityPoints,
  });
  bestLoss = Math.min(bestLoss, calculated.loss);
  const componentContributions = previousComponents
    ? weightedComponentContributions(
        previousComponents,
        calculated.components,
        FIDELITY_LOSS_WEIGHTS
      )
    : Object.fromEntries(Object.keys(FIDELITY_LOSS_WEIGHTS).map((key) => [key, 0]));
  const lossDelta =
    commitPoints.length > 0
      ? calculated.loss - commitPoints.at(-1).loss
      : 0;
  const addedStoryIds = archive.stories
    .filter((story) => storyActivationCommitIndex.get(story.id) === commitIndex)
    .map((story) => story.id);
  const addedImages = [...imageActivationCommitIndex]
    .filter(([, activationIndex]) => activationIndex === commitIndex)
    .map(([file]) => file);
  const activatedPairs = allSamples.accepted.filter(
    (sample) => sample.activationCommitIndex === commitIndex
  );
  const regressionChanges = ledger.flatMap((event) => {
    if (event.introducedMetadata.hash === commit.hash) {
      return [{ type: 'introduced', id: event.id, summary: event.summary }];
    }
    if (event.fixedMetadata?.hash === commit.hash) {
      return [{ type: 'fixed', id: event.id, summary: event.summary }];
    }
    return [];
  });
  const harnessChanges = harnessLedger.flatMap((event) => {
    if (event.detectedMetadata.hash === commit.hash) {
      return [
        {
          type: 'harness-detected',
          id: event.id,
          summary: event.summary,
        },
      ];
    }
    const resolution = event.resolvedMetadata.find(
      (metadata) => metadata.hash === commit.hash
    );
    if (resolution) {
      return [
        {
          type: 'harness-resolution',
          id: event.id,
          summary: event.resolution,
        },
      ];
    }
    return [];
  });
  const causes = Object.entries(componentContributions)
    .filter(([, contribution]) => Math.abs(contribution) >= 1e-12)
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
    .map(([component, contribution]) => ({
      component,
      contribution,
      direction: contribution > 0 ? 'up' : 'down',
    }));
  commitPoints.push({
    index: commitIndex,
    day: commit.date,
    timestamp: commit.timestamp,
    commit,
    evidenceFileCount: commit.files.length,
    addedStoryIds,
    addedImages,
    activatedPairCount: activatedPairs.length,
    activatedRejectedPairCount: activatedRejectedPairs.length,
    activatedHarnessPairCount: activatedHarnessPairs.length,
    cumulativeAcceptedPairCount: acceptedPairs.length,
    cumulativeRejectedPairCount: rejectedPairs.length,
    rollingPairCount: rollingPairs.length,
    cumulativeStoryCount: activeStories.length,
    scopeCoverage,
    clientCompleteness,
    visual: {
      ...visual,
      rollingWindowSize: visualRollingWindowSize,
      activatedPairs,
      activatedRejectedPairs,
      activatedHarnessPairs,
      previousLoss: previousVisual?.loss ?? null,
      previousMedianPercent: previousVisual?.medianPercent ?? null,
      medianDelta:
        previousVisual?.medianPercent === null ||
        previousVisual?.medianPercent === undefined ||
        visual.medianPercent === null
          ? null
          : visual.medianPercent - previousVisual.medianPercent,
    },
    reliability: {
      loss: reliabilityPoints / maximumReliabilityPoints,
      activeEvents: events.map(({ introducedMetadata, fixedMetadata, ...event }) => event),
      activeHarnessIssues: harnessEvents.map(
        ({
          detectedMetadata,
          resolvedMetadata,
          resolutionEvidence: _resolutionEvidence,
          ...event
        }) => event
      ),
      points: reliabilityPoints,
    },
    components: calculated.components,
    componentContributions,
    causes,
    regressionChanges: [...regressionChanges, ...harnessChanges],
    lossDelta,
    loss: calculated.loss,
    bestLoss,
  });
  previousComponents = calculated.components;
}
const smoothLosses = exponentialMovingAverage(
  commitPoints.map((point) => point.loss),
  emaAlpha
);
commitPoints.forEach((point, index) => {
  point.smoothLoss = smoothLosses[index];
});
const riseAnalysis = commitPoints
  .filter((point) => point.lossDelta > 0.01)
  .map((point) => ({
    index: point.index,
    timestamp: point.timestamp,
    day: point.day,
    commit: point.commit,
    loss: point.loss,
    lossDelta: point.lossDelta,
    smoothLoss: point.smoothLoss,
    causes: point.causes.filter((cause) => cause.contribution > 0),
    countervailingCauses: point.causes.filter((cause) => cause.contribution < 0),
    addedStoryIds: point.addedStoryIds,
    addedImages: point.addedImages,
    activatedPairCount: point.activatedPairCount,
    regressionChanges: point.regressionChanges,
    explanation: [
      ...point.causes
        .filter((cause) => cause.contribution > 0)
        .map(
          (cause) =>
            `${cause.component} added ${cause.contribution.toFixed(2)} loss points`
        ),
      ...point.regressionChanges
        .filter((change) => change.type === 'introduced')
        .map((change) => `regression introduced: ${change.summary}`),
      point.addedStoryIds.length
        ? `${point.addedStoryIds.length} newly discovered stories changed scope/client expectations`
        : null,
      point.activatedPairCount
        ? `${point.activatedPairCount} visual pairs entered the rolling window`
        : null,
    ].filter(Boolean),
  }));
const dayAnalysis = days.map((day) => {
  const dayPoints = commitPoints.filter((point) => point.day === day);
  const first = dayPoints[0];
  const last = dayPoints.at(-1);
  const previous = commitPoints[first.index - 1] ?? null;
  const openingLoss = previous?.loss ?? first.loss;
  return {
    day,
    firstCommitIndex: first.index,
    lastCommitIndex: last.index,
    commitCount: dayPoints.length,
    openingLoss,
    closingLoss: last.loss,
    netLossDelta: last.loss - openingLoss,
    riseCount: dayPoints.filter((point) => point.lossDelta > 0.01).length,
    fallCount: dayPoints.filter((point) => point.lossDelta < -0.01).length,
    addedStoryCount: dayPoints.reduce(
      (total, point) => total + point.addedStoryIds.length,
      0
    ),
    activatedPairCount: dayPoints.reduce(
      (total, point) => total + point.activatedPairCount,
      0
    ),
    componentContributions: Object.fromEntries(
      Object.keys(FIDELITY_LOSS_WEIGHTS).map((component) => [
        component,
        dayPoints.reduce(
          (total, point) =>
            total + point.componentContributions[component],
          0
        ),
      ])
    ),
    commitIndexes: dayPoints.map((point) => point.index),
  };
});
const points = days.map((day) => {
  const point = [...commitPoints].reverse().find((entry) => entry.day === day);
  const commits = dayCommits.get(day) ?? [];
  return {
    ...point,
    commitCount: commits.length,
    newStoryCount: commitPoints
      .filter((entry) => entry.day === day)
      .reduce((total, entry) => total + entry.addedStoryIds.length, 0),
    visual: {
      ...point.visual,
      acceptedPairCount: point.cumulativeAcceptedPairCount,
      rejectedPairCount: point.cumulativeRejectedPairCount,
      acceptedPairs: allSamples.accepted.filter(
        (sample) => sample.activationCommitIndex <= point.index
      ),
      rejectedPairs: allSamples.rejected.filter(
        (sample) => sample.activationCommitIndex <= point.index
      ),
    },
  };
});

const result = {
  version: 1,
  generatedFrom: {
    archive: 'screenshot-archive.js',
    firstDay: days[0],
    lastDay: days.at(-1),
    finalStoryCount: archive.storyCount,
    finalImageCount: archive.imageCount,
    evidenceCommitCount: evidenceCommits.length,
  },
  formula: {
    expression:
      '100 × (0.30 × scopeGap + 0.25 × clientGap + 0.35 × visualDistance + 0.10 × reliabilityDebt)',
    weights: FIDELITY_LOSS_WEIGHTS,
    visual:
      'Median same-state RGB MAE, capped at 10%, shrunk toward 50% loss until 12 accepted pairs exist.',
    comparability:
      'Pairs require normalized state names and matching aspect ratio within 1.5%; high MAE remains scored and is classified as poor or critical parity.',
    scope:
      'Cumulative unique work stories divided by the final known 379-story scope; continuous frames count as one story.',
    completeness:
      'Observed Web/Lynx/Native cells divided by expected cells for discovered stories.',
    reliability:
      'Active, commit-bounded regression severity points divided by the ledger maximum.',
    granularity:
      'Every commit that adds or updates evidence produces a measured point; smoothLoss is an EMA over measured points, not interpolated evidence.',
  },
  smoothing: {
    method: 'exponential-moving-average',
    alpha: emaAlpha,
    source: 'commitPoints.loss',
  },
  reliabilityLedger: ledger,
  harnessIssueLedger: harnessLedger,
  commitPoints,
  riseAnalysis,
  dayAnalysis,
  points,
};

writeFileSync(outputJsonPath, `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(
  outputJsPath,
  `globalThis.__SYNARA_FIDELITY_LOSS__ = ${JSON.stringify(result, null, 2)};\n`
);
console.log(
  `Generated ${commitPoints.length} commit points and ${points.length} daily anchors: ${commitPoints[0].loss.toFixed(2)} → ${commitPoints.at(-1).loss.toFixed(2)}`
);
