import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateFidelityLoss,
  captureMismatchReason,
  classifyRenderedTheme,
  daysWithCommitPoints,
  exponentialMovingAverage,
  groupEvidenceFilesBySourceCommit,
  isComparableImageGeometry,
  median,
  normalizeEvidenceName,
  resolveEvidenceActivationIndex,
  reliabilityLossFromPoints,
  resolveEvidenceSourceCommit,
  visualQualityBand,
  visualLossFromSamples,
  visualPairMatchesIssue,
  visualSampleSupersessionAtCommit,
  weightedComponentContributions,
} from './fidelity-loss.logic.mjs';

test('keeps daily anchors only for days represented by commit points', () => {
  assert.deepEqual(
    daysWithCommitPoints(
      ['2026-08-19', '2026-08-20', '2026-09-02'],
      [{ day: '2026-08-19' }, { day: '2026-09-02' }]
    ),
    ['2026-08-19', '2026-09-02']
  );
});

test('normalizes paired client filenames without erasing state identity', () => {
  assert.equal(normalizeEvidenceName('web-light.png'), 'light');
  assert.equal(normalizeEvidenceName('lynx-light.png'), 'light');
  assert.equal(normalizeEvidenceName('native.png'), 'raw');
  assert.equal(normalizeEvidenceName('open-final-web.png'), 'open-final');
});

test('keeps post-fix suffixes distinct for explicit pair selection', () => {
  assert.equal(normalizeEvidenceName('landing.png'), 'landing');
  assert.equal(normalizeEvidenceName('landing-after.png'), 'landing-after');
});

test('prefers explicit source commits for remote-only evidence', () => {
  const firstCommitByFile = new Map([['shots/local.png', 'local-commit']]);
  assert.equal(
    resolveEvidenceSourceCommit(
      {
        repoPath: 'shots/remote.png',
        sourceCommit: 'remote-source-commit',
      },
      firstCommitByFile
    ),
    'remote-source-commit'
  );
  assert.equal(
    resolveEvidenceSourceCommit({ repoPath: 'shots/local.png' }, firstCommitByFile),
    'local-commit'
  );
  assert.equal(
    resolveEvidenceSourceCommit({ repoPath: 'shots/missing.png' }, firstCommitByFile),
    null
  );
});

test('groups remote evidence files by their source commit', () => {
  assert.deepEqual(
    groupEvidenceFilesBySourceCommit([
      { repoPath: 'shots/a.png', sourceCommit: 'commit-a' },
      { repoPath: 'shots/b.png', sourceCommit: 'commit-a' },
      { repoPath: 'shots/c.png', sourceCommit: 'commit-b' },
      { repoPath: 'shots/legacy.png' },
    ]),
    new Map([
      ['commit-a', ['shots/a.png', 'shots/b.png']],
      ['commit-b', ['shots/c.png']],
    ])
  );
});

test('anchors evidence without source metadata to its evidence day', () => {
  const evidenceCommits = [
    { hash: 'first', date: '2026-08-14' },
    { hash: 'last-on-day', date: '2026-08-14' },
    { hash: 'future', date: '2026-08-19' },
  ];
  const commitIndexByHash = new Map(
    evidenceCommits.map((commit, index) => [commit.hash, index])
  );

  assert.equal(
    resolveEvidenceActivationIndex({
      asset: {
        day: '2026-08-14',
        repoPath: 'shots/2026-08-14/remote-only/web.png',
      },
      firstCommitByFile: new Map(),
      commitIndexByHash,
      evidenceCommits,
    }),
    1
  );
  assert.equal(
    resolveEvidenceActivationIndex({
      asset: {
        day: '2026-08-18',
        repoPath: 'shots/2026-08-18/explicit/loss.json',
        sourceCommit: 'future',
      },
      firstCommitByFile: new Map(),
      commitIndexByHash,
      evidenceCommits,
    }),
    2
  );
});

test('calculates robust medians', () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
});

test('keeps critical parity scored and recognizes Native titlebar geometry', () => {
  assert.equal(visualQualityBand(90), 'critical');
  assert.equal(visualQualityBand(20), 'poor');
  assert.equal(visualQualityBand(5), 'noticeable');
  assert.equal(visualQualityBand(0.5), 'close');
  assert.equal(
    isComparableImageGeometry(
      { width: 1280, height: 820 },
      { width: 2560, height: 1576 }
    ),
    true
  );
  assert.equal(
    isComparableImageGeometry(
      { width: 1280, height: 820 },
      { width: 900, height: 900 }
    ),
    false
  );
});

test('separates capture theme mismatches from product visual loss', () => {
  assert.equal(
    classifyRenderedTheme({
      meanLuminance: 21,
      brightFraction: 0,
      darkFraction: 0.97,
    }),
    'dark'
  );
  assert.equal(
    classifyRenderedTheme({
      meanLuminance: 252,
      brightFraction: 0.97,
      darkFraction: 0,
    }),
    'light'
  );
  assert.equal(
    captureMismatchReason({
      declaredLeftTheme: 'light',
      declaredRightTheme: 'light',
      renderedLeftTheme: 'dark',
      renderedRightTheme: 'light',
    }),
    'capture-theme-mismatch'
  );
  assert.equal(
    captureMismatchReason({
      declaredLeftTheme: 'light',
      declaredRightTheme: 'light',
      renderedLeftTheme: 'light',
      renderedRightTheme: 'light',
    }),
    null
  );
  assert.equal(
    captureMismatchReason({
      declaredLeftTheme: null,
      declaredRightTheme: null,
      renderedLeftTheme: 'dark',
      renderedRightTheme: 'light',
    }),
    'capture-theme-mismatch'
  );
  assert.equal(
    captureMismatchReason({
      declaredLeftTheme: null,
      declaredRightTheme: null,
      renderedLeftTheme: 'mixed',
      renderedRightTheme: 'light',
    }),
    null
  );
});

