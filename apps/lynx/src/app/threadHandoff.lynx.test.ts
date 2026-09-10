import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { resolveNativeThreadHandoffTargets } from './threadHandoff.lynx';

const eligibleThread = {
  id: 'thread-1',
  title: 'Source thread',
  projectId: 'project-1',
  modelSelection: { provider: 'codex', model: 'gpt-5.6-sol' },
  sessionStatus: 'idle',
  latestTurnState: 'completed',
  pendingApprovals: [],
  pendingUserInputs: [],
  handoff: null,
  messages: [
    {
      id: 'message-1',
      role: 'user',
      text: 'hello',
      source: 'native',
      streaming: false,
      createdAt: '2026-08-30T00:00:00.000Z',
    },
  ],
  activities: [],
} as never;

describe('Native thread handoff service', () => {
  it('uses the same eligibility and target-provider policy as the header and sidebar', () => {
    expect(resolveNativeThreadHandoffTargets(eligibleThread)).toEqual([
      'claudeAgent',
      'cursor',
      'antigravity',
      'grok',
      'droid',
      'kilo',
      'opencode',
      'pi',
    ]);
    expect(resolveNativeThreadHandoffTargets({
      ...eligibleThread,
      sessionStatus: 'running',
    })).toEqual([]);
  });

  it('owns the complete canonical handoff command and imported activity flow', () => {
    const source = readFileSync(new URL('./threadHandoff.lynx.ts', import.meta.url), 'utf8');
    expect(source).toContain('fetchFreshServerConfig()');
    expect(source).toContain('resolveProviderSendAvailability({');
    expect(source).toContain('resolveThreadHandoffModelSelection({');
    expect(source).toContain('buildThreadHandoffImportedMessages(');
    expect(source).toContain('buildThreadHandoffImportedActivities(');
    expect(source).toContain("type: 'thread.handoff.create'");
    expect(source).toContain("type: 'thread.activity.append'");
  });
});
