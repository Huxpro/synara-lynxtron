// FILE: ComposerPendingApprovalPanel.tsx
// Purpose: Detached card, floating just above the composer, that surfaces a pending
// tool approval — the command / file context plus approve / decline / cancel actions
// rendered as list-style choice rows. Mirrors ComposerPendingUserInputPanel (same
// surface, spacing, chips, and scoped keyboard shortcuts) so approvals and AskUserQuestion
// prompts read as one coherent decision surface instead of the old fused-banner look.
// Layer: Chat composer UI
// Exports: ComposerPendingApprovalPanel

import { type ApprovalRequestId, type ProviderApprovalDecision } from "@synara/contracts";
import { type KeyboardEvent } from "react";
import { type PendingApproval } from "../../session-logic";
import { cn } from "~/lib/utils";
import { ComposerChoiceRow } from "./ComposerChoiceRow";
import {
  APPROVAL_ACTIONS,
  APPROVAL_KIND_PROMPT,
  parseApprovalDetail,
  shortenApprovalPath,
  type ParsedApproval,
} from "./ComposerPendingApprovalPanel.logic";
import { COMPOSER_INPUT_SURFACE_CLASS_NAME } from "./composerPickerStyles";

interface ComposerPendingApprovalPanelProps {
  approval: PendingApproval;
  pendingCount: number;
  isResponding: boolean;
  onRespond: (
    requestId: ApprovalRequestId,
    decision: ProviderApprovalDecision,
    lifecycleGeneration?: string,
  ) => Promise<void>;
}

export const ComposerPendingApprovalPanel = function ComposerPendingApprovalPanel({
  approval,
  pendingCount,
  isResponding,
  onRespond,
}: ComposerPendingApprovalPanelProps) {
  const parsed = parseApprovalDetail(approval.detail);
  const requestId = approval.requestId;

  // Digit shortcuts bubble from focused controls inside this card only; a bare
  // number key elsewhere in the app must never approve a tool request.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isResponding || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (
      target instanceof HTMLElement &&
      target.closest('[contenteditable]:not([contenteditable="false"])')
    ) {
      return;
    }
    const digit = Number.parseInt(event.key, 10);
    if (Number.isNaN(digit) || digit < 1 || digit > APPROVAL_ACTIONS.length) return;
    const action = APPROVAL_ACTIONS[digit - 1];
    if (!action) return;
    event.preventDefault();
    void onRespond(requestId, action.decision, approval.lifecycleGeneration);
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className={cn(COMPOSER_INPUT_SURFACE_CLASS_NAME, "overflow-hidden px-3.5 py-3")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[13px] font-medium leading-snug text-foreground/90">
          {APPROVAL_KIND_PROMPT[approval.requestKind]}
          {parsed.tool ? (
            <span className="ml-1.5 text-[11px] font-normal text-muted-foreground/50">
              {parsed.tool}
            </span>
          ) : null}
        </p>
        {pendingCount > 1 ? (
          <span className="flex h-4 shrink-0 items-center rounded bg-[var(--color-background-elevated-secondary)] px-1 text-[9.5px] font-medium tabular-nums text-[var(--color-text-foreground-secondary)]">
            1/{pendingCount}
          </span>
        ) : null}
      </div>
      <ApprovalDetail parsed={parsed} />
      <div className="mt-2.5 space-y-0.5">
        {APPROVAL_ACTIONS.map((action, index) => (
          <ComposerChoiceRow
            key={action.decision}
            shortcut={index + 1}
            label={action.label}
            description={action.description}
            tone={action.tone}
            disabled={isResponding}
            onSelect={() =>
              void onRespond(requestId, action.decision, approval.lifecycleGeneration)
            }
          />
        ))}
      </div>
    </div>
  );
};

function ApprovalDetail({ parsed }: { parsed: ParsedApproval }) {
  if (parsed.fileName) {
    return (
      <div className="mt-2">
        <p
          className="truncate text-[12.5px] font-medium leading-tight text-foreground/85"
          title={parsed.fileDir ? `${parsed.fileDir}/${parsed.fileName}` : parsed.fileName}
        >
          {parsed.fileName}
        </p>
        {parsed.fileDir ? (
          <p
            className="mt-0.5 truncate font-mono text-[10.5px] leading-tight text-muted-foreground/55"
            title={parsed.fileDir}
          >
            {shortenApprovalPath(parsed.fileDir)}
          </p>
        ) : null}
      </div>
    );
  }

  const code = parsed.command ?? parsed.fallback;
  if (code) {
    return (
      <pre
        className="mt-2 overflow-hidden rounded-md bg-[var(--color-background-elevated-secondary)] px-2.5 py-1.5 font-mono text-[11.5px] leading-snug text-foreground/85"
        title={code}
      >
        <code className="block truncate">{code}</code>
      </pre>
    );
  }

  return (
    <p className="mt-2 text-[12px] text-muted-foreground/65">Review the request to continue.</p>
  );
}