test('keeps explicit product-state capture mismatches out of visual samples', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-14--workspace--split-layout',
    excludeVisualPairs: true,
  };
  assert.equal(
    '2026-08-14--workspace--split-layout'.startsWith(issue.affectedStoryPrefix) &&
      issue.excludeVisualPairs === true,
    true
  );
  assert.equal(
    '2026-08-14--workspace--visual-matrix'.startsWith(issue.affectedStoryPrefix),
    false
  );
  assert.equal(
    '2026-08-13--temporary-chat-current--on'.startsWith(
      '2026-08-13--temporary-chat-current--'
    ),
    true
  );
  assert.equal(
    '2026-08-14--automations--detail'.startsWith(
      '2026-08-14--automations--detail'
    ),
    true
  );
  assert.equal(
    '2026-08-10--settings-general-matrix-current--browser--settings-general-light-1440'.startsWith(
      '2026-08-10--settings-general-matrix-current--browser--settings-general-'
    ),
    true
  );
});

test('excludes only mismatched current composer token Browser states', () => {
  const issue = {
    affectedStoryIds: ['2026-09-02--composer-tokens-1280-current'],
    affectedStateKeys: [
      'skill-menu',
      'mention-menu',
      'skill-selected',
      'mention-selected',
    ],
    affectedClientPairs: ['web:lynx'],
    excludeVisualPairs: true,
  };

  for (const stateKey of issue.affectedStateKeys) {
    assert.equal(
      visualPairMatchesIssue(
        {
          storyId: '2026-09-02--composer-tokens-1280-current',
          stateKey,
          leftClient: 'web',
          rightClient: 'lynx',
        },
        issue
      ),
      true
    );
  }
  for (const sample of [
    {
      storyId: '2026-09-02--composer-tokens-1280-current',
      stateKey: 'persisted-tokens',
      leftClient: 'web',
      rightClient: 'lynx',
    },
    {
      storyId: '2026-09-02--composer-tokens-1280-current',
      stateKey: 'skill-menu',
      leftClient: 'lynx',
      rightClient: 'native',
    },
    {
      storyId: '2026-08-02--harness--markdown-tokens',
      stateKey: 'skill-menu',
      leftClient: 'web',
      rightClient: 'lynx',
    },
  ]) {
    assert.equal(visualPairMatchesIssue(sample, issue), false);
  }
});

test('supports exact story lists when a shared prefix would be too broad', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-14--automations--',
    affectedStoryIds: [
      '2026-08-14--automations--list',
      '2026-08-14--automations--empty',
    ],
  };
  assert.equal(
    visualPairMatchesIssue(
      { storyId: '2026-08-14--automations--list', stateKey: 'raw' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId: '2026-08-14--automations--create-dialog', stateKey: 'raw' },
      issue
    ),
    false
  );
});

test('supports state-scoped exclusions without dropping valid sibling pairs', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-09--environment-',
    affectedStateKeys: ['dark-bottom-1280x480'],
  };
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-09--environment-loaded-current',
        stateKey: 'dark-bottom-1280x480',
      },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-09--environment-loaded-current',
        stateKey: 'light-bottom-1280x480',
      },
      issue
    ),
    false
  );
});

test('scopes the Command Palette empty-state exclusion to one state and pair', () => {
  const issue = {
    affectedStoryIds: ['2026-08-03--command-k--browser--states'],
    affectedStateKeys: ['empty'],
    affectedClientPairs: ['web:lynx'],
  };
  const base = {
    storyId: '2026-08-03--command-k--browser--states',
    leftClient: 'web',
    rightClient: 'lynx',
  };

  assert.equal(visualPairMatchesIssue({ ...base, stateKey: 'empty' }, issue), true);
  assert.equal(visualPairMatchesIssue({ ...base, stateKey: 'query' }, issue), false);
});

test('scopes the Command Palette open-before provider mismatch exactly', () => {
  const issue = {
    affectedStoryIds: ['2026-08-06--command-k-current'],
    affectedStateKeys: ['open-before'],
    affectedClientPairs: ['web:lynx'],
  };
  const base = {
    storyId: '2026-08-06--command-k-current',
    leftClient: 'web',
    rightClient: 'lynx',
  };

  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'open-before' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'open-final' }, issue),
    false
  );
});

test('matches only the exact focused Command Palette provider-state stories', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-06--command-k-footer-current',
      '2026-08-06--command-k-input-current',
    ],
    affectedStateKeys: ['open'],
    affectedClientPairs: ['web:lynx'],
  };

  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-06--command-k-input-current',
        stateKey: 'open',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-06--command-k-placeholder-current',
        stateKey: 'open',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
});

test('supports client-pair exclusions without dropping a valid browser sibling', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-08--current-head-landing-light-1280',
    affectedClientPairs: ['lynx:native'],
  };
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-08--current-head-landing-light-1280',
        stateKey: 'raw',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-08--current-head-landing-light-1280',
        stateKey: 'raw',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
});

