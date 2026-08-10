import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

const switchStyles = [
  new URL('./settings-general-composition-elements.css', import.meta.url),
  new URL('./settings-appearance-composition-elements.css', import.meta.url),
  new URL('./settings-provider-picker-composition-elements.css', import.meta.url),
  new URL('./theme-pack-editor-composition-elements.css', import.meta.url),
  new URL('../app/kanban-new-task-dialog.css', import.meta.url),
];

describe('custom switch pressed feedback', () => {
  it('keeps the track stable instead of dimming the whole control', () => {
    for (const styleUrl of switchStyles) {
      const styles = readFileSync(styleUrl, 'utf8');
      expect(styles).not.toMatch(
        /Switch\.ui-pressed\s*\{[^}]*opacity:/s
      );
    }
  });
});
