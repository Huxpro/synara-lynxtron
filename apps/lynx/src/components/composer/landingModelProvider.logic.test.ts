import { describe, expect, it } from '@rstest/core';

import { resolveLandingModelProvider } from './landingModelProvider.logic';

describe('resolveLandingModelProvider', () => {
  it('keeps a valid init-data provider', () => {
    expect(resolveLandingModelProvider('claudeAgent', 'codex')).toBe(
      'claudeAgent'
    );
  });

  it('falls back to the persisted default for missing or invalid init data', () => {
    expect(resolveLandingModelProvider(null, 'codex')).toBe('codex');
    expect(resolveLandingModelProvider('unknown-provider', 'opencode')).toBe(
      'opencode'
    );
  });
});
