import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Thread sidebar bootstrap', () => {
  it('seeds the shared sidebar query before thread-specific fetches', () => {
    const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    const sidebarIndex = source.indexOf('fetchSidebarSnapshot()');
    const seedIndex = source.indexOf(
      "queryClient.setQueryData(['sidebar-snapshot'], snapshot)"
    );
    const threadIndex = source.indexOf('fetchThreadTranscriptRows(threadMatch[1])');

    expect(sidebarIndex).toBeGreaterThan(-1);
    expect(seedIndex).toBeGreaterThan(sidebarIndex);
    expect(threadIndex).toBeGreaterThan(seedIndex);
  });
});
