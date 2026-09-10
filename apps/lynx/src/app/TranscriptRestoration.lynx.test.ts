import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native transcript route-entry restoration', () => {
  it('resets inherited scroll intent to the canonical tail on thread changes', () => {
    const source = readFileSync(new URL('./Transcript.tsx', import.meta.url), 'utf8');
    const threadReset = source.match(
      /useEffect\(\(\) => \{[\s\S]*?carrying pinned=false into the next[\s\S]*?pinnedRef\.current = true;[\s\S]*?setPinned\(true\);[\s\S]*?scrollToBottom\(\);[\s\S]*?\}, \[threadId\]\);/
    );

    expect(threadReset).not.toBeNull();
    expect(source).toContain('function scrollToMessage(messageId: string)');
    expect(source).toContain('pinnedRef.current = false');
  });
});
