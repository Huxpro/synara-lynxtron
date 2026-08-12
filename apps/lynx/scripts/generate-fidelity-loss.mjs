import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import {
  calculateFidelityLoss,
  normalizeEvidenceName,
  visualLossFromSamples,
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
const maximumComparableMaePercent = 25;

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
  const [hash, date, ...subject] = git(
    'show',
    '-s',
    '--format=%H%x09%ad%x09%s',
    '--date=short',
    commit
  ).split('\t');
  return { hash, shortHash: hash.slice(0, 9), date, subject: subject.join('\t') };
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

async function imageMaePercent(leftPath, rightPath) {
  const left = sharp(leftPath).removeAlpha();
  const right = sharp(rightPath).removeAlpha();
  const [leftMetadata, rightMetadata] = await Promise.all([
    left.metadata(),
    right.metadata(),
  ]);
  const leftRatio = leftMetadata.width / leftMetadata.height;
  const rightRatio = rightMetadata.width / rightMetadata.height;
  if (Math.abs(leftRatio - rightRatio) / leftRatio > 0.015) {
    return { accepted: false, reason: 'aspect-ratio-mismatch' };
  }
  const width = Math.min(leftMetadata.width, rightMetadata.width);
  const height = Math.min(leftMetadata.height, rightMetadata.height);
  const [leftPixels, rightPixels] = await Promise.all([
    left.resize(width, height, { fit: 'fill' }).raw().toBuffer(),
    right.resize(width, height, { fit: 'fill' }).raw().toBuffer(),
  ]);
  let total = 0;
  for (let index = 0; index < leftPixels.length; index += 1) {
    total += Math.abs(leftPixels[index] - rightPixels[index]);
  }
  const maePercent = (total / leftPixels.length / 255) * 100;
  if (maePercent > maximumComparableMaePercent) {
    return { accepted: false, reason: 'state-or-crop-mismatch', maePercent };
  }
  return { accepted: true, maePercent };
}

async function visualSamples(stories) {
  const accepted = [];
  const rejected = [];
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
          const result = await imageMaePercent(
            resolve(repoRoot, pair.left),
            resolve(repoRoot, pair.right)
          );
          if (result.accepted) accepted.push({ ...pair, maePercent: result.maePercent });
          else rejected.push({ ...pair, ...result });
        }
      }
    }
  }
  return { accepted, rejected };
}

function completeness(stories) {
  let expected = 0;
  let observed = 0;
  for (const story of stories) {
    const clients = new Set(story.clients);
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

function activeReliabilityEvents(day, ledger) {
  return ledger.filter(
    (entry) =>
      entry.introducedMetadata.date <= day &&
      (!entry.fixedMetadata || entry.fixedMetadata.date > day)
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
const maximumReliabilityPoints = Math.max(
  1,
  ledger.reduce((total, entry) => total + entry.severityPoints, 0)
);
const points = [];
const cumulativeStories = [];
let bestLoss = Number.POSITIVE_INFINITY;

for (const day of days) {
  const newStories = archive.stories.filter((story) => story.day === day);
  cumulativeStories.push(...newStories);
  const samples = await visualSamples(newStories);
  const visual = visualLossFromSamples(
    samples.accepted.map((sample) => sample.maePercent)
  );
  const events = activeReliabilityEvents(day, ledger);
  const reliabilityPoints = events.reduce(
    (total, event) => total + event.severityPoints,
    0
  );
  const scopeCoverage = cumulativeStories.length / archive.storyCount;
  const clientCompleteness = completeness(cumulativeStories);
  const calculated = calculateFidelityLoss({
    scopeCoverage,
    clientCompleteness,
    visualLoss: visual.loss,
    reliabilityLoss: reliabilityPoints / maximumReliabilityPoints,
  });
  bestLoss = Math.min(bestLoss, calculated.loss);
  const commits = dayCommits.get(day) ?? [];
  points.push({
    day,
    commit: commits.at(-1) ?? null,
    commitCount: commits.length,
    newStoryCount: newStories.length,
    cumulativeStoryCount: cumulativeStories.length,
    scopeCoverage,
    clientCompleteness,
    visual: {
      ...visual,
      acceptedPairCount: samples.accepted.length,
      rejectedPairCount: samples.rejected.length,
      acceptedPairs: samples.accepted,
      rejectedPairs: samples.rejected,
    },
    reliability: {
      loss: reliabilityPoints / maximumReliabilityPoints,
      activeEvents: events.map(({ introducedMetadata, fixedMetadata, ...event }) => event),
      points: reliabilityPoints,
    },
    components: calculated.components,
    loss: calculated.loss,
    bestLoss,
  });
}

const result = {
  version: 1,
  generatedFrom: {
    archive: 'screenshot-archive.js',
    firstDay: days[0],
    lastDay: days.at(-1),
    finalStoryCount: archive.storyCount,
    finalImageCount: archive.imageCount,
  },
  formula: {
    expression:
      '100 × (0.30 × scopeGap + 0.25 × clientGap + 0.35 × visualDistance + 0.10 × reliabilityDebt)',
    weights: FIDELITY_LOSS_WEIGHTS,
    visual:
      'Median same-state RGB MAE, capped at 10%, shrunk toward 50% loss until 12 accepted pairs exist.',
    comparability:
      'Pairs require normalized state names, matching aspect ratio within 1.5%, and MAE <= 25%; rejected pairs remain in the ledger.',
    scope:
      'Cumulative unique work stories divided by the final known 379-story scope; continuous frames count as one story.',
    completeness:
      'Observed Web/Lynx/Native cells divided by expected cells for discovered stories.',
    reliability:
      'Active, commit-bounded regression severity points divided by the ledger maximum.',
  },
  reliabilityLedger: ledger,
  points,
};

writeFileSync(outputJsonPath, `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(
  outputJsPath,
  `globalThis.__SYNARA_FIDELITY_LOSS__ = ${JSON.stringify(result, null, 2)};\n`
);
console.log(
  `Generated ${points.length} fidelity-loss points: ${points[0].loss.toFixed(2)} → ${points.at(-1).loss.toFixed(2)}`
);
