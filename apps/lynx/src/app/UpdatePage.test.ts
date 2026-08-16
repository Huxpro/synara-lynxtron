import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { runUpdateCheckState } from './UpdatePage';

describe('runUpdateCheckState', () => {
  it('projects a successful update result', async () => {
    const value = {
      currentVersion: '1.0.0',
      latestVersion: '1.1.0',
      updateAvailable: true,
      releaseName: 'v1.1.0',
      publishedAt: null,
      downloadPage: 'https://example.com',
      error: null,
    };

    await expect(runUpdateCheckState(async () => value)).resolves.toEqual({
      kind: 'result',
      value,
    });
  });

  it('projects rejection into a retryable error state', async () => {
    await expect(
      runUpdateCheckState(async () => {
        throw new Error('network offline');
      })
    ).resolves.toEqual({
      kind: 'error',
      message: 'network offline',
    });
  });

  it('contains download-page rejection in the visible page state', () => {
    const source = readFileSync(
      new URL('./UpdatePage.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('void openDownloadPage().catch((error) => {');
    expect(source).toContain('Could not open download page · {downloadError}');
    expect(source).toContain('Could not check releases · {state.message}');
  });

  it('stacks full-width actions in compact viewports', () => {
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(styles).toMatch(
      /\.UpdateActions\s*\{[^}]*flex-direction:\s*row;[^}]*gap:\s*9px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.UpdateActions\s*\{[^}]*width:\s*100%;[^}]*flex-direction:\s*column;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.UpdateActions \.LxButton\s*\{[^}]*width:\s*100%;/s
    );
  });
});
