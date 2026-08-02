import { describe, expect, it } from '@rstest/core';

import { resolveComposerModelPopupContent } from './composerModelOverlay.logic';

describe('Composer model popup content', () => {
  it('keeps the provider panel visible while a catalog query is pending', () => {
    expect(
      resolveComposerModelPopupContent({
        panel: 'providers',
        modelsLoading: true,
      })
    ).toBe('providers');
  });

  it('shows loading instead of stale model options after provider navigation', () => {
    expect(
      resolveComposerModelPopupContent({
        panel: 'models',
        modelsLoading: true,
      })
    ).toBe('loading');
  });

  it('shows model options when provider discovery settles', () => {
    expect(
      resolveComposerModelPopupContent({
        panel: 'models',
        modelsLoading: false,
      })
    ).toBe('models');
  });
});
