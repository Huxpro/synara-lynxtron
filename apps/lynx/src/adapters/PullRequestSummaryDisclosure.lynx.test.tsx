import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request summary disclosure fidelity', () => {
  it('uses the shared 220ms disclosure presence, content, and chevron contract', () => {
    const source = readFileSync(
      new URL('./PullRequestSummaryCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('useLynxDisclosurePresence(open)');
    expect(source).toContain('disclosureContentClassName(');
    expect(source).toContain('disclosureChevronClassName(');
    expect(source).toContain('<ChevronRightIcon');
    expect(source).toContain('aria-hidden={!open}');
    expect(source).not.toContain("{open ? '⌄' : '›'}");
    expect(styles).toMatch(
      /\.SharedPrSummarySectionChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*margin-left:\s*6px;/s
    );
    expect(styles).not.toMatch(
      /\.SharedPrSummarySectionHeader\.ui-(?:hover|pressed)[^{]*\{[^}]*(?:background-color|opacity):/s
    );
  });

  it('delegates branch anatomy to the lightweight branch-row component', () => {
    const source = readFileSync(
      new URL('./PullRequestSummaryCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('<PullRequestSummaryBranchRow');
    expect(source).not.toContain(
      '`${props.headBranch} › ${props.baseBranch}'
    );
  });
});
