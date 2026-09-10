import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { Skeleton } from './skeleton.lynx';
import { Spinner } from './spinner.lynx';

describe('loading primitives', () => {
  it('keeps skeletons presentation-only', () => {
    render(<Skeleton className="ExampleSkeleton" />);
    const skeleton = elementTree.root?.querySelector('.LxSkeleton');
    expect(skeleton?.getAttribute('class')).toContain('ExampleSkeleton');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
  });

  it('announces spinner status', () => {
    render(<Spinner size={10} />);
    const spinner = elementTree.root?.querySelector('.LxSpinner');
    expect(spinner?.getAttribute('accessibility-label')).toBe('Loading');
    expect(spinner?.getAttribute('accessibility-trait')).toBe('updating');
  });
});
