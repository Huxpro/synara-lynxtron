import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings search input', () => {
  it('uses an uncontrolled native input to avoid per-keystroke ACK loss', () => {
    const source = readFileSync(
      new URL('./SettingsSidebarChromeCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('const inputRef = useRef<InputRef>(null)');
    expect(source).toContain('defaultValue={props.value}');
    expect(source).not.toContain('value={props.value}');
    expect(source).toContain("inputRef.current?.setValue('')");
    expect(source).toContain(
      'onChange={(event) => props.onValueChange?.(event.target.value)}'
    );
  });
});