test('excludes only the P8-Q2 Settings overlay browser pair', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-03--p8-q2--settings--',
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-03--p8-q2--settings--light-1440';

  assert.equal(
    visualPairMatchesIssue(
      {
        storyId,
        stateKey: 'raw',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId,
        stateKey: 'raw',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    false
  );
});

test('preserves P8-Q2 Pull requests Native siblings', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-03--p8-q2--pull-requests--',
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-03--p8-q2--pull-requests--dark-1280';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('excludes only the P8-Q2 Thread transcript-mismatched Native pair', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-03--p8-q2--thread--',
    affectedClientPairs: ['lynx:native'],
  };
  const storyId = '2026-08-03--p8-q2--thread--dark-1280';

  assert.equal(
    visualPairMatchesIssue(
      {
        storyId,
        stateKey: 'raw',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId,
        stateKey: 'raw',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
});

test('excludes raw and comparison P10 Thread Native transcript mismatches', () => {
  const issue = {
    affectedStoryPrefix:
      '2026-08-04--p10-perceptual-fidelity--final-matrix--thread-default-',
    affectedClientPairs: ['lynx:native'],
  };
  const base = {
    storyId:
      '2026-08-04--p10-perceptual-fidelity--final-matrix--thread-default-light-1280',
    leftClient: 'lynx',
    rightClient: 'native',
  };

  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'raw' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'comparison' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { ...base, leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    false
  );
});

test('excludes only P10 final-matrix Browser overlay and connection-state mismatches', () => {
  const issue = {
    affectedStoryPrefix:
      '2026-08-04--p10-perceptual-fidelity--final-matrix--',
    affectedClientPairs: ['web:lynx'],
  };
  for (const route of [
    'landing-default',
    'thread-default',
    'settings-general',
    'kanban-project',
    'pull-requests',
  ]) {
    const base = {
      storyId: `2026-08-04--p10-perceptual-fidelity--final-matrix--${route}-dark-1280`,
      leftClient: 'web',
      rightClient: 'lynx',
    };
    assert.equal(
      visualPairMatchesIssue({ ...base, stateKey: 'raw' }, issue),
      true
    );
    assert.equal(
      visualPairMatchesIssue({ ...base, stateKey: 'comparison' }, issue),
      true
    );
  }
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId:
          '2026-08-04--p10-perceptual-fidelity--final-matrix--thread-default-dark-1280',
        stateKey: 'raw',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    false
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId:
          '2026-08-04--p10-perceptual-fidelity--final-overlays--extras-open-dark-1280',
        stateKey: 'raw',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
});

test('excludes only P10 final-overlays Browser provider-state mismatches', () => {
  const issue = {
    affectedStoryPrefix:
      '2026-08-04--p10-perceptual-fidelity--final-overlays--',
    affectedClientPairs: ['web:lynx'],
  };
  const base = {
    storyId:
      '2026-08-04--p10-perceptual-fidelity--final-overlays--skill-menu-filtered-dark-1280',
    leftClient: 'web',
    rightClient: 'lynx',
  };

  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'raw' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'comparison' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { ...base, leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        ...base,
        storyId:
          '2026-08-04--p10-perceptual-fidelity--final-matrix--thread-default-dark-1280',
      },
      issue
    ),
    false
  );
});

test('excludes only the unhydrated P10 Settings General Browser pair', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-04--p10-perceptual-fidelity--browser--settings-general',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  const base = {
    storyId:
      '2026-08-04--p10-perceptual-fidelity--browser--settings-general',
    leftClient: 'web',
    rightClient: 'lynx',
  };

  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'raw' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue({ ...base, stateKey: 'comparison' }, issue),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        ...base,
        storyId:
          '2026-08-04--p10-perceptual-fidelity--final-matrix--settings-general-light-1280',
      },
      issue
    ),
    false
  );
});

test('excludes only the overlay-contaminated Composer Details shell pairs', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-03--composer-details--browser--extras-default-1280',
      '2026-08-03--composer-details--browser--project-picker-1280',
    ],
    affectedClientPairs: ['web:lynx'],
  };

  for (const [storyId, stateKey] of [
    ['2026-08-03--composer-details--browser--extras-default-1280', 'raw'],
    ['2026-08-03--composer-details--browser--extras-default-1280', 'menu'],
    ['2026-08-03--composer-details--browser--project-picker-1280', 'open'],
    ['2026-08-03--composer-details--browser--project-picker-1280', 'selected'],
  ]) {
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey, leftClient: 'web', rightClient: 'lynx' },
        issue
      ),
      true
    );
  }
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId:
          '2026-08-03--composer-details--browser--skills-mentions-1280',
        stateKey: 'skill-menu',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
});

test('excludes only the runtime mention-chip Browser overlay mismatch', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-04--p10-perceptual-fidelity--specimens--runtime--mention-chip',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  const sample = {
    storyId:
      '2026-08-04--p10-perceptual-fidelity--specimens--runtime--mention-chip',
    stateKey: 'raw',
    leftClient: 'web',
    rightClient: 'lynx',
  };

  assert.equal(visualPairMatchesIssue(sample, issue), true);
  assert.equal(
    visualPairMatchesIssue(
      { ...sample, leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        ...sample,
        storyId: '2026-08-02--harness--markdown-tokens',
        stateKey: 'mention-selected',
      },
      issue
    ),
    false
  );
});

