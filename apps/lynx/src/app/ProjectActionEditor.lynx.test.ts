import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('ProjectActionEditor', () => {
  it('keeps the Electron action fields and validation in one reusable editor', () => {
    const source = readFileSync(
      new URL('./ProjectActionEditor.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./project-action-editor.css', import.meta.url),
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
    expect(source).toContain(
      "props.role === 'trigger' ? svgColors.foreground80 : svgColors.foreground"
    );
    expect(source).toContain("props.role === 'trigger' ? 18 : 16");
    expect(source).toContain('<ScriptIcon icon={icon} role="trigger" />');
    expect(source).toContain('size="icon-lg"');
    expect(source).toContain(
      '<ScriptIcon icon={props.icon} role="option" />'
    );
    expect(source).not.toContain('svgColors.iconSecondary');
    expect(source).not.toContain("colorizeLynxSvg(playSvg, 'var(--color-icon-secondary)')");
    expect(source).toContain('ProjectActionEditorIconPopup');
    expect(source).toContain('setIconPickerOpen(false)');
    expect(source).toContain('<DialogHeader className="ProjectActionEditorHeader">');
    expect(source).toContain('className="ProjectActionEditorCommandInput"');
    expect(source).toMatch(
      /<Textarea[^>]*nativeInput[^>]*maxLines=\{5\}/s
    );
    expect(source).toContain('maxLength={8000}');
    expect(styles).toMatch(
      /\.ProjectActionEditorIconPopup\s*\{[^}]*top:\s*40px;[^}]*width:\s*266px;[^}]*padding:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.ProjectActionEditorIconOption\s*\{[^}]*width:\s*72px;[^}]*height:\s*56px;[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.ProjectActionEditorSwitch\s*\{[^}]*min-height:\s*38px;[^}]*padding:\s*8px 12px;[^}]*gap:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.ProjectActionEditorSwitchLabel\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.ProjectActionEditorSwitchTrack\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.ProjectActionEditorSwitchThumb\s*\{[^}]*left:\s*2px;[^}]*top:\s*2px;[^}]*width:\s*16px;[^}]*height:\s*16px;/s
    );
  });
});
