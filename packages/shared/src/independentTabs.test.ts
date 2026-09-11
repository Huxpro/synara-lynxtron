import { describe, expect, it } from 'vitest';

import { resolveIndependentTabRowPresentation } from './independentTabs';

describe('independent tab row presentation', () => {
  it('keeps actions visible in the expanded row', () => {
    expect(resolveIndependentTabRowPresentation(false)).toEqual({
      mode: 'expanded',
      showActions: true,
      toggleLabel: 'Collapse to tabs only',
    });
  });

  it('keeps the tabs lane while replacing actions with one restore control', () => {
    expect(resolveIndependentTabRowPresentation(true)).toEqual({
      mode: 'tabs-only',
      showActions: false,
      toggleLabel: 'Restore tab actions',
    });
  });
});
