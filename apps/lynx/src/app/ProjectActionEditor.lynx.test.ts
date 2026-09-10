import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('ProjectActionEditor', () => {
  it('keeps the Electron action fields and validation in one reusable editor', () => {
    const source = readFileSync(
      new URL('./ProjectActionEditor.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('Add Action');
    expect(source).toContain('Actions are project-scoped commands you can run from the top bar or keybindings.');
    expect(source).toContain('aria-label="Action name"');
    expect(source).toContain('aria-label="Action command"');
    expect(source).toContain('aria-label="Action keybinding"');
    expect(source).toContain('projectActionKeybindingFromEvent(event)');
    expect(source).toContain('Run automatically on worktree creation');
    expect(source).toContain("setValidationError('Name is required.')");
    expect(source).toContain("setValidationError('Command is required.')");
    expect(source).toContain('Save action');
    expect(source).toContain('Cancel');
    expect(source).toContain("editing ? 'Save changes' : 'Save action'");
    expect(source).toContain("props.busy ? 'Saving…'");
    expect(source).toContain('disabled={props.busy}');
    expect(source.match(/disabled=\{props\.busy\}/g)?.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain('props.onDelete');
    expect(source).toContain('SCRIPT_ICONS.map');
    expect(source).toContain('icon={entry.id}');
    expect(source).toContain('svgColors.iconSecondary');
    expect(source).not.toContain("colorizeLynxSvg(playSvg, 'var(--color-icon-secondary)')");
    expect(source).toContain('ProjectActionEditorIconPopup');
    expect(source).toContain('setIconPickerOpen(false)');
    expect(source).toContain('<DialogHeader className="ProjectActionEditorHeader">');
    expect(source).toContain('className="ProjectActionEditorCommandInput"');
    expect(source).toContain('multiline maxLines={5}');
    expect(source).toContain('maxLength={8000}');
  });
});
