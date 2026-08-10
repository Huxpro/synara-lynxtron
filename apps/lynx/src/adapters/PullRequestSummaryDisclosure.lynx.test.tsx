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
    const commentSource = readFileSync(
      new URL('./PullRequestSummaryCommentCard.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('useLynxDisclosurePresence(open)');
    expect(source).toContain(
      '<PullRequestActorLabel actor={props.author} variant="author" />'
    );
    expect(source).toContain('className="SharedPrSummaryReviewers"');
    expect(source).toContain('cwd={props.detail.workspaceRoot}');
    expect(source).toContain('<PullRequestSummaryMetaIcon kind="reviewers" />');
    expect(source).toContain('<PullRequestSummaryMetaIcon');
    expect(source).toContain(
      '<PullRequestCheckStatusIcon status={props.check.status} />'
    );
    expect(source).toContain(
      'void platformWindow.openExternal(props.check.url!)'
    );
    expect(commentSource).toContain('actor={props.comment.author}');
    expect(commentSource).toContain('variant="comment"');
    expect(source).not.toContain(
      "props.reviewers.map((actor) => actor.login).join(', ')"
    );
    expect(source).not.toContain(
      "{comment.author?.login ?? 'ghost'}"
    );
    expect(source).toContain(
      'defaultOpen={index >= props.detail.comments.length - 2}'
    );
    expect(commentSource).toContain('formatRelativeTime(props.comment.createdAt)');
    expect(commentSource).toContain('useLynxDisclosurePresence(open)');
    expect(commentSource).toContain('disclosureChevronClassName(');
    expect(commentSource).toContain('disclosureContentClassName(');
    expect(commentSource).toContain('cwd={props.workspaceRoot}');
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
