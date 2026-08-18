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

  it('reuses the shared action model and detail parser', () => {
    expect(panelSource).toContain('APPROVAL_ACTIONS');
    expect(panelSource).toContain('APPROVAL_KIND_PROMPT');
    expect(panelSource).toContain('parseApprovalDetail');
    expect(sharedSource).toContain('Approve once');
    expect(panelSource).not.toContain('Approve once');
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
