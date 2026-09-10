import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx pending approval capability', () => {
  const panelSource = readFileSync(
    new URL('../components/composer/PendingApprovalPanel.lynx.tsx', import.meta.url),
    'utf8'
  );
  const sharedSource = readFileSync(
    new URL(
      '../../../web/src/components/chat/ComposerPendingApprovalPanel.logic.ts',
      import.meta.url
    ),
    'utf8'
  );
  const querySource = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');
  const routerSource = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
  const choiceRowSource = readFileSync(
    new URL('../components/composer/ComposerChoiceRow.lynx.tsx', import.meta.url),
    'utf8'
  );
  const choiceRowCss = readFileSync(
    new URL('../components/composer/composer-choice-row.css', import.meta.url),
    'utf8'
  );
  const panelCss = readFileSync(
    new URL('../components/composer/pending-approval-panel.css', import.meta.url),
    'utf8'
  );

  it('reuses the shared action model and detail parser', () => {
    expect(panelSource).toContain('APPROVAL_ACTIONS');
    expect(panelSource).toContain('APPROVAL_KIND_PROMPT');
    expect(panelSource).toContain('parseApprovalDetail');
    expect(sharedSource).toContain('Approve once');
    expect(panelSource).not.toContain('Approve once');
  });

  it('reuses the responsive decision row and keeps long metadata shrinkable', () => {
    expect(panelSource).toContain('<scroll-view');
    expect(panelSource).toContain('ComposerDecisionPanelLynx');
    expect(panelSource).toContain('scroll-orientation="vertical"');
    expect(panelSource).toContain('<ComposerChoiceRow');
    expect(choiceRowSource).toContain('<text className="ComposerChoiceCopyLynx">');
    expect(choiceRowSource).toContain('<text className="ComposerChoiceDescriptionLynx">');
    expect(choiceRowCss).toMatch(
      /\.ComposerChoiceCopyLynx\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*word-break:\s*break-word;/s
    );
    expect(panelCss).toMatch(
      /\.PendingApprovalHeadingLynx\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;/s
    );
    expect(choiceRowCss).toMatch(
      /\.ComposerDecisionPanelLynx\s*\{[^}]*max-height:\s*calc\(100vh - 210px\);[^}]*overflow-x:\s*hidden;/s
    );
    expect(panelCss).toMatch(
      /\.PendingApprovalPathLynx\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;/s
    );
  });

  it('projects canonical pending interactions into the thread summary', () => {
    expect(querySource).toContain('derivePendingApprovals(');
    expect(querySource).toContain('thread.pendingInteractions');
    expect(querySource).toContain('pendingApprovals: readonly PendingApproval[]');
  });

  it('dispatches the canonical response and refreshes the thread', () => {
    expect(routerSource).toContain("type: 'thread.approval.respond'");
    expect(routerSource).toContain('requestId: activePendingApproval.requestId');
    expect(routerSource).toContain('decision,');
    expect(routerSource).toContain("<PendingApprovalPanel");
    expect(routerSource).toContain("queryKey: ['thread-detail', threadId]");
  });
});
