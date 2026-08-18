import assert from 'node:assert/strict';
import test from 'node:test';

import {
  archiveDays,
  buildScreenshotStories,
  mergeScreenshotAssets,
  screenshotDays,
} from './screenshot-archive.logic.mjs';

test('merges remote history with local overrides and new scope', () => {
  const merged = mergeScreenshotAssets({
    remoteImages: [
      {
        day: '2026-08-04',
        repoPath: 'shots/2026-08-04/existing/web.png',
        bytes: 10,
      },
      {
        day: '2026-08-14',
        repoPath: 'shots/2026-08-14/replaced/before.png',
        bytes: 20,
      },
    ],
    localImages: [
      {
        day: '2026-08-04',
        repoPath: 'shots/2026-08-04/existing/web.png',
        bytes: 11,
        gitStatus: 'tracked',
      },
      {
        day: '2026-08-18',
        repoPath: 'shots/2026-08-18/new/native.png',
        bytes: 30,
        gitStatus: 'untracked',
      },
    ],
    deletedRepoPaths: ['shots/2026-08-14/replaced/before.png'],
  });

  assert.deepEqual(
    merged.map(({ repoPath, bytes, gitStatus }) => ({
      repoPath,
      bytes,
      gitStatus,
    })),
    [
      {
        repoPath: 'shots/2026-08-04/existing/web.png',
        bytes: 11,
        gitStatus: 'tracked',
      },
      {
        repoPath: 'shots/2026-08-18/new/native.png',
        bytes: 30,
        gitStatus: 'untracked',
      },
    ]
  );
});

test('derives the complete sorted day range from merged evidence', () => {
  assert.deepEqual(
    screenshotDays([
      { day: '2026-08-18' },
      { day: '2026-08-04' },
      { day: '2026-08-18' },
    ]),
    ['2026-08-04', '2026-08-18']
  );
});

test('includes evidence directory and source commit days in archive range', () => {
  assert.deepEqual(
    archiveDays(
      [{ day: '2026-08-04' }],
      [
        {
          day: '2026-08-18',
          sourceDay: '2026-08-19',
        },
      ]
    ),
    ['2026-08-04', '2026-08-18', '2026-08-19']
  );
});

test('builds an evidence-only story without inflating screenshot count', () => {
  const stories = buildScreenshotStories({
    images: [],
    evidence: [
      {
        day: '2026-08-18',
        directory: 'claude-pending-approval-roundtrip',
        name: 'loss.json',
        repoPath:
          'shots/2026-08-18/claude-pending-approval-roundtrip/loss.json',
        sourceCommit: 'ac06e55f6a968db50f95c84c182a92b52a44bdaa',
        sourceDay: '2026-08-19',
      },
    ],
  });

  assert.equal(stories.length, 1);
  assert.deepEqual(stories[0], {
    id: '2026-08-18--claude-pending-approval-roundtrip',
    day: '2026-08-18',
    directory: 'claude-pending-approval-roundtrip',
    label: 'Claude Pending Approval Roundtrip',
    images: [],
    evidence: [
      {
        day: '2026-08-18',
        directory: 'claude-pending-approval-roundtrip',
        name: 'loss.json',
        repoPath:
          'shots/2026-08-18/claude-pending-approval-roundtrip/loss.json',
        sourceCommit: 'ac06e55f6a968db50f95c84c182a92b52a44bdaa',
        sourceDay: '2026-08-19',
      },
    ],
    imageCount: 0,
    evidenceCount: 1,
    clients: ['evidence'],
    sequence: false,
  });
});

test('merges loss evidence into an existing screenshot story', () => {
  const [story] = buildScreenshotStories({
    images: [
      {
        day: '2026-08-18',
        directory: 'provider-real-connection-parity/web',
        name: 'web-ready.png',
        repoPath:
          'shots/2026-08-18/provider-real-connection-parity/web/web-ready.png',
      },
    ],
    evidence: [
      {
        day: '2026-08-18',
        directory: 'provider-real-connection-parity',
        name: 'loss.json',
        repoPath:
          'shots/2026-08-18/provider-real-connection-parity/loss.json',
      },
    ],
  });

  assert.equal(story.imageCount, 1);
  assert.equal(story.evidenceCount, 1);
  assert.deepEqual(story.clients, ['web', 'evidence']);
});
