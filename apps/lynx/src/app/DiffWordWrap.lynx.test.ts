import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx diff word wrap setting', () => {
  const diffDockSource = readFileSync(
    new URL('./DiffDock.lynx.tsx', import.meta.url),
    'utf8'
  );
  const compositionSource = readFileSync(
    new URL(
      '../../../web/src/components/pullRequest/PullRequestCodeComposition.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const lynxElementsSource = readFileSync(
    new URL(
      '../adapters/PullRequestCodeCompositionElements.lynx.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const lynxStyles = readFileSync(
    new URL(
      '../adapters/pull-request-code-composition-elements.css',
      import.meta.url
    ),
    'utf8'
  );
  const webElementsSource = readFileSync(
    new URL(
      '../../../web/src/components/pullRequest/PullRequestCodeCompositionElements.tsx',
      import.meta.url
    ),
    'utf8'
  );

  it('reads the canonical Behavior projection for working-tree diffs', () => {
    expect(diffDockSource).toContain('readSettingsBehaviorProjection(');
    expect(diffDockSource).toContain(
      'webStorage.getItem(APP_SETTINGS_STORAGE_KEY)'
    );
    expect(diffDockSource).toContain('wordWrap={diffWordWrap}');
  });

  it('keeps word wrapping in the host-neutral code composition contract', () => {
    expect(compositionSource).toContain('readonly wordWrap?: boolean;');
    expect(compositionSource).toContain(
      '<PullRequestCodeLinesElement wordWrap={props.wordWrap ?? false}>'
    );
    expect(compositionSource).toContain('wordWrap={props.wordWrap ?? false}');
  });

  it('switches Web and Lynx hosts between horizontal scroll and wrapping', () => {
    expect(webElementsSource).toContain(
      'props.wordWrap ? "overflow-x-hidden" : "overflow-x-auto"'
    );
    expect(webElementsSource).toContain(
      'props.wordWrap ? "whitespace-pre-wrap wrap-break-word" : "whitespace-pre"'
    );
    expect(lynxElementsSource).toContain(
      '<view className="SharedPrCodeLines SharedPrCodeLines--wrap">'
    );
    expect(lynxElementsSource).toContain(
      "props.wordWrap ? ' SharedPrCodeLine--wrap' : ''"
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--wrap \.SharedPrCodeLineText\s*\{[^}]*white-space:\s*pre-wrap;/s
    );
  });
});
