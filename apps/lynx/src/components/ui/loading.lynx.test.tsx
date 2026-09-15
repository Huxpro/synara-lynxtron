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
    render(<Spinner color="#123456" size={10} />);
    const spinner = elementTree.root?.querySelector('.LxSpinner');
    expect(spinner?.getAttribute('accessibility-label')).toBe('Loading');
    expect(spinner?.getAttribute('accessibility-trait')).toBe('updating');
    expect(spinner?.getAttribute('style')).toContain('border-top-color: rgb(18, 52, 86)');
    expect(spinner?.getAttribute('style')).toContain('border-bottom-color: rgb(18, 52, 86)');
    expect(spinner?.getAttribute('style')).toContain('border-left-color: rgb(18, 52, 86)');
    expect(spinner?.getAttribute('style')).not.toContain('border-right-color: rgb(18, 52, 86)');

    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxSpinner\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--foreground\);[^}]*border-right-color:\s*transparent;[^}]*border-bottom-color:\s*var\(--foreground\);[^}]*border-left-color:\s*var\(--foreground\);/s
    );
    expect(styles).toContain('animation: LxSpinnerSpin 1s linear infinite;');
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.LxSpinner\s*\{\s*animation:\s*none;/
    );
  });
});
