import { useRef } from "@lynx-js/react";
import { pendingRequestInstanceKey } from "@synara/shared/threadSummary";
import {
  APPROVAL_ACTIONS,
  WITHOUT_SESSION_APPROVAL,
  COMPUTER_SCOPES,
  KIND_PROMPT as APPROVAL_KIND_PROMPT,
} from "../../generated/approvalActions.generated";
import { formatToolParameterValue } from "../../generated/approvalParameters.generated";
import { hostKeyHandler } from "../ui/keyEvent.lynx";
import type { ProviderApprovalDecision } from "@synara/contracts";
import type { PendingApproval } from "@synara-web/session-logic";
import {
  parseApprovalDetail,
  shortenApprovalPath,
} from "@synara-web/components/chat/ComposerPendingApprovalPanel.logic";

import { ComposerChoiceRow } from "./ComposerChoiceRow.lynx";
import "./pending-approval-panel.css";

export function PendingApprovalPanel(props: {
  readonly approval: PendingApproval;
  readonly pendingCount: number;
  readonly responding: boolean;
  readonly onRespond: (
    decision: ProviderApprovalDecision,
    lifecycleGeneration?: string,
  ) => Promise<void>;
}) {
  const parsed = parseApprovalDetail(props.approval.detail);
  const computerScope = props.approval.approvalScope
    ? COMPUTER_SCOPES[props.approval.approvalScope]
    : undefined;
  const actions =
    computerScope?.actions ??
    (props.approval.sessionApprovalAvailable === false
      ? WITHOUT_SESSION_APPROVAL
      : APPROVAL_ACTIONS);
  const submittedKey = useRef<string | null>(null);
  const submissionKey = JSON.stringify([
    pendingRequestInstanceKey(props.approval.requestId, props.approval.lifecycleGeneration),
    props.approval.responseAttemptKey ?? null,
  ]);
  const respondOnce = (decision: ProviderApprovalDecision) => {
    "background only";
    if (props.responding || submittedKey.current === submissionKey) return;
    submittedKey.current = submissionKey;
    void props.onRespond(decision, props.approval.lifecycleGeneration).catch(() => {
      if (submittedKey.current === submissionKey) submittedKey.current = null;
    });
  };
  const detail =
    parsed.fileName ?? parsed.command ?? parsed.fallback ?? "Review the request to continue.";
  const supportingPath =
    parsed.fileName && parsed.fileDir ? shortenApprovalPath(parsed.fileDir) : null;

  return (
    <scroll-view
      className="PendingApprovalPanelLynx ComposerDecisionPanelLynx"
      scroll-orientation="vertical"
      scroll-y
      enable-scroll-bar
      catchkeydown={hostKeyHandler((event) => {
        "background only";
        if (props.responding || event.metaKey || event.ctrlKey || event.altKey) return;
        const action = /^[1-9]$/.test(event.key) ? actions[Number(event.key) - 1] : undefined;
        if (!action) return;
        event.preventDefault();
        respondOnce(action.decision);
      })}
    >
      <view className="PendingApprovalHeaderLynx">
        <text className="PendingApprovalHeadingLynx">
          <text className="PendingApprovalTitleLynx">
            {computerScope?.prompt ?? APPROVAL_KIND_PROMPT[props.approval.requestKind]}
          </text>
          {!computerScope && (props.approval.toolName ?? parsed.tool) ? (
            <text className="PendingApprovalToolLynx">
              {"  "}
              {props.approval.toolName ?? parsed.tool}
            </text>
          ) : null}
        </text>
        {props.pendingCount > 1 ? (
          <text className="PendingApprovalCountLynx">1/{props.pendingCount}</text>
        ) : null}
      </view>
      {props.approval.permissionProfile ? (
        <view className="PendingApprovalStructuredDetailLynx">
          {parsed.fallback ? (
            <text className="PendingApprovalFallbackLynx">{parsed.fallback}</text>
          ) : null}
          <scroll-view
            className="PendingApprovalPermissionProfileLynx"
            scroll-y
            scroll-orientation="vertical"
          >
            <text className="PendingApprovalPermissionProfileTextLynx">
              {JSON.stringify(props.approval.permissionProfile, null, 2)}
            </text>
          </scroll-view>
        </view>
      ) : props.approval.toolName || (props.approval.toolParamsDisplay?.length ?? 0) > 0 ? (
        <view className="PendingApprovalStructuredDetailLynx">
          {parsed.fallback ? (
            <text className="PendingApprovalFallbackLynx">{parsed.fallback}</text>
          ) : null}
          {props.approval.toolParamsDisplay?.length ? (
            <view className="PendingApprovalParametersLynx">
              {props.approval.toolParamsDisplay.map((parameter) => (
                <view className="PendingApprovalParameterLynx" key={parameter.name}>
                  <text className="PendingApprovalParameterNameLynx">
                    {parameter.displayName ?? parameter.name}
                  </text>
                  <text className="PendingApprovalParameterValueLynx">
                    {formatToolParameterValue(parameter.value)}
                  </text>
                </view>
              ))}
            </view>
          ) : null}
        </view>
      ) : parsed.fileName ? (
        <view className="PendingApprovalFileDetailLynx">
          <text className="PendingApprovalFileNameLynx">{parsed.fileName}</text>
          {supportingPath ? (
            <text className="PendingApprovalPathLynx">{supportingPath}</text>
          ) : null}
        </view>
      ) : (
        <view className="PendingApprovalDetailLynx">
          <text className="PendingApprovalDetailTextLynx">{detail}</text>
        </view>
      )}
      <view className="PendingApprovalActionsLynx">
        {actions.map((action, index) => (
          <ComposerChoiceRow
            key={action.decision}
            shortcut={index + 1}
            label={action.label}
            description={action.description}
            tone={action.tone}
            disabled={props.responding}
            onSelect={() => respondOnce(action.decision)}
          />
        ))}
      </view>
    </scroll-view>
  );
}
