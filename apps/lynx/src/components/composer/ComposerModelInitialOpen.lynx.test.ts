import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native Composer model initial-open state', () => {
  it('mounts the landing popup with already-refreshed provider statuses', () => {
    const controlSource = readFileSync(
      new URL('./ComposerModelControl.lynx.tsx', import.meta.url),
      'utf8'
    );
    const composerSource = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const landingSource = readFileSync(
      new URL('./LandingComposer.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(controlSource).toContain(
      'initData.initialComposerModelMenuOpen === true'
    );
    expect(composerSource).toContain(
      'providers={providerStatuses ?? serverConfig?.providers ?? []}'
    );
    expect(landingSource).toContain(
      'providerStatuses={data.serverConfig.providers}'
    );
  });
});
