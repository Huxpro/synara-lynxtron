import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request Code disclosure fidelity', () => {
  it('uses the shared SVG and 220ms disclosure contract', () => {
    const lynxElements = readFileSync(
      new URL('./PullRequestCodeCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const lynxStyles = readFileSync(
      new URL('./pull-request-code-composition-elements.css', import.meta.url),
      'utf8'
    );
    const webElements = readFileSync(
      new URL(
        '../../../web/src/components/pullRequest/PullRequestCodeCompositionElements.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const composition = readFileSync(
      new URL(
        '../../../web/src/components/pullRequest/PullRequestCodeComposition.tsx',
        import.meta.url
      ),
      'utf8'
    );

    expect(lynxElements).toContain('<ChevronRightIcon');
    expect(lynxElements).toContain('disclosureChevronClassName(');
    expect(lynxElements).toContain(
      'useLynxDisclosurePresence(props.expanded)'
    );
    expect(lynxElements).toContain('disclosureContentClassName(');
    expect(lynxElements).toContain('aria-expanded={props.expanded}');
    expect(lynxElements).not.toMatch(/[▸▾]/);
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFileChevron\s*\{[^}]*width:\s*10px;[^}]*height:\s*10px;[^}]*flex-shrink:\s*0;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeRoot\s*\{[^}]*gap:\s*12px;[^}]*padding:\s*12px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFileHeader\s*\{[^}]*gap:\s*8px;[^}]*padding:\s*8px 12px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFileHeader\s*\{[^}]*background-color:\s*rgba\(13,\s*13,\s*13,\s*0\.014\);/s
    );
    expect(lynxStyles).toMatch(
      /\.SliceRoot--theme-dark \.SharedPrCodeFileHeader\s*\{[^}]*background-color:\s*rgba\(252,\s*252,\s*252,\s*0\.0021\);/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeStatsText,[^{]*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeNotice\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFilePath\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFilePrevious\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeMoreText\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--addition\s*\{[^}]*background-color:\s*rgba\(0,\s*162,\s*64,\s*0\.1\);/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--deletion\s*\{[^}]*background-color:\s*rgba\(224,\s*46,\s*42,\s*0\.1\);/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--hunk\s*\{[^}]*background-color:\s*rgba\(13,\s*13,\s*13,\s*0\.024\);/s
    );
    expect(lynxStyles).toMatch(
      /\.SliceRoot--theme-dark \.SharedPrCodeLine--hunk\s*\{[^}]*background-color:\s*rgba\(252,\s*252,\s*252,\s*0\.0036\);/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine\s*\{[^}]*min-height:\s*20px;/s
    );
    expect(lynxElements).toContain('className="SharedPrCodeLines"');
    expect(lynxElements).toContain('scroll-orientation="horizontal"');
    expect(lynxElements).toContain('className="SharedPrCodeLinesContent"');
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLinesContent\s*\{[^}]*min-width:\s*100%;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine\s*\{[^}]*min-width:\s*100%;/s
    );
    expect(lynxStyles).not.toMatch(
      /\.SharedPrCodeLine\s*\{[^}]*\n\s*width:\s*100%;/s
    );
    expect(lynxStyles).not.toMatch(
      /\.SharedPrCodeLine\s*\{[^}]*border-left:/
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLineNumber\s*\{[^}]*width:\s*40px;[^}]*line-height:\s*20px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLinePrefix\s*\{[^}]*width:\s*20px;[^}]*line-height:\s*20px;/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLineText\s*\{[^}]*padding-right:\s*12px;[^}]*line-height:\s*20px;/s
    );
    expect(lynxStyles).not.toMatch(
      /\.SharedPrCodeFileHeader\.ui-(?:hover|pressed)[^{]*\{[^}]*background-color:/s
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeMore\.ui-hover \.SharedPrCodeMoreText,[^{]*\{[^}]*color:\s*var\(--foreground\);/s
    );
    expect(lynxStyles).not.toMatch(
      /\.SharedPrCodeMore\.ui-(?:hover|pressed)[^{]*\{[^}]*background-color:/s
    );

    expect(webElements).toContain(
      'import { DisclosureChevron } from "~/components/ui/DisclosureChevron";'
    );
    expect(webElements).toContain(
      'import { DisclosureRegion } from "~/components/ui/DisclosureRegion";'
    );
    expect(webElements).not.toMatch(/[▸▾]/);
    expect(composition).toContain('<PullRequestCodeDisclosureElement expanded>');
    expect(composition).toContain(
      '<PullRequestCodeDisclosureElement expanded={isExpanded}>'
    );
    expect(composition).not.toContain('{isExpanded ? (');
  });
});
