import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  ComposerExtrasFastLabelElement,
  ComposerExtrasImageItemElement,
  ComposerExtrasMenuTriggerElement,
  ComposerExtrasPlanLabelElement,
} from './ComposerExtrasMenuCompositionElements.lynx';

describe('native composer attachment menu item', () => {
  it('opens the host picker only when the capability is available', () => {
    const onPickAttachments = rs.fn();
    render(
      <ComposerExtrasImageItemElement
        available
        onAddPhotos={() => undefined}
        onPickAttachments={onPickAttachments}
      />
    );
    const item = elementTree.root?.querySelector('[role="menuitem"]');
    if (!item) throw new Error('expected attachment menu item');
    expect(item.textContent).toContain('Add files');
    fireEvent.tap(item);
    expect(onPickAttachments).toHaveBeenCalledTimes(1);
  });

  it('uses native SVG icons for trigger, attachment, Plan, and Fast anatomy', () => {
    render(
      <>
        <ComposerExtrasMenuTriggerElement />
        <ComposerExtrasImageItemElement
          available
          onAddPhotos={() => undefined}
          onPickAttachments={() => undefined}
        />
        <ComposerExtrasPlanLabelElement />
        <ComposerExtrasFastLabelElement />
      </>
    );

    expect(
      elementTree.root?.querySelector('.ComposerExtrasTriggerIconLynx')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelectorAll('.ComposerExtrasItemIconLynx')
    ).toHaveLength(3);
    expect(elementTree.root?.textContent).not.toContain('+');
  });

  it('matches the canonical trigger and menu row radii', () => {
    const composerStyles = readFileSync(
      new URL('../components/composer/composer.css', import.meta.url),
      'utf8'
    );
    const runtimeElementsSource = readFileSync(
      new URL(
        './ComposerRuntimeModeControlCompositionElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const primitiveStyles = readFileSync(
      new URL('../components/ui/primitives.css', import.meta.url),
      'utf8'
    );

    expect(composerStyles).toMatch(
      /\.ComposerExtrasTriggerHostLynx,\s*\.ComposerExtrasTriggerLynx\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerExtrasTriggerLynx\s*\{[^}]*padding:\s*5px;[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerExtrasItemLabelLynx > text\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerRuntimeTriggerLabelLynx\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;[^}]*font-weight:\s*400;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerRuntimeTriggerLynx\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*4px 10px;[^}]*border:\s*1px solid transparent;[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerRuntimeTriggerLynx--full-access\s*\{[^}]*color:\s*var\(--runtime-full-access-accent\);/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerRuntimeTriggerLynx--full-access\s*\.ComposerRuntimeTriggerPermissionGlyphLynx,\s*\.ComposerRuntimeTriggerLynx--full-access \.ComposerRuntimeTriggerLabelLynx\s*\{[^}]*color:\s*var\(--runtime-full-access-accent\);/s
    );
    expect(runtimeElementsSource).not.toContain('<Button');
    expect(runtimeElementsSource).not.toContain('render=');
    expect(runtimeElementsSource).toContain(
      'ComposerRuntimeTriggerPermissionGlyphLynx'
    );
    expect(runtimeElementsSource).toContain('ComposerRuntimeTriggerLabelLynx');
    expect(runtimeElementsSource).toContain(
      'ComposerRuntimeTriggerChevronLynx'
    );
    const inputElementsSource = readFileSync(
      new URL('./ComposerInputCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(inputElementsSource).toContain(
      "import sendArrowSvg from '@synara-central-icons/arrow-up.svg?raw';"
    );
    expect(inputElementsSource).toContain(
      'className="ComposerPrimaryActionSendIconLynx"'
    );
    expect(composerStyles).toMatch(
      /\.ComposerPrimaryActionLynx--disabled\s*\{[^}]*opacity:\s*0\.2;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerPrimaryActionSendIconLynx\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerVoiceButtonLynx\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;[^}]*padding:\s*5px;[^}]*border:\s*1px solid transparent;[^}]*border-radius:\s*8px;[^}]*opacity:\s*0\.48;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerVoiceGlyphLynx\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*flex-shrink:\s*0;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerFooterActionsLynx\s*\{[^}]*margin-left:\s*auto;[^}]*gap:\s*8px;/s
    );
    const composerSource = readFileSync(
      new URL('../components/composer/Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(composerSource).toContain(
      "import microphoneSvg from '@synara-central-icons/microphone.svg?raw';"
    );
    expect(composerSource).toContain('className="ComposerVoiceGlyphLynx"');
    expect(composerSource).toContain('aria-disabled="true"');
    expect(composerSource).not.toContain(
      'render={<MicIcon className="ComposerVoiceGlyphLynx" />}'
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem\s*\{[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerModelPopupLynx\.LxMenuPopup,\s*\.ComposerTraitsPopupLynx\.LxMenuPopup,\s*\.ComposerRuntimePopupLynx\.LxMenuPopup,\s*\.ComposerExtrasPopupLynx\.LxMenuPopup,\s*\.ComposerExtrasPopupLynx \.LxMenuSubPopup\s*\{[^}]*border-radius:\s*10\.4px;[^}]*box-shadow:\s*0 4px 18px -6px rgba\(13,\s*13,\s*13,\s*0\.07\);/s
    );
    expect(composerStyles).toMatch(
      /\.SliceRoot--theme-dark \.ComposerModelPopupLynx\.LxMenuPopup,\s*\.SliceRoot--theme-dark \.ComposerTraitsPopupLynx\.LxMenuPopup,\s*\.SliceRoot--theme-dark \.ComposerRuntimePopupLynx\.LxMenuPopup,\s*\.SliceRoot--theme-dark \.ComposerExtrasPopupLynx\.LxMenuPopup,\s*\.SliceRoot--theme-dark \.ComposerExtrasPopupLynx \.LxMenuSubPopup\s*\{[^}]*box-shadow:\s*0 6px 24px -10px rgba\(0,\s*0,\s*0,\s*0\.3\);/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerProviderOptionLynx\s*\{[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerProviderOptionLynx \.ComposerModelTriggerContentLynx\s*\{[^}]*width:\s*100%;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerProviderOptionLynx \.ComposerModelTriggerLabelLynx\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerModelTriggerLabelLynx\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitsTriggerLabelLynx\s*\{[^}]*line-height:\s*16\.5px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerProviderOptionLynx \.ComposerModelTriggerMetaLynx\s*\{[^}]*margin-left:\s*auto;[^}]*font-size:\s*11px;[^}]*line-height:\s*18px;[^}]*opacity:\s*0\.8;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerProviderOptionLynx \.ComposerModelTriggerChevronLynx\s*\{[^}]*margin-left:\s*auto;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerProviderOptionLynx--disabled \.ComposerModelTriggerChevronLynx\s*\{[^}]*display:\s*none;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitOptionLynx\s*\{[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerModelGroupHeaderLynx\s*\{[^}]*border-radius:\s*10\.4px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerModelOptionLynx\s*\{[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerModelOptionNameLynx\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerModelOptionFavoriteLynx\s*\{[^}]*border-radius:\s*10\.4px;/s
    );
  });
});
