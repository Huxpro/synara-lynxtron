import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Composer token icon fidelity', () => {
  it('shares the slash picker with provider skills while retaining the legacy skill trigger', () => {
    const source = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('? [...slashCommandItems, ...skillItems]');
    expect(source).toContain(
      "composerTrigger?.kind === 'skill' ||\n        composerTrigger?.kind === 'slash-command'"
    );
    expect(source).toContain("if (item.type === 'skill') {");
    expect(source).toContain('selectSkill(item);');
  });

  it('uses semantic icons for every rich composer token', () => {
    const source = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "import agentMentionSvg from '@synara-central-icons/robot.svg?raw';"
    );
    expect(source).toContain(
      "import skillSvg from '@synara-central-icons/building-blocks.svg?raw';"
    );
    expect(source).toContain(
      "import terminalSvg from '@synara-central-icons/console.svg?raw';"
    );
    expect(source).toContain('<FileEntryIcon');
    expect(source).toContain('<ExternalLinkIcon');
    expect(source).toContain(
      'token.key.slice(\'mention:\'.length)'
    );
    expect(source).toContain(
      '<ClockIcon'
    );
    expect(source).not.toContain('function segmentGlyph');
    expect(source).not.toContain("return '◆'");
    expect(source).not.toContain("return '›'");
    expect(source).not.toContain("return '↗'");
    expect(source).not.toContain('className="ComposerChipGlyph"');
    expect(styles).toMatch(
      /\.ComposerChipIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*margin-right:\s*4px;[^}]*flex-shrink:\s*0;/s
    );
  });

  it('matches the Web token anatomy instead of filling every token with accent', () => {
    const source = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "resolveAgentChipColor(segment.color)"
    );
    expect(source).toContain("color=\"var(--info-foreground)\"");
    expect(styles).toMatch(
      /\.ComposerChip--mention,\s*\.ComposerChip--skill,\s*\.ComposerChip--slash-command,\s*\.ComposerChip--link\s*\{[^}]*background-color:\s*transparent;/s
    );
    expect(styles).toMatch(
      /\.ComposerChipLabel\s*\{[^}]*color:\s*var\(--info-foreground\);[^}]*font-size:\s*var\(--type-composer-editor-size\);[^}]*font-weight:\s*500;/s
    );
    expect(styles).toMatch(
      /\.ComposerChip--agent-mention\s*\{[^}]*padding:\s*2px 6px;[^}]*border-radius:\s*var\(--radius-md\);/s
    );
    expect(styles).toMatch(
      /\.ComposerChip--terminal-context\s*\{[^}]*margin-right:\s*0;[^}]*margin-left:\s*0;[^}]*padding:\s*2px;[^}]*border:\s*1px solid var\(--color-border-light\);[^}]*border-radius:\s*4px;[^}]*background-color:\s*var\(--sidebar-accent-active\);/s
    );
    expect(styles).toMatch(
      /\.ComposerChip--terminal-context \.ComposerChipIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.85;/s
    );
    expect(styles).not.toMatch(
      /\.ComposerChip\s*\{[^}]*background-color:\s*var\(--accent\);/s
    );
  });

  it('keeps the model picker inside short viewports with a scroll owner', () => {
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ComposerModelPopupLynx\.LxMenuPopup\s*\{[^}]*height:\s*calc\(100vh - 16px\);[^}]*max-height:\s*calc\(100vh - 16px\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.ComposerProviderOptionListLynx,\s*\.SliceRoot--viewport-short-height \.ComposerModelOptionListLynx\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*max-height:\s*none;/s
    );
  });

  it('uses Electron-style provider submenus while compact stays single-pane', () => {
    const source = readFileSync(
      new URL('./ComposerModelControl.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('className="ComposerModelBrowserLynx"');
    expect(source).toContain('function renderProviderSubmenuList()');
    expect(source).toContain('className="ComposerProviderSubmenuListLynx"');
    expect(source).toContain('className="ComposerProviderSubTriggerLynx"');
    expect(source).toContain('side="left"');
    expect(source).toContain('portaled');
    expect(source).toContain('open={submenuProvider === item.provider}');
    expect(source).toContain('setSubmenuProvider(open ? item.provider : null)');
    expect(source).toContain('props.onCatalogProviderChange(item.provider);');
    expect(source).toContain('props.favoriteModelSlugsOverride?.[favoriteProvider]');
    expect(source).toContain('props.onFavoriteModelSlugsChange?.(');
    expect(source).toMatch(
      /onOpenChange=\{\(open\) => \{\s*'background only';\s*setSubmenuProvider/s
    );
    expect(source).toMatch(
      /onOpen=\{\(\) => \{\s*'background only';\s*setModelSearchQuery/s
    );
    expect(source).toContain('useSinglePanelModelNavigation');
    expect(source).toContain(
      "useSinglePanelModelNavigation &&\n            popupContent !== 'providers'"
    );
    expect(source).toContain('SEARCHABLE_MODEL_PICKER_THRESHOLD');
    expect(source).toContain('buildModelSearchText(option)');
    expect(source).toContain('placeholder="Search models or providers"');
    expect(source).toContain("? 'No Pi models found'");
    expect(source).toContain(": 'No matches'");
    expect(source).toContain('catalogProvider === activeProvider ? catalogCurrentModel : null');
    expect(source).toContain("activeModel={catalogActiveModel ?? ''}");
    expect(styles).toMatch(
      /\.ComposerModelPopupLynx\s*\{[^}]*width:\s*208px;[^}]*min-width:\s*208px;[^}]*max-height:\s*min\(320px, 55vh\);/s
    );
    expect(styles).toMatch(
      /\.ComposerModelSubPopupLynx\s*\{[^}]*width:\s*208px;[^}]*min-width:\s*208px;[^}]*height:\s*320px;[^}]*max-height:\s*320px;/s
    );
    expect(source).toMatch(
      /popupContent === 'providers'[\s\S]*?props\.splitTraits \? \(\s*renderProviderList\(\)/s
    );
  });

  it('keeps effort rows compact like Electron while retaining descriptions for accessibility', () => {
    const adapterSource = readFileSync(
      new URL('../../adapters/ComposerTraitRadioSectionCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(adapterSource).toContain('props.description');
    expect(adapterSource).not.toContain('ComposerTraitOptionDescriptionLynx');
    expect(styles).toMatch(
      /\.ComposerTraitOptionLynx\s*\{[^}]*min-height:\s*26px;[^}]*padding-top:\s*4px;[^}]*padding-bottom:\s*4px;/s
    );
    expect(styles).not.toContain('.ComposerTraitOptionDescriptionLynx');
  });

  it('projects the shared context-window snapshot into the composer footer meter', () => {
    const source = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const elements = readFileSync(
      new URL('../../adapters/ComposerInputCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('deriveLatestContextWindowSnapshot(activities)');
    expect(source).toContain('deriveContextWindowMeterDisplay(contextWindow)');
    expect(source).toContain('<ComposerContextWindowMeterElement');
    expect(source).toContain(
      '!isVoiceTranscribing &&\n              !compactFooter &&\n              contextWindowDisplay'
    );
    expect(source).toContain('usage={contextWindow}');
    expect(source).toContain('deriveCumulativeCostUsd(activities)');
    expect(elements).toContain('<path d=\"M 8 2 A');
    expect(elements).not.toContain('stroke-dashoffset');
    expect(elements).toContain('Automatically compacts its context when needed.');
    expect(elements).toContain('Model window:');
    expect(elements).toContain('Session cost:');
    expect(elements).toContain('}, 150);');
    expect(elements).toContain('style={{ height: `${popoverHeight}px` }}');
    expect(elements).toContain('useState(props.initialOpen ?? false)');
    expect(elements).toContain('initialOpenRef.current === props.initialOpen');
    expect(elements).toContain('setOpen(props.initialOpen)');
    expect(styles).toMatch(
      /\.ComposerContextWindowMeterLynx svg\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;/s
    );
    expect(styles).toContain('.ComposerContextWindowPopoverLynx {');
    expect(styles).toMatch(
      /\.ComposerContextWindowPopoverLynx\s*\{[^}]*width:\s*323px;[^}]*max-width:\s*calc\(100vw - 32px\);[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s
    );
    expect(styles).toContain('padding: 8px 12px;');
    expect(styles).toContain('border-radius: 12px;');
    expect(styles).toContain('width: 323px;');
    expect(styles).toContain(
      'background-color: var(--color-background-surface-under);'
    );
    expect(styles).toMatch(
      /\.ComposerContextWindowMeterLynx--open \.ComposerContextWindowMeterIconLynx\s*\{[^}]*opacity:\s*0\.8;/s
    );
    expect(styles).not.toMatch(
      /\.ComposerContextWindowMeterLynx--open\s*\{[^}]*opacity:/s
    );
    expect(elements).toContain(
      'top: `${8 + index * (popoverRowHeight + popoverRowGap)}px`'
    );
    expect(elements).toContain('const popoverRowHeight = 17;');
    expect(elements).toContain('const popoverRowGap = 6;');
    expect(elements).toContain('popoverRows.map((row, index)');
    expect(styles).toContain('flex-shrink: 0;');
  });
});