test('excludes the Settings Shortcuts provider-overlay browser family', () => {
  const issue = {
    affectedStoryPrefix: '2026-08-03--settings-shortcuts--browser--',
    affectedClientPairs: ['web:lynx'],
  };

  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-03--settings-shortcuts--browser--dark-1440',
        stateKey: 'raw',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-03--settings-shortcuts--native--dark-1440',
        stateKey: 'raw',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    false
  );
});

test('preserves August 5 Appearance Native siblings', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-05--settings-appearance-current',
      '2026-08-05--settings-appearance-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-05--settings-appearance-current';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('preserves August 5 Settings Skills Native siblings', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-05--settings-skills-current',
      '2026-08-05--settings-skills-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-05--settings-skills-current';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('keeps August 5 Integrations and AppSnap harness scope separate from Native supersession', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-05--settings-integrations-current',
      '2026-08-05--settings-appsnap-current',
      '2026-08-05--settings-integrations-dark-1440',
      '2026-08-05--settings-appsnap-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-05--settings-appsnap-current';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('excludes August 5 Profile and Advanced Browser provider-state mismatches only', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-05--settings-profile-current',
      '2026-08-05--settings-advanced-current',
      '2026-08-05--settings-profile-dark-1440',
      '2026-08-05--settings-advanced-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
  };

  for (const storyId of issue.affectedStoryIds) {
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
        issue
      ),
      true
    );
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
        issue
      ),
      false
    );
  }
});

test('excludes only the August 6 dark Providers Browser overlay pair', () => {
  const issue = {
    affectedStoryIds: ['2026-08-06--providers-dark-1440'],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-06--providers-dark-1440';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('excludes only the offline Sidebar primary-shortcut Browser stories', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-06--sidebar-primary-shortcut-current',
      '2026-08-06--sidebar-primary-shortcut-reveal-current',
    ],
    affectedClientPairs: ['web:lynx'],
  };

  for (const storyId of issue.affectedStoryIds) {
    for (const stateKey of ['raw', 'default', 'hover']) {
      assert.equal(
        visualPairMatchesIssue(
          { storyId, stateKey, leftClient: 'web', rightClient: 'lynx' },
          issue
        ),
        true
      );
      assert.equal(
        visualPairMatchesIssue(
          { storyId, stateKey, leftClient: 'lynx', rightClient: 'native' },
          issue
        ),
        false
      );
    }
  }
});

test('excludes only the mismatched Settings Search Native default frame', () => {
  const issue = {
    affectedStoryIds: ['2026-08-06--settings-search-current'],
    affectedStateKeys: ['raw'],
    affectedClientPairs: ['lynx:native'],
  };
  const storyId = '2026-08-06--settings-search-current';
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    true
  );
  for (const sample of [
    { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
    { storyId, stateKey: 'filtered', leftClient: 'lynx', rightClient: 'native' },
    {
      storyId: '2026-08-06--settings-search-other',
      stateKey: 'raw',
      leftClient: 'lynx',
      rightClient: 'native',
    },
  ]) {
    assert.equal(visualPairMatchesIssue(sample, issue), false);
  }
});

test('excludes only the mixed Composer model-row open state', () => {
  const issue = {
    affectedStoryIds: ['2026-08-06--composer-model-row-text-current'],
    affectedStateKeys: ['open'],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-06--composer-model-row-text-current';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'open', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'closed', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    false
  );
});

test('excludes only the Settings search Browser transport-state mismatch', () => {
  const issue = {
    affectedStoryIds: ['2026-08-06--settings-search-current'],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-06--settings-search-current';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('excludes only the Settings Archived Browser provider-state mismatch', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-05--settings-archived-current',
      '2026-08-05--settings-archived-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  const storyId = '2026-08-05--settings-archived-current';

  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      issue
    ),
    true
  );
  assert.equal(
    visualPairMatchesIssue(
      { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
      issue
    ),
    false
  );
});

test('excludes Settings Worktrees and shared-menu Browser overlays only', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-05--settings-worktrees-current',
      '2026-08-05--settings-worktrees-dark-1440',
      '2026-08-06--settings-shared-menu-text-current',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  for (const storyId of issue.affectedStoryIds) {
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
        issue
      ),
      true
    );
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
        issue
      ),
      false
    );
  }
});

test('excludes Composer provider-banner Browser mismatches only', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-06--composer-provider-row-current',
      '2026-08-08--composer-permission-icon-current',
      '2026-08-06--sidebar-primary-action-icon-current',
      '2026-08-06--sidebar-primary-action-label-current',
    ],
    affectedClientPairs: ['web:lynx'],
  };
  for (const storyId of issue.affectedStoryIds) {
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
        issue
      ),
      true
    );
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
        issue
      ),
      false
    );
  }
});

test('excludes only the explicit August 6 Composer provider-shell open states', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-06--composer-picker-chrome-current',
      '2026-08-06--composer-footer-action-gap-current',
      '2026-08-06--extras-current',
    ],
    affectedStateKeys: ['open', 'open-before', 'open-final'],
    affectedClientPairs: ['web:lynx'],
  };

  for (const [storyId, stateKey] of [
    ['2026-08-06--composer-picker-chrome-current', 'open'],
    ['2026-08-06--composer-footer-action-gap-current', 'open'],
    ['2026-08-06--extras-current', 'open-before'],
    ['2026-08-06--extras-current', 'open-final'],
  ]) {
    assert.equal(
      visualPairMatchesIssue(
        { storyId, stateKey, leftClient: 'web', rightClient: 'lynx' },
        issue
      ),
      true
    );
  }
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-06--extras-current',
        stateKey: 'closed',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-06--extras-current',
        stateKey: 'open-final',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    false
  );
});

