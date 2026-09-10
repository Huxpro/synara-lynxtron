import { readFileSync } from 'node:fs';

import { describe, expect, it } from '@rstest/core';

describe('Lynx transport status presentation', () => {
  it('keeps offline recovery compact and visually neutral', () => {
    const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    const source = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(source).toContain(": 'Offline'");
    expect(source).toContain('aria-label="Retry connecting to Synara"');
    expect(source).toContain('!componentsLabRoute &&');
    expect(appSource).toContain('transportState={transportState}');
    expect(appSource).toContain('onRetryTransport={() => void retryActiveSynaraQueries(queryClient)}');
    expect(styles).toMatch(
      /\.TransportStatusNotice\s*\{[^}]*min-height:\s*28px;[^}]*border:\s*1px solid var\(--color-border\);[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.TransportStatusNotice--offline\s*\{[^}]*border-color:\s*var\(--color-border\);/s
    );
    expect(styles).toMatch(
      /\.TransportStatusNotice--offline \.TransportStatusNoticeText\s*\{[^}]*color:\s*var\(--color-text-status-neutral\);/s
    );
    expect(styles).toMatch(
      /\.TransportStatusRetry\s*\{[^}]*color:\s*var\(--foreground\);[^}]*opacity:\s*0\.82;/s
    );
    expect(styles).not.toMatch(
      /\.TransportStatusNotice--offline[^}]*var\(--color-text-status-error\)/s
    );
  });
});
