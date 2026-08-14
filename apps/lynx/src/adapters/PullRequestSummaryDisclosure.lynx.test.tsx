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
      'openExternalBestEffort(props.check.url!)'
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
    expect(source).not.toContain(
      'Commenting is unavailable in this runtime.'
    );
    expect(commentSource).toContain('formatRelativeTime(props.comment.createdAt)');
    expect(commentSource).toContain('useLynxDisclosurePresence(open)');
    expect(commentSource).toContain('disclosureChevronClassName(');
    expect(commentSource).toContain('disclosureContentClassName(');
    expect(commentSource).toContain('cwd={props.workspaceRoot}');
    expect(commentSource).toContain(
      'parseFindingComment(props.comment.body)'
    );
    expect(commentSource).toContain('{finding.title}');
    expect(commentSource).toContain('{finding.severity} Severity');
    expect(commentSource).toContain(
      'const replyUrl = props.comment.url ?? props.prUrl'
    );
    expect(commentSource).toContain(
      'openExternalBestEffort(replyUrl)'
    );
    expect(source).toContain('prUrl={props.detail.url}');
    expect(source).toContain('disclosureContentClassName(');
    expect(source).toContain('disclosureChevronClassName(');
    expect(source).toContain('<ChevronRightIcon');
    expect(source).toContain('aria-hidden={!open}');
    expect(source).not.toContain("{open ? '⌄' : '›'}");
    expect(styles).toMatch(
      /\.SharedPrSummarySectionChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*margin-left:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummarySectionTitle\s*\{[^}]*font-size:\s*calc\(var\(--app-font-size-ui-lg\) \* 1\.16\);[^}]*line-height:\s*20px;[^}]*font-weight:\s*500;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummarySectionCount\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
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

  it('uses distinct meta and body roles for Summary empty states', () => {
    const source = readFileSync(
      new URL('./PullRequestSummaryCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('className="SharedPrSummaryEmptyChecks"');
    expect(source).toContain('className="SharedPrSummaryEmptyComments"');
    expect(styles).toMatch(
      /\.SharedPrSummaryEmptyChecks\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryEmptyComments\s*\{[^}]*padding:\s*16px 0;[^}]*font-size:\s*var\(--app-font-size-ui-lg\);[^}]*line-height:\s*20px;[^}]*text-align:\s*center;/s
    );
    expect(source).not.toContain('SharedPrSummaryMuted');
  });

  it('matches the Web check-row metadata and half-muted hover surface', () => {
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );
    const appStyles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrSummaryCheckRow\s*\{[^}]*min-height:\s*30px;[^}]*gap:\s*8px;[^}]*margin:\s*0 -8px;[^}]*padding:\s*6px 8px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryCheckRow\.ui-hover,\s*\.SharedPrSummaryCheckRow\.ui-pressed\s*\{[^}]*background-color:\s*var\(--pr-check-row-hover-surface\);/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryCheckName,\s*\.SharedPrSummaryCheckStatus\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryCommentPath\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm\);[^}]*line-height:\s*18px;/s
    );
    expect(appStyles).toContain(
      '--pr-check-row-hover-surface: rgba(13, 13, 13, 0.02);'
    );
    expect(appStyles).toContain(
      '--pr-check-row-hover-surface: rgba(252, 252, 252, 0.003);'
    );
  });

  it('uses the 12px metadata role across the Summary overview', () => {
    const source = readFileSync(
      new URL('./PullRequestSummaryCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );
    const actorStyles = readFileSync(
      new URL('./pull-request-actor-label.css', import.meta.url),
      'utf8'
    );

    for (const selector of [
      '.SharedPrSummaryBylineText',
      '.SharedPrSummaryMetaLabel,\\s*.SharedPrSummaryMetaValue',
      '.SharedPrSummaryMetaLabelText',
      '.SharedPrSummaryBranchName',
      '.SharedPrSummaryBranchArrow',
      '.SharedPrSummaryDiffStat--addition,\\s*.SharedPrSummaryDiffStat--deletion',
    ]) {
      expect(styles).toMatch(
        new RegExp(
          `${selector}\\s*\\{[^}]*font-size:\\s*var\\(--app-font-size-ui\\);`,
          's'
        )
      );
    }
    expect(actorStyles).toMatch(
      /\.SharedPrActorLabel--reviewer \.SharedPrActorLogin\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm\);/s
    );
    expect(styles).not.toContain('.SharedPrSummaryBylineStrong');
    expect(styles).not.toContain('.SharedPrSummaryCapability');
    expect(styles).not.toContain('.SharedPrSummaryMetaValue--warning');
    expect(source).not.toContain('SharedPrSummaryMetaValue--warning');
    expect(styles).toMatch(
      /\.SharedPrSummaryByline\s*\{[^}]*flex-direction:\s*row;[^}]*flex-wrap:\s*wrap;[^}]*gap:\s*6px;[^}]*margin-top:\s*6px;/s
    );
  });

  it('matches the Web comment-card inset and between-card divider', () => {
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );
    const appStyles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrSummaryComment\s*\{[^}]*width:\s*100%;[^}]*\}/s
    );
    expect(styles).not.toMatch(
      /\.SharedPrSummaryComment\s*\{[^}]*(?:padding|border-bottom):/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryComment \+ \.SharedPrSummaryComment\s*\{[^}]*border-top:\s*1px solid var\(--pr-comment-divider\);/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryCommentHeader\s*\{[^}]*padding:\s*10px 0;/s
    );
    expect(styles).not.toMatch(
      /\.SharedPrSummaryCommentPath\s*\{[^}]*margin-left:/s
    );
    expect(appStyles).toContain(
      '--pr-comment-divider: rgba(13, 13, 13, 0.0345);'
    );
    expect(appStyles).toContain(
      '--pr-comment-divider: rgba(252, 252, 252, 0.036);'
    );
  });

  it('matches the 60-percent section divider and Reply hover surface', () => {
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );
    const appStyles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrSummarySection\s*\{[^}]*border-top:\s*1px solid var\(--pr-section-divider\);/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryCommentReply\.ui-hover,\s*\.SharedPrSummaryCommentReply\.ui-pressed\s*\{[^}]*background-color:\s*var\(--pr-inline-muted-surface\);/s
    );
    expect(appStyles).toContain(
      '--pr-section-divider: rgba(13, 13, 13, 0.0414);'
    );
    expect(appStyles).toContain(
      '--pr-section-divider: rgba(252, 252, 252, 0.0432);'
    );
    expect(appStyles).toContain(
      '--pr-inline-muted-surface: rgba(13, 13, 13, 0.024);'
    );
    expect(appStyles).toContain(
      '--pr-inline-muted-surface: rgba(252, 252, 252, 0.0036);'
    );
  });

  it('matches finding and Reply semantic text roles', () => {
    const styles = readFileSync(
      new URL('./pull-request-summary-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrSummaryFindingTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-lg\);[^}]*line-height:\s*20px;[^}]*font-weight:\s*600;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryFindingSeverity\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;[^}]*font-weight:\s*500;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSummaryCommentReplyText\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;[^}]*font-weight:\s*500;/s
    );
  });
});
