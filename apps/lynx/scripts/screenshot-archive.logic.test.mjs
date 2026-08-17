import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