test('excludes only focused P10 Browser skill and picker mixed states', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-04--p10-perceptual-fidelity--browser--skill-menu-filtered',
      '2026-08-04--p10-perceptual-fidelity--browser--project-picker-open',
    ],
    affectedStateKeys: ['raw', 'comparison'],
    affectedClientPairs: ['web:lynx'],
  };

  for (const storyId of issue.affectedStoryIds) {
    for (const stateKey of issue.affectedStateKeys) {
      assert.equal(
        visualPairMatchesIssue(
          { storyId, stateKey, leftClient: 'web', rightClient: 'lynx' },
          issue
        ),
        true
      );
    }
  }
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: issue.affectedStoryIds[0],
        stateKey: 'raw',
        leftClient: 'lynx',
        rightClient: 'native',
      },
      issue
    ),
    false
  );
});

test('excludes only the four P10 Browser default overlay stories', () => {
  const issue = {
    affectedStoryIds: [
      '2026-08-04--p10-perceptual-fidelity--browser--default',
      '2026-08-04--p10-perceptual-fidelity--browser--composer-default',
      '2026-08-04--p10-perceptual-fidelity--browser--landing-default',
      '2026-08-04--p10-perceptual-fidelity--browser--sidebar-default',
    ],
    affectedStateKeys: ['raw', 'comparison'],
    affectedClientPairs: ['web:lynx'],
  };

  for (const storyId of issue.affectedStoryIds) {
    for (const stateKey of issue.affectedStateKeys) {
      assert.equal(
        visualPairMatchesIssue(
          { storyId, stateKey, leftClient: 'web', rightClient: 'lynx' },
          issue
        ),
        true
      );
    }
  }
  assert.equal(
    visualPairMatchesIssue(
      {
        storyId: '2026-08-03--p9-u5-composer--browser--default',
        stateKey: 'screenshot',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      issue
    ),
    false
  );
});

test('allows a known modal-backdrop theme mismatch to override mixed luminance', () => {
  const issue = {
    type: 'capture-theme-mismatch',
    affectedStoryPrefix:
      '2026-08-10--settings-release-history-rhythm-current',
    excludeVisualPairs: true,
  };
  assert.equal(
    '2026-08-10--settings-release-history-rhythm-current'.startsWith(
      issue.affectedStoryPrefix
    ) && issue.excludeVisualPairs,
    true
  );
  assert.equal(
    issue.type === 'capture-theme-mismatch'
      ? 'capture-theme-mismatch'
      : 'capture-product-state-mismatch',
    'capture-theme-mismatch'
  );
});

test('matches an explicit whole-frame theme mismatch family by story prefix', () => {
  const prefix = '2026-08-10--empty-thread-';
  assert.equal(
    '2026-08-10--empty-thread-null-branch-current'.startsWith(prefix),
    true
  );
  assert.equal(
    '2026-08-10--empty-thread-heading-current'.startsWith(prefix),
    true
  );
});

test('keeps historical product pairs until later product evidence supersedes them', () => {
  const ledger = [
    {
      affectedStoryPrefixes: ['2026-08-14--automations--create-dialog'],
      supersededAt: 'fixed',
    },
  ];
  const commitIndexByHash = new Map([
    ['capture', 2],
    ['fixed', 5],
  ]);
  const sample = { storyId: '2026-08-14--automations--create-dialog-expanded' };

  assert.equal(
    visualSampleSupersessionAtCommit(sample, 4, ledger, commitIndexByHash),
    null
  );
  assert.equal(
    visualSampleSupersessionAtCommit(sample, 5, ledger, commitIndexByHash),
    ledger[0]
  );
});

test('supersedes only the committed wide Plugin Skills Browser state', () => {
  const ledger = [
    {
      id: 'plugin-skills-wide',
      affectedStoryPrefixes: ['2026-08-14--plugins--visual-matrix'],
      affectedStateKeys: ['skills-wide-light'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'plugin-skills-fixed',
    },
  ];
  const commitIndexByHash = new Map([['plugin-skills-fixed', 12]]);
  const storyId = '2026-08-14--plugins--visual-matrix';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'skills-wide-light', leftClient: 'web', rightClient: 'lynx' },
      12,
      ledger,
      commitIndexByHash
    )?.id,
    'plugin-skills-wide'
  );
  for (const sample of [
    { storyId, stateKey: 'plugins-wide-light', leftClient: 'web', rightClient: 'lynx' },
    { storyId, stateKey: 'skills-compact-light', leftClient: 'web', rightClient: 'lynx' },
    { storyId, stateKey: 'skills-wide-light', leftClient: 'lynx', rightClient: 'native' },
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(sample, 12, ledger, commitIndexByHash),
      null
    );
  }
});

