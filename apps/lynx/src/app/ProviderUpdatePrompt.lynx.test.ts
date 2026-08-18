import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { providerUpdatePromptCopy } from './ProviderUpdatePrompt.lynx';

describe('Lynx provider update prompt copy', () => {
  it('matches the expanded Web notification anatomy', () => {
    const source = readFileSync(
      new URL('./ProviderUpdatePrompt.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(source).toContain('<TriangleAlertIcon');
    expect(source).toContain('className="ProviderUpdatePromptContent"');
    expect(source).toContain('className="ProviderUpdatePromptActions"');
    expect(source).toContain('className="ProviderUpdatePromptDismiss"');
    expect(styles).toMatch(
      /\.ProviderUpdatePrompt\s*\{[^}]*width:\s*384px;[^}]*min-height:\s*122px;[^}]*border-radius:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptTitle\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*400;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptContent\s*\{[^}]*height:\s*96px;/s
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptCopy\s*\{[^}]*height:\s*62px;[^}]*gap:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptActions\s*\{[^}]*height:\s*24px;[^}]*margin-top:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.ProviderUpdatePromptAction \+ \.ProviderUpdatePromptAction\s*\{[^}]*margin-left:\s*6px;/s
    );
  });

  it('matches the Web single-provider prompt', () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: 'Claude',
        providerCount: 1,
        updateFailed: false,
      })
    ).toEqual({
      title: 'Claude update available',
      description: 'Claude has a newer version available.',
    });
  });

  it('matches the Web multi-provider prompt', () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: 'Claude',
        providerCount: 3,
        updateFailed: false,
      })
    ).toEqual({
      title: '3 provider updates available',
      description: 'Claude and 2 more providers have newer versions available.',
    });
  });

  it('matches the Web two-provider singular suffix', () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: 'Claude',
        providerCount: 2,
        updateFailed: false,
      })
    ).toEqual({
      title: '2 provider updates available',
      description: 'Claude and 1 more provider have newer versions available.',
    });
  });

  it('retains the prompt after a failed update-all request', () => {
    expect(
      providerUpdatePromptCopy({
        firstProviderName: 'Claude',
        providerCount: 3,
        updateFailed: true,
      })
    ).toEqual({
      title: '3 provider updates available',
      description:
        'One or more provider updates failed. Review provider tools for details.',
    });
  });
});
