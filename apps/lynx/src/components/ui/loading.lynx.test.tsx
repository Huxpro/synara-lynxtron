import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { render } from '@lynx-js/react/testing-library';

import { Skeleton } from './skeleton.lynx';
import { Spinner } from './spinner.lynx';

describe('loading primitives', () => {
  it('keeps skeletons presentation-only', () => {
    render(<Skeleton className="ExampleSkeleton" />);
    const skeleton = elementTree.root?.querySelector('.LxSkeleton');
    expect(skeleton?.getAttribute('class')).toContain('ExampleSkeleton');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton?.querySelector('.LxSkeletonShimmer')).toBeTruthy();

    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxSkeleton\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;[^}]*background-color:\s*var\(--muted\);/s
    );
    expect(styles).not.toMatch(/\.LxSkeleton\s*\{[^}]*opacity:/s);
    expect(styles).toContain('animation: LxSkeletonSweep 2s -1s linear infinite;');
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.LxSkeletonShimmer\s*\{\s*display:\s*none;/
    );
  });

  it('announces spinner status', () => {
    render(<Spinner size={10} />);
    const spinner = elementTree.root?.querySelector('.LxSpinner');
    expect(spinner?.getAttribute('accessibility-label')).toBe('Loading');
    expect(spinner?.getAttribute('accessibility-trait')).toBe('updating');

    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toContain('animation: LxSpinnerSpin 1s linear infinite;');
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.LxSpinner\s*\{\s*animation:\s*none;/
    );
  });
});
