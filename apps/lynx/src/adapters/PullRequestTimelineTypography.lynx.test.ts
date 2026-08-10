import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request timeline typography', () => {
  it('uses the shared PR body and meta roles instead of compressed fixed sizes', () => {
    const styles = readFileSync(
      new URL('./pull-request-timeline-composition-elements.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.SharedPrTimelineTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg\);[^}]*line-height:\s*19\.5px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrTimelineMeta,\s*\.SharedPrTimelineBody\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
    );
    expect(styles).not.toMatch(
      /\.SharedPrTimeline(?:Title|Meta|Body)\s*\{[^}]*font-size:\s*10px;/s
    );
  });
});
