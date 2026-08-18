import { describe, expect, it } from '@rstest/core';

import { providerUpdatePromptCopy } from './ProviderUpdatePrompt.lynx';

describe('Lynx provider update prompt copy', () => {
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
