import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('chat surface header identity fidelity', () => {
  it('uses the Web title typography across Landing and Thread headers', () => {
    const styles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('../app/router.tsx', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedChatHeaderIdentityTitle\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;[^}]*font-weight:\s*400;/s
    );
    expect(routerSource.match(/<ChatSurfaceHeaderIdentity/g)).toHaveLength(2);
  });
});