test('supersedes only the retained transcript scroll states at their commit boundary', () => {
  const ledger = [
    {
      id: 'transcript-scroll-current-full-pane',
      affectedStoryPrefixes: ['2026-08-02--harness--transcript-scroll'],
      affectedStateKeys: ['pinned', 'detached'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'transcript-current',
    },
  ];
  const commitIndexByHash = new Map([['transcript-current', 7]]);

  for (const stateKey of ['pinned', 'detached']) {
    assert.equal(
      visualSampleSupersessionAtCommit(
        {
          storyId: '2026-08-02--harness--transcript-scroll',
          stateKey,
          leftClient: 'web',
          rightClient: 'lynx',
        },
        7,
        ledger,
        commitIndexByHash
      )?.id,
      'transcript-scroll-current-full-pane'
    );
  }
  assert.equal(
    visualSampleSupersessionAtCommit(
      {
        storyId: '2026-08-02--harness--markdown-tokens',
        stateKey: 'persisted-tokens',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      7,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes only P8-Q2 Thread Browser cells at the full-pane boundary', () => {
  const ledger = [
    {
      id: 'p8-q2-thread-current-full-pane',
      affectedStoryPrefixes: ['2026-08-03--p8-q2--thread--'],
      affectedStateKeys: ['raw'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'transcript-current',
    },
  ];
  const commitIndexByHash = new Map([['transcript-current', 7]]);
  const storyId = '2026-08-03--p8-q2--thread--dark-1280';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      7,
      ledger,
      commitIndexByHash
    )?.id,
    'p8-q2-thread-current-full-pane'
  );
  for (const sample of [
    { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
    { storyId, stateKey: 'comparison', leftClient: 'web', rightClient: 'lynx' },
    {
      storyId: '2026-08-03--p8-q2--threads--dark-1280',
      stateKey: 'raw',
      leftClient: 'web',
      rightClient: 'lynx',
    },
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(sample, 7, ledger, commitIndexByHash),
      null
    );
  }
});

test('supersedes only the retained dark Settings Behavior Browser cell', () => {
  const ledger = [
    {
      id: 'settings-behavior-dark-current-stable',
      affectedStoryPrefixes: ['2026-08-03--settings-behavior--browser--dark-1440'],
      affectedStateKeys: ['raw'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'behavior-current',
    },
  ];
  const commitIndexByHash = new Map([['behavior-current', 9]]);
  const storyId = '2026-08-03--settings-behavior--browser--dark-1440';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      9,
      ledger,
      commitIndexByHash
    )?.id,
    'settings-behavior-dark-current-stable'
  );
  for (const sample of [
    { storyId, stateKey: 'raw', leftClient: 'lynx', rightClient: 'native' },
    { storyId, stateKey: 'comparison', leftClient: 'web', rightClient: 'lynx' },
    {
      storyId: '2026-08-03--settings-behavior--browser--light-1280',
      stateKey: 'raw',
      leftClient: 'web',
      rightClient: 'lynx',
    },
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(sample, 9, ledger, commitIndexByHash),
      null
    );
  }
});

test('supersedes current token menu and selection states but preserves persisted output', () => {
  const ledger = [
    {
      id: 'markdown-token-current-menu-and-selection',
      affectedStoryPrefixes: ['2026-08-02--harness--markdown-tokens'],
      affectedStateKeys: [
        'skill-menu',
        'mention-menu',
        'skill-selected',
        'mention-selected',
      ],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'token-current',
    },
  ];
  const commitIndexByHash = new Map([['token-current', 9]]);

  for (const stateKey of [
    'skill-menu',
    'mention-menu',
    'skill-selected',
    'mention-selected',
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(
        {
          storyId: '2026-08-02--harness--markdown-tokens',
          stateKey,
          leftClient: 'web',
          rightClient: 'lynx',
        },
        9,
        ledger,
        commitIndexByHash
      )?.id,
      'markdown-token-current-menu-and-selection'
    );
  }
  assert.equal(
    visualSampleSupersessionAtCommit(
      {
        storyId: '2026-08-02--harness--markdown-tokens',
        stateKey: 'persisted-tokens',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      9,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes persisted token output only at its retained evidence boundary', () => {
  const ledger = [
    {
      id: 'markdown-token-current-persisted-output',
      affectedStoryPrefixes: ['2026-08-02--harness--markdown-tokens'],
      affectedStateKeys: ['persisted-tokens'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'persisted-current',
    },
  ];
  const commitIndexByHash = new Map([['persisted-current', 11]]);

  assert.equal(
    visualSampleSupersessionAtCommit(
      {
        storyId: '2026-08-02--harness--markdown-tokens',
        stateKey: 'persisted-tokens',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      11,
      ledger,
      commitIndexByHash
    )?.id,
    'markdown-token-current-persisted-output'
  );
  assert.equal(
    visualSampleSupersessionAtCommit(
      {
        storyId: '2026-08-02--harness--markdown-tokens',
        stateKey: 'skill-menu',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      11,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes only the four retained 1280 composer token states', () => {
  const ledger = [
    {
      id: 'composer-details-tokens-1280-current',
      affectedStoryPrefixes: [
        '2026-08-03--composer-details--browser--skills-mentions-1280',
      ],
      affectedStateKeys: [
        'skill-menu',
        'mention-menu',
        'skill-selected',
        'mention-selected',
      ],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'composer-current',
    },
  ];
  const commitIndexByHash = new Map([['composer-current', 12]]);

  for (const stateKey of [
    'skill-menu',
    'mention-menu',
    'skill-selected',
    'mention-selected',
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(
        {
          storyId: '2026-08-03--composer-details--browser--skills-mentions-1280',
          stateKey,
          leftClient: 'web',
          rightClient: 'lynx',
        },
        12,
        ledger,
        commitIndexByHash
      )?.id,
      'composer-details-tokens-1280-current'
    );
  }
  assert.equal(
    visualSampleSupersessionAtCommit(
      {
        storyId: '2026-08-03--composer-details--browser--skills-mentions-1280',
        stateKey: 'raw',
        leftClient: 'web',
        rightClient: 'lynx',
      },
      12,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes only the P9 Composer default Browser screenshot', () => {
  const ledger = [
    {
      id: 'p9-composer-default-current-landing',
      affectedStoryPrefixes: ['2026-08-03--p9-u5-composer--browser--default'],
      affectedStateKeys: ['screenshot'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'landing-current',
    },
  ];
  const commitIndexByHash = new Map([['landing-current', 8]]);
  const storyId = '2026-08-03--p9-u5-composer--browser--default';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'screenshot', leftClient: 'web', rightClient: 'lynx' },
      8,
      ledger,
      commitIndexByHash
    )?.id,
    'p9-composer-default-current-landing'
  );
  for (const sample of [
    { storyId, stateKey: 'screenshot', leftClient: 'lynx', rightClient: 'native' },
    {
      storyId: '2026-08-03--p9-u5-composer--browser--extras-default',
      stateKey: 'screenshot',
      leftClient: 'web',
      rightClient: 'lynx',
    },
    { storyId, stateKey: 'open', leftClient: 'web', rightClient: 'lynx' },
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(sample, 8, ledger, commitIndexByHash),
      null
    );
  }
});

test('supersedes only the initial Composer light Browser pair', () => {
  const ledger = [
    {
      id: 'initial-composer-current-landing',
      affectedStoryPrefixes: ['2026-08-02--harness--composer'],
      affectedStateKeys: ['light'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'landing-current',
    },
  ];
  const commitIndexByHash = new Map([['landing-current', 8]]);
  const storyId = '2026-08-02--harness--composer';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'light', leftClient: 'web', rightClient: 'lynx' },
      8,
      ledger,
      commitIndexByHash
    )?.id,
    'initial-composer-current-landing'
  );
  for (const sample of [
    { storyId, stateKey: 'light', leftClient: 'lynx', rightClient: 'native' },
    { storyId, stateKey: 'skills-filtered', leftClient: 'web', rightClient: 'lynx' },
    {
      storyId: '2026-08-02--harness--markdown-tokens',
      stateKey: 'light',
      leftClient: 'web',
      rightClient: 'lynx',
    },
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(sample, 8, ledger, commitIndexByHash),
      null
    );
  }
});

test('supersedes only the static-fallback provider activation model pair', () => {
  const ledger = [
    {
      id: 'composer-provider-activation-current-dynamic-models',
      affectedStoryPrefixes: [
        '2026-08-11--current-head-composer-provider-activation-light-1280',
      ],
      affectedStateKeys: ['models'],
      affectedClientPairs: ['web:lynx'],
      supersededAt: 'dynamic-models',
    },
  ];
  const commitIndexByHash = new Map([['dynamic-models', 12]]);
  const storyId =
    '2026-08-11--current-head-composer-provider-activation-light-1280';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'models', leftClient: 'web', rightClient: 'lynx' },
      12,
      ledger,
      commitIndexByHash
    )?.id,
    'composer-provider-activation-current-dynamic-models'
  );
  for (const sample of [
    { storyId, stateKey: 'models', leftClient: 'lynx', rightClient: 'native' },
    { storyId, stateKey: 'providers', leftClient: 'web', rightClient: 'lynx' },
    {
      storyId: '2026-08-11--current-head-composer-dynamic-models-light-1280',
      stateKey: 'models',
      leftClient: 'web',
      rightClient: 'lynx',
    },
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(sample, 12, ledger, commitIndexByHash),
      null
    );
  }
});

test('supersedes both client pairs when later three-client product evidence exists', () => {
  const ledger = [
    {
      id: 'empty-thread-current',
      affectedStoryPrefixes: ['2026-08-03--p8-q2--threads--'],
      supersededAt: 'centered',
    },
  ];
  const commitIndexByHash = new Map([['centered', 6]]);
  const storyId = '2026-08-03--p8-q2--threads--dark-1280';

  for (const [leftClient, rightClient] of [
    ['web', 'lynx'],
    ['lynx', 'native'],
  ]) {
    assert.equal(
      visualSampleSupersessionAtCommit(
        { storyId, leftClient, rightClient },
        6,
        ledger,
        commitIndexByHash
      )?.id,
      'empty-thread-current'
    );
  }
});

test('scopes product evidence supersession to one client pair', () => {
  const ledger = [
    {
      id: 'native-only-current-state',
      affectedStoryPrefixes: ['2026-08-05--settings-appsnap-current'],
      affectedClientPairs: ['lynx:native'],
      supersededAt: 'fixed',
    },
  ];
  const commitIndexByHash = new Map([['fixed', 5]]);
  const nativeSample = {
    storyId: '2026-08-05--settings-appsnap-current',
    leftClient: 'lynx',
    rightClient: 'native',
  };
  const browserSample = {
    storyId: '2026-08-05--settings-appsnap-current',
    leftClient: 'web',
    rightClient: 'lynx',
  };

  assert.equal(
    visualSampleSupersessionAtCommit(nativeSample, 5, ledger, commitIndexByHash)?.id,
    'native-only-current-state'
  );
  assert.equal(
    visualSampleSupersessionAtCommit(browserSample, 5, ledger, commitIndexByHash),
    null
  );
});

test('scopes product evidence supersession to named states', () => {
  const ledger = [
    {
      affectedStoryPrefixes: ['story'],
      affectedStateKeys: ['open'],
      supersededAt: 'fixed',
    },
  ];
  const commitIndexByHash = new Map([['fixed', 5]]);

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId: 'story-one', stateKey: 'open' },
      5,
      ledger,
      commitIndexByHash
    ),
    ledger[0]
  );
  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId: 'story-one', stateKey: 'closed' },
      5,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes only the P8-Q2 Settings Native sibling at its commit boundary', () => {
  const ledger = [
    {
      id: 'p8-settings-native',
      affectedStoryPrefixes: ['2026-08-03--p8-q2--settings--'],
      affectedClientPairs: ['lynx:native'],
      supersededAt: 'settings-fixed',
    },
  ];
  const commitIndexByHash = new Map([['settings-fixed', 8]]);
  const storyId = '2026-08-03--p8-q2--settings--dark-1280';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, leftClient: 'lynx', rightClient: 'native' },
      7,
      ledger,
      commitIndexByHash
    ),
    null
  );
  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, leftClient: 'lynx', rightClient: 'native' },
      8,
      ledger,
      commitIndexByHash
    )?.id,
    'p8-settings-native'
  );
  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, leftClient: 'web', rightClient: 'lynx' },
      8,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes raw and normalized P10 Settings Native samples only', () => {
  const ledger = [
    {
      id: 'p10-settings-native',
      affectedStoryPrefixes: [
        '2026-08-04--p10-perceptual-fidelity--final-matrix--settings-general-',
      ],
      affectedClientPairs: ['lynx:native'],
      supersededAt: 'settings-fixed',
    },
  ];
  const commitIndexByHash = new Map([['settings-fixed', 8]]);
  const storyId =
    '2026-08-04--p10-perceptual-fidelity--final-matrix--settings-general-dark-1280';

  for (const stateKey of ['raw', 'comparison']) {
    assert.equal(
      visualSampleSupersessionAtCommit(
        { storyId, stateKey, leftClient: 'lynx', rightClient: 'native' },
        8,
        ledger,
        commitIndexByHash
      )?.id,
      'p10-settings-native'
    );
  }
  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, stateKey: 'raw', leftClient: 'web', rightClient: 'lynx' },
      8,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('supersedes only the stale Settings Skills Native samples', () => {
  const ledger = [
    {
      id: 'settings-skills-native',
      affectedStoryPrefixes: ['2026-08-05--settings-skills-'],
      affectedClientPairs: ['lynx:native'],
      supersededAt: 'skills-fixed',
    },
  ];
  const commitIndexByHash = new Map([['skills-fixed', 9]]);
  const storyId = '2026-08-05--settings-skills-dark-1440';

  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, leftClient: 'lynx', rightClient: 'native' },
      9,
      ledger,
      commitIndexByHash
    )?.id,
    'settings-skills-native'
  );
  assert.equal(
    visualSampleSupersessionAtCommit(
      { storyId, leftClient: 'web', rightClient: 'lynx' },
      9,
      ledger,
      commitIndexByHash
    ),
    null
  );
});

