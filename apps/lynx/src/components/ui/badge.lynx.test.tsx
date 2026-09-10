import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { Badge } from './badge.lynx';

describe('Badge', () => {
  it('renders explicit size, variant, and shape classes', () => {
    render(<Badge className="ProductBadge" shape="capsule" size="sm" variant="outline">PDF</Badge>);
    const badge = elementTree.root?.querySelector('.LxBadge');
    expect(badge?.getAttribute('class')).toContain('LxBadge--sm');
    expect(badge?.getAttribute('class')).toContain('LxBadge--outline');
    expect(badge?.getAttribute('class')).toContain('LxBadge--capsule');
    expect(badge?.textContent).toBe('PDF');
  });
});
