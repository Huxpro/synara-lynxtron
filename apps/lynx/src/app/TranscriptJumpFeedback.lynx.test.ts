import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Transcript jump feedback', () => {
  it('uses Web semantic surfaces without dimming the whole control', () => {
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(styles).toMatch(
      /\.TranscriptJump\.ui-hover\s*\{[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s
    );
    expect(styles).toMatch(
      /\.TranscriptJump\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-button-secondary\);/s
    );
    expect(styles).not.toMatch(
      /\.TranscriptJump\.ui-(?:hover|pressed)\s*\{[^}]*opacity:/s
    );
  });
});