test('shrinks sparse visual samples toward a neutral prior', () => {
  assert.deepEqual(visualLossFromSamples([]), {
    loss: 0.5,
    confidence: 0,
    medianPercent: null,
    sampleCount: 0,
  });
  const sparse = visualLossFromSamples([1], 4);
  assert.equal(sparse.confidence, 0.25);
  assert.equal(sparse.loss, 0.4);
  const sufficient = visualLossFromSamples([1, 1, 1, 1], 4);
  assert.equal(sufficient.confidence, 1);
  assert.equal(sufficient.loss, 0.1);
});

test('combines independently bounded loss components', () => {
  const result = calculateFidelityLoss({
    scopeCoverage: 0.5,
    clientCompleteness: 0.8,
    visualLoss: 0.2,
    reliabilityLoss: 0.1,
  });
  assert.ok(Math.abs(result.loss - 28) < 1e-12);
  assert.deepEqual(result.components, {
    scope: 0.5,
    completeness: 0.19999999999999996,
    visual: 0.2,
    reliability: 0.1,
  });
});

test('keeps historical reliability normalization stable as future events are added', () => {
  assert.equal(reliabilityLossFromPoints(1), 0.1);
  assert.equal(reliabilityLossFromPoints(4), 0.4);
  assert.equal(reliabilityLossFromPoints(13), 1);
  assert.throws(
    () => reliabilityLossFromPoints(1, 0),
    /capacity must be positive/u
  );
});

test('calculates a stable exponential moving average', () => {
  assert.deepEqual(exponentialMovingAverage([], 0.5), []);
  assert.deepEqual(exponentialMovingAverage([10, 20, 10], 0.5), [10, 15, 12.5]);
});

test('attributes loss changes to weighted component deltas', () => {
  const contributions = weightedComponentContributions(
    { scope: 0.5, completeness: 0.4, visual: 0.3, reliability: 0.2 },
    { scope: 0.4, completeness: 0.5, visual: 0.6, reliability: 0.1 },
    { scope: 0.3, completeness: 0.25, visual: 0.35, reliability: 0.1 }
  );
  assert.ok(Math.abs(contributions.scope + 3) < 1e-12);
  assert.ok(Math.abs(contributions.completeness - 2.5) < 1e-12);
  assert.ok(Math.abs(contributions.visual - 10.5) < 1e-12);
  assert.ok(Math.abs(contributions.reliability + 1) < 1e-12);
});
