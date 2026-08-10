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
