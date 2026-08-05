import { describe, expect, it } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  SettingsGeneralBooleanControlElement,
  SettingsGeneralSectionElement,
  SettingsGeneralSelectControlElement,
} from './SettingsGeneralCompositionElements.lynx';

describe('Settings General fidelity', () => {
  it('preserves deep-link targets and provider option identity', () => {
    const styles = readFileSync(
      new URL('./settings-general-composition-elements.css', import.meta.url),
      'utf8'
    );

    render(
      <>
        <SettingsGeneralSectionElement
          title="Environment panel"
          targetId="environment-panel"
        >
          <text>Rows</text>
        </SettingsGeneralSectionElement>
        <SettingsGeneralSelectControlElement
          settingKey="defaultProvider"
          value="codex"
          ariaLabel="Default provider"
          options={[
            { value: 'codex', label: 'Codex' },
            { value: 'droid', label: 'Droid' },
          ]}
          onChange={() => {}}
        />
      </>
    );

    expect(
      elementTree.root?.querySelector('#environment-panel')?.textContent
    ).toContain('Environment panel');
    expect(
      elementTree.root?.querySelector('.OpenAIProviderIcon')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.SharedSettingsGeneralProviderLabel')
        ?.textContent
    ).toBe('Codex');

    const trigger = elementTree.root?.querySelector('.LxMenuTrigger');
    if (!trigger) throw new Error('expected provider select trigger');
    expect(trigger.getAttribute('aria-label')).toBe('Default provider');
    fireEvent.tap(trigger);

    const options =
      elementTree.root?.querySelectorAll(
        '.SharedSettingsGeneralProviderOption'
      ) ?? [];
    expect(options).toHaveLength(3);
    expect(
      elementTree.root?.querySelector(
        '.SharedSettingsGeneralProviderFallbackText'
      )?.textContent
    ).toBe('D');
    expect(styles).toMatch(
      /\.SharedSettingsGeneralProviderOption\s*\{[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsGeneralProviderOption \.OpenAIProviderIcon,\s*\.SharedSettingsGeneralProviderFallback\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsGeneralProviderLabel\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
  });

  it('keeps unavailable switches visible but inert', () => {
    let changes = 0;
    render(
      <SettingsGeneralBooleanControlElement
        checked
        disabled
        ariaLabel="Desktop activity notifications"
        onChange={() => {
          changes += 1;
        }}
      />
    );

    const control = elementTree.root?.querySelector(
      '.SharedSettingsGeneralSwitch--disabled'
    );
    if (!control) throw new Error('expected disabled settings switch');
    expect(control.getAttribute('focusable')).toBe('false');
    expect(control.getAttribute('aria-disabled')).toBe('true');
    expect(control.getAttribute('aria-checked')).toBe('true');
    fireEvent.tap(control);
    expect(changes).toBe(0);
  });
});
