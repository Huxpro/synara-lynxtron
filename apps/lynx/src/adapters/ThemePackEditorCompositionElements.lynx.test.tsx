import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  ThemePackBooleanControlElement,
  ThemePackCodeThemeControlElement,
  ThemePackContrastControlElement,
  ThemePackImportActionElement,
  ThemePackTitleElement,
  mixThemeColors,
  readableThemeColor,
  resolveThemePackContrastKeyValue,
  resolveThemePackContrastPointerValue,
} from './ThemePackEditorCompositionElements.lynx';

function switchElement(): Element {
  const element = elementTree.root?.querySelector('.SharedThemePackSwitch');
  if (!element) throw new Error('expected ThemePack boolean control');
  return element;
}

const focusSelect = rs.fn();
const focusInvoke = rs.fn();
const focusExec = rs.fn();

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
    createSelectorQuery() {
      return {
        select(selector: string) {
          focusSelect(selector);
          return this;
        },
        invoke(payload: unknown) {
          focusInvoke(payload);
          return this;
        },
        exec() {
          focusExec();
        },
      };
    },
  });
  focusSelect.mockClear();
  focusInvoke.mockClear();
  focusExec.mockClear();
});

describe('ThemePack boolean interaction contract', () => {
  it('preserves the Web h3 title as a Native heading', () => {
    render(<ThemePackTitleElement title="Light theme" />);

    const title = elementTree.root?.querySelector('.SharedThemePackTitle');
    expect(title?.getAttribute('accessibility-element')).toBe('true');
    expect(title?.getAttribute('accessibility-heading')).toBe('true');
    expect(title?.getAttribute('accessibility-traits')).toBe('header');
  });

  it('matches the Web two-row header and row typography', () => {
    const source = readFileSync(
      new URL('./ThemePackEditorCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./theme-pack-editor-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedThemePackRoot\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackHeader\s*\{[^}]*height:\s*84px;[^}]*flex-wrap:\s*wrap;[^}]*padding:\s*12px 16px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackHeader\s*>\s*\.LxMenuRoot\s*\{[^}]*width:\s*100%;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackCodeSelect\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackTitle\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*500;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackContext\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackRowLabel\s*\{[^}]*color:\s*var\(--settings-row-label-strong\);[^}]*font-size:\s*14px;[^}]*font-weight:\s*400;[^}]*line-height:\s*20px;/s
    );
    expect(source).toContain('className="SharedThemePackResetAction"');
    expect(source).toContain('className="SharedThemePackHeaderAction"');
    expect(styles).toMatch(
      /\.SharedThemePackResetAction\s*\{[^}]*min-height:\s*20px;[^}]*padding:\s*2px 6px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackResetAction \.LxButton__text\s*\{[^}]*font-size:\s*11px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackHeaderAction\s*\{[^}]*min-height:\s*24px;[^}]*padding:\s*4px 8px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackHeaderAction \.LxButton__text\s*\{[^}]*font-size:\s*12px;/s
    );
    expect(source).toContain('className="SharedThemePackImportDialog"');
    expect(source).toContain('showCloseButton={false}');
    expect(source).toContain('<DialogTrigger');
    expect(source).toContain(
      'className="SharedThemePackImportTriggerHost"'
    );
    expect(source).toContain(
      'viewportClassName="SharedThemePackImportViewport"'
    );
    expect(source).toContain('className="SharedThemePackImportClose"');
    expect(source).toContain('ariaLabel="Close theme import"');
    expect(source).toContain('className="SharedThemePackImportCloseIcon"');
    expect(source).toContain('color="var(--muted-foreground)"');
    expect(source).toContain('style={{ opacity: 0.8 }}');
    expect(source).toContain(
      'className="SharedThemePackImportScroll" scroll-y'
    );
    expect(source).toContain('accessibility-label="Theme share string"');
    expect(source).not.toContain('Import clipboard');
    expect(styles).toMatch(
      /\.LxDialogPopup\.SharedThemePackImportDialog\s*\{[^}]*width:\s*448px;[^}]*max-width:\s*calc\(100vw - 32px\);[^}]*padding:\s*0;[^}]*border-color:\s*var\(--color-border-light\);[^}]*border-radius:\s*22px;[^}]*overflow:\s*visible;[^}]*box-shadow:\s*0 16px 50px -12px rgba\(0,\s*0,\s*0,\s*0\.34\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.LxDialogPopup\.SharedThemePackImportDialog\s*\{[^}]*box-shadow:\s*0 16px 50px -12px rgba\(0,\s*0,\s*0,\s*0\.7\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportClose\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*1;[^}]*right:\s*8px;[^}]*top:\s*8px;[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*padding:\s*0;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportCloseIcon\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportScroll\s*\{[^}]*width:\s*100%;[^}]*max-height:\s*100%;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportHeader,\s*\.SharedThemePackImportPanel,\s*\.SharedThemePackImportFooter\s*\{[^}]*flex-shrink:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportTitle\s*\{[^}]*display:\s*block;[^}]*height:\s*22\.5px;[^}]*color:\s*var\(--foreground\);[^}]*font-size:\s*18px;[^}]*font-weight:\s*600;[^}]*line-height:\s*22\.5px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportDescription\s*\{[^}]*display:\s*block;[^}]*min-height:\s*32px;[^}]*color:\s*var\(--muted-foreground\);[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(source).toContain(
      '<text className="SharedThemePackImportCode">'
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportCode\s*\{[^}]*padding:\s*2px 4px;[^}]*border-radius:\s*4px;[^}]*background-color:\s*var\(--muted\);[^}]*font-family:\s*var\(--font-chat-code-family\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportTextareaControl\s*\{[^}]*width:\s*100%;[^}]*height:\s*96px;[^}]*border:\s*1px solid var\(--border\);[^}]*border-radius:\s*10px;[^}]*background-color:\s*transparent;[^}]*overflow:\s*hidden;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportTextarea\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*height:\s*94px;[^}]*margin:\s*0;[^}]*padding:\s*8px 10px;[^}]*border-width:\s*0;[^}]*border-radius:\s*10px;[^}]*font-family:\s*var\(--font-ui-family\);[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(source).toContain(
      'placeholder-color="var(--theme-pack-import-placeholder)"'
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-light \.SharedThemePackImportTextarea\s*\{[^}]*--theme-pack-import-placeholder:\s*rgba\(13,\s*13,\s*13,\s*0\.5\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.SharedThemePackImportTextarea\s*\{[^}]*--theme-pack-import-placeholder:\s*rgba\(252,\s*252,\s*252,\s*0\.5\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-light \.SharedThemePackImportTextareaControl--focused\s*\{[^}]*border-color:\s*rgba\(13,\s*13,\s*13,\s*0\.3\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.SharedThemePackImportTextareaControl--focused\s*\{[^}]*border-color:\s*rgba\(252,\s*252,\s*252,\s*0\.3\);/s
    );
    expect(styles).not.toMatch(
      /\.SharedThemePackImportTextarea(?:Control--focused|:focus)\s*\{[^}]*var\(--ring\)/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportCancel\s*\{[^}]*width:\s*59\.65625px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportSubmit\s*\{[^}]*width:\s*58\.265625px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportCancel \.LxButton__text,\s*\.SharedThemePackImportSubmit \.LxButton__text\s*\{[^}]*font-weight:\s*400;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportSubmit\.ui-disabled\s*\{[^}]*opacity:\s*0\.64;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackImportError\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedThemePackImportViewport\s*\{[^}]*align-items:\s*flex-end;[^}]*padding-top:\s*48px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.LxDialogPopup\.SharedThemePackImportDialog\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*max-height:\s*calc\(100vh - 48px\);[^}]*border-right-width:\s*0;[^}]*border-bottom-width:\s*0;[^}]*border-left-width:\s*0;[^}]*border-radius:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedThemePackImportFooter\s*\{[^}]*height:\s*96px;[^}]*flex-direction:\s*column-reverse;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedThemePackImportViewport\s*\{[^}]*align-items:\s*center;[^}]*padding-top:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.LxDialogPopup\.SharedThemePackImportDialog\s*\{[^}]*width:\s*448px;[^}]*max-width:\s*calc\(100vw - 32px\);[^}]*max-height:\s*80%;[^}]*border-width:\s*1px;[^}]*border-radius:\s*22px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedThemePackImportFooter\s*\{[^}]*height:\s*52px;[^}]*flex-direction:\s*row;/s
    );
    expect(source).toContain("import { SettingsResetIcon } from './SettingsResetIcon.lynx';");
    expect(source).toContain('<SettingsResetIcon />');
    expect(source).not.toContain('↶');
    expect(styles).toMatch(
      /\.SharedThemePackSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;[^}]*padding:\s*1px;[^}]*border:\s*1px solid var\(--settings-switch-border\);[^}]*background-color:\s*var\(--settings-switch-off\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackSwitchThumb\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*background-color:\s*#ffffff;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackSwitch--on \.SharedThemePackSwitchThumb\s*\{[^}]*transform:\s*translateX\(12px\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackCodeSwatch\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackCodeLabel\s*\{[^}]*font-size:\s*13px;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackRowControl\s*\{[^}]*flex-shrink:\s*0;[^}]*justify-content:\s*flex-end;/s
    );
    expect(styles).not.toMatch(
      /\.SharedThemePackRowControl\s*\{[^}]*width:\s*280px;/s
    );
    expect(source).toContain('className={`SharedThemePackFontInput');
    expect(source).toContain("props.mono ? ' SharedThemePackFontInput--mono' : ''");
    expect(source).toContain('accessibility-label={props.ariaLabel}');
    expect(styles).toMatch(
      /\.SharedThemePackFontInput\s*\{[^}]*width:\s*224px;[^}]*height:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackFontInput \.LxInput\s*\{[^}]*font-family:\s*var\(--font-ui-family\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackFontInput--mono \.LxInput\s*\{[^}]*font-family:\s*var\(--font-chat-code-family\);/s
    );
    expect(source).toContain('className="SharedThemePackColorControl"');
    expect(source).toContain('className="SharedThemePackColorIndicator"');
    expect(source).toContain('className="SharedThemePackColorInput"');
    expect(source).toContain(
      'accessibility-label={`${props.ariaLabel} hex value`}'
    );
    expect(styles).toMatch(
      /\.SharedThemePackColorControl\s*\{[^}]*width:\s*176px;[^}]*height:\s*32px;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackColorIndicator\s*\{[^}]*left:\s*8px;[^}]*top:\s*5px;[^}]*width:\s*20px;[^}]*height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackColorInput \.LxInput\s*\{[^}]*font-family:\s*var\(--font-chat-code-family\);[^}]*font-size:\s*12px;/s
    );
    expect(source).toContain('value={props.color.toUpperCase()}');
    expect(readableThemeColor('#ffffff')).toBe('#1a1c1f');
    expect(readableThemeColor('#111111')).toBe('#ffffff');
    expect(readableThemeColor('#ffffff', 0.32)).toBe(
      'rgba(26, 28, 31, 0.32)'
    );
  });

  it('imports through an editable confirmation dialog', async () => {
    const onImport = rs.fn();
    render(
      <ThemePackImportActionElement variant="light" onImport={onImport} />
    );

    fireEvent.tap(
      elementTree.root?.querySelector('.SharedThemePackImportTriggerHost')!
    );
    const textarea = await waitFor(() => {
      const current = elementTree.root?.querySelector(
        '.SharedThemePackImportTextarea'
      );
      expect(current).not.toBeNull();
      return current!;
    });
    const submit = elementTree.root?.querySelector(
      '.SharedThemePackImportSubmit'
    );
    fireEvent.tap(submit!);
    expect(onImport).not.toHaveBeenCalled();

    textarea.dispatchEvent(
      new CustomEvent('bindEvent:focus', {
        bubbles: true,
        detail: { value: '' },
      })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector(
          '.SharedThemePackImportTextareaControl--focused'
        )
      ).not.toBeNull()
    );
    textarea.dispatchEvent(
      new CustomEvent('bindEvent:blur', {
        bubbles: true,
        detail: { value: '' },
      })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector(
          '.SharedThemePackImportTextareaControl--focused'
        )
      ).toBeNull()
    );

    textarea.dispatchEvent(
      new CustomEvent('bindEvent:input', {
        bubbles: true,
        detail: { value: 'codex-theme-v1:valid' },
      })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.SharedThemePackImportTextarea')
          ?.getAttribute('default-value')
      ).toBe('codex-theme-v1:valid')
    );
    fireEvent.tap(
      elementTree.root?.querySelector('.SharedThemePackImportSubmit')!
    );

    expect(onImport).toHaveBeenCalledWith('codex-theme-v1:valid');
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.SharedThemePackImportDialog')
      ).toBeNull()
    );
    await waitFor(() => expect(focusSelect).toHaveBeenCalledTimes(1));
    expect(focusSelect.mock.calls[0]?.[0]).toMatch(
      /^\.LxDialogTrigger--\d+$/
    );
    expect(focusInvoke).toHaveBeenCalledWith({
      method: 'setFocus',
      params: { focus: true },
    });
  });

  it('keeps invalid imports editable and displays the parser error', async () => {
    const onImport = rs.fn(() => {
      throw new Error('Embedded theme variant must match dark.');
    });
    render(
      <ThemePackImportActionElement variant="dark" onImport={onImport} />
    );

    fireEvent.tap(
      elementTree.root?.querySelector('.SharedThemePackImportTriggerHost')!
    );
    const textarea = await waitFor(() =>
      elementTree.root?.querySelector('.SharedThemePackImportTextarea')
    );
    textarea!.dispatchEvent(
      new CustomEvent('bindEvent:input', {
        bubbles: true,
        detail: { value: 'codex-theme-v1:wrong' },
      })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.SharedThemePackImportTextarea')
          ?.getAttribute('default-value')
      ).toBe('codex-theme-v1:wrong')
    );
    fireEvent.tap(
      elementTree.root?.querySelector('.SharedThemePackImportSubmit')!
    );

    expect(onImport).toHaveBeenCalledWith('codex-theme-v1:wrong');
    await waitFor(() => {
      expect(
        elementTree.root?.querySelector('.SharedThemePackImportDialog')
      ).not.toBeNull();
      expect(
        elementTree.root?.querySelector('.SharedThemePackImportError')
          ?.textContent
      ).toBe('Embedded theme variant must match dark.');
    });
  });

  it('restores trigger focus after Cancel, Close, and Escape', async () => {
    const { rerender } = render(
      <ThemePackImportActionElement variant="light" onImport={() => {}} />
    );
    const open = async () => {
      fireEvent.tap(
        elementTree.root?.querySelector('.SharedThemePackImportTriggerHost')!
      );
      await waitFor(() =>
        expect(
          elementTree.root?.querySelector('.SharedThemePackImportDialog')
        ).not.toBeNull()
      );
    };
    const expectRestored = async () => {
      await waitFor(() => expect(focusSelect).toHaveBeenCalledTimes(1));
      expect(focusSelect.mock.calls[0]?.[0]).toMatch(
        /^\.LxDialogTrigger--\d+$/
      );
      expect(focusInvoke).toHaveBeenCalledWith({
        method: 'setFocus',
        params: { focus: true },
      });
      focusSelect.mockClear();
      focusInvoke.mockClear();
      focusExec.mockClear();
    };

    await open();
    fireEvent.tap(
      elementTree.root?.querySelector('.SharedThemePackImportCancel')!
    );
    await expectRestored();

    await open();
    fireEvent.tap(
      elementTree.root?.querySelector('.SharedThemePackImportClose')!
    );
    await expectRestored();

    await open();
    fireEvent.keydown(
      elementTree.root?.querySelector('.SharedThemePackImportDialog')!,
      { key: 'Escape' }
    );
    await expectRestored();

    rerender(
      <ThemePackImportActionElement variant="light" onImport={() => {}} />
    );
  });

  it('renders palette previews in the code-theme trigger and options', () => {
    render(
      <ThemePackCodeThemeControlElement
        value="linear"
        label="Linear"
        ariaLabel="Light theme code theme"
        theme={{
          accent: '#5e6ad2',
          surface: '#ffffff',
          ink: '#1a1c1f',
          contrast: 50,
          fonts: { ui: null, code: null },
          opaqueWindows: false,
        }}
        options={[
          {
            id: 'linear',
            label: 'Linear',
            previewTheme: {
              accent: '#5e6ad2',
              surface: '#ffffff',
              ink: '#1a1c1f',
              contrast: 50,
              fonts: { ui: null, code: null },
              opaqueWindows: false,
            },
          },
        ]}
        onChange={() => {}}
      />
    );

    const trigger = elementTree.root?.querySelector('.LxMenuTrigger');
    if (!trigger) throw new Error('expected code theme trigger');
    expect(trigger.getAttribute('aria-label')).toBe('Light theme code theme');
    expect(
      elementTree.root?.querySelector('.SharedThemePackCodeSwatchText')?.textContent
    ).toBe('Aa');
    expect(
      elementTree.root?.querySelector('.SharedThemePackCodeLabel')?.textContent
    ).toBe('Linear');
    expect(elementTree.root?.querySelector('.SharedThemePackCodeChevron')).not.toBeNull();

    fireEvent.tap(trigger);
    const menuItem = elementTree.root?.querySelector('.SharedThemePackCodeMenuItem');
    if (!menuItem) throw new Error('expected code theme option');
    expect(menuItem.textContent).toContain('Aa');
    expect(menuItem.textContent).toContain('Linear');
    expect(mixThemeColors('#ffffff', '#1a1c1f', 0.16)).toBe(
      'rgb(218, 219, 219)'
    );
  });

  it('publishes checked state and exact pointer/key/tap activation', () => {
    const onChange = rs.fn();
    render(
      <ThemePackBooleanControlElement
        checked={false}
        ariaLabel="Light theme translucent sidebar"
        onChange={onChange}
      />
    );

    const control = switchElement();
    expect(control.getAttribute('focusable')).toBe('true');
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(control.getAttribute('accessibility-role')).toBe('switch');
    expect(control.getAttribute('accessibility-state')).toBe(
      '{"checked":false}'
    );
    expect(control.getAttribute('accessibility-label')).toBe(
      'Light theme translucent sidebar'
    );

    fireEvent(
      control,
      new Event('bindEvent:mouseenter', { bubbles: true })
    );
    expect(control.getAttribute('class')).toContain('ui-hover');
    fireEvent.mousedown(control);
    expect(control.getAttribute('class')).toContain('ui-pressed');
    fireEvent.mouseup(control);
    expect(control.getAttribute('class')).not.toContain('ui-pressed');
    fireEvent.focus(control);
    expect(control.getAttribute('class')).toContain('ui-focus');

    fireEvent.keydown(control, { key: 'Enter' });
    fireEvent.tap(control);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it('maps contrast pointer and keyboard input to bounded values', () => {
    expect(
      resolveThemePackContrastPointerValue(
        { clientX: 138 },
        { left: 50, width: 176 }
      )
    ).toBe(50);
    expect(
      resolveThemePackContrastPointerValue(
        { touches: [{ pageX: 300 }] },
        { left: 50, width: 176 }
      )
    ).toBe(100);
    expect(
      resolveThemePackContrastPointerValue(
        { pageX: 0 },
        { left: 50, width: 176 }
      )
    ).toBe(0);
    expect(resolveThemePackContrastKeyValue(50, 'ArrowRight')).toBe(51);
    expect(resolveThemePackContrastKeyValue(0, 'ArrowLeft')).toBe(0);
    expect(resolveThemePackContrastKeyValue(50, 'Home')).toBe(0);
    expect(resolveThemePackContrastKeyValue(50, 'End')).toBe(100);
    expect(resolveThemePackContrastKeyValue(50, 'Enter')).toBeNull();
  });

  it('publishes adjustable contrast semantics and keyboard changes', () => {
    const onChange = rs.fn();
    render(
      <ThemePackContrastControlElement
        value={50}
        ariaLabel="Light theme contrast"
        onChange={onChange}
      />
    );

    const track = elementTree.root?.querySelector(
      '.SharedThemePackContrastTrack'
    );
    if (!track) throw new Error('expected contrast track');
    expect(track.getAttribute('focusable')).toBe('true');
    expect(track.getAttribute('accessibility-traits')).toBe('adjustable');
    expect(track.getAttribute('aria-valuenow')).toBe('50');
    expect(
      elementTree.root?.querySelector('.SharedThemePackContrastValue')
        ?.textContent
    ).toBe('50');

    fireEvent.keydown(track, { key: 'ArrowRight' });
    fireEvent.keydown(track, { key: 'Home' });
    expect(onChange).toHaveBeenNthCalledWith(1, 51);
    expect(onChange).toHaveBeenNthCalledWith(2, 0);
  });
});
