import type { ProviderApprovalDecision } from '@synara/contracts';
import type { PendingApproval } from '@synara-web/session-logic';
import {
  APPROVAL_ACTIONS,
  APPROVAL_KIND_PROMPT,
  parseApprovalDetail,
  shortenApprovalPath,
} from '@synara-web/components/chat/ComposerPendingApprovalPanel.logic';

import { Button } from '../ui/button.lynx';
import './pending-approval-panel.css';

export function PendingApprovalPanel(props: {
  readonly approval: PendingApproval;
  readonly pendingCount: number;
  readonly responding: boolean;
  readonly onRespond: (
    decision: ProviderApprovalDecision,
    lifecycleGeneration?: string
  ) => void;
}) {
  const parsed = parseApprovalDetail(props.approval.detail);
  const detail =
    parsed.fileName ??
    parsed.command ??
    parsed.fallback ??
    'Review the request to continue.';
  const supportingPath =
    parsed.fileName && parsed.fileDir
      ? shortenApprovalPath(parsed.fileDir)
      : null;

  return (
    <view className="PendingApprovalPanelLynx">
      <view className="PendingApprovalHeaderLynx">
        <text className="PendingApprovalTitleLynx">
          {APPROVAL_KIND_PROMPT[props.approval.requestKind]}
        </text>
        {parsed.tool ? (
          <text className="PendingApprovalToolLynx">{parsed.tool}</text>
        ) : null}
        {props.pendingCount > 1 ? (
          <text className="PendingApprovalCountLynx">
            1/{props.pendingCount}
          </text>
        ) : null}
      </view>
      <view className="PendingApprovalDetailLynx">
        <text className="PendingApprovalDetailTextLynx">{detail}</text>
        {supportingPath ? (
          <text className="PendingApprovalPathLynx">{supportingPath}</text>
        ) : null}
      </view>
      <view className="PendingApprovalActionsLynx">
        {APPROVAL_ACTIONS.map((action, index) => (
          <Button
            key={action.decision}
            variant="ghost"
            size="sm"
            disabled={props.responding}
            className={`PendingApprovalActionLynx PendingApprovalActionLynx--${action.tone}`}
            aria-label={action.label}
            onClick={() =>
              props.onRespond(
                action.decision,
                props.approval.lifecycleGeneration
              )
            }
          >
            <text className="PendingApprovalShortcutLynx">{index + 1}</text>
            <view className="PendingApprovalActionCopyLynx">
              <text className="PendingApprovalActionLabelLynx">
                {action.label}
              </text>
              <text className="PendingApprovalActionDescriptionLynx">
                {action.description}
              </text>
            </view>
          </Button>
        ))}
      </view>
      <text className="PendingApprovalHintLynx">
        Resolve this approval request to continue
      </text>
    </view>
  );
}
