import {
  resolveSidebarThreadSubagentModel,
  type SidebarThreadSubagentModel,
} from "./SidebarThreadSubagentModel.logic";
import {
  SidebarThreadSubagentConnectorElement,
  SidebarThreadSubagentCopyElement,
  SidebarThreadSubagentPrimaryElement,
  SidebarThreadSubagentSupportingElement,
} from "~/components/SidebarThreadSubagentIdentityElements";

export interface SidebarSubagentThreadIdentityInput {
  readonly id: string;
  readonly title?: string | null | undefined;
  readonly parentThreadId?: string | null | undefined;
  readonly subagentAgentId?: string | null | undefined;
  readonly subagentNickname?: string | null | undefined;
  readonly subagentRole?: string | null | undefined;
}

export function SidebarThreadSubagentConnector({
  thread,
  indentPx,
}: {
  readonly thread: SidebarSubagentThreadIdentityInput;
  readonly indentPx: number;
}) {
  const presentation = resolveSidebarThreadSubagentModel({
    nickname: thread.subagentNickname,
    role: thread.subagentRole,
    title: thread.title,
    fallbackId: thread.id,
  });
  return (
    <SidebarThreadSubagentConnectorElement
      indentPx={indentPx}
      accentColor={presentation.accentColor}
    />
  );
}

export function SidebarThreadSubagentIdentity({
  thread,
  presentation,
  supportingClassName = "ml-1 text-muted-foreground/48",
}: {
  readonly thread: SidebarSubagentThreadIdentityInput;
  readonly presentation?: SidebarThreadSubagentModel | undefined;
  readonly supportingClassName?: string | undefined;
}) {
  const resolvedPresentation =
    presentation ??
    resolveSidebarThreadSubagentModel({
      nickname: thread.subagentNickname,
      role: thread.subagentRole,
      title: thread.title,
      fallbackId: thread.id,
    });
  const supportingLabel =
    resolvedPresentation.role ??
    (resolvedPresentation.nickname &&
    resolvedPresentation.title &&
    resolvedPresentation.title !== resolvedPresentation.nickname
      ? resolvedPresentation.title
      : null);

  return (
    <SidebarThreadSubagentCopyElement>
      <SidebarThreadSubagentPrimaryElement accentColor={resolvedPresentation.accentColor}>
        {resolvedPresentation.nickname ?? resolvedPresentation.primaryLabel}
      </SidebarThreadSubagentPrimaryElement>
      {supportingLabel ? (
        <SidebarThreadSubagentSupportingElement className={supportingClassName}>
          {resolvedPresentation.role ? `(${resolvedPresentation.role})` : supportingLabel}
        </SidebarThreadSubagentSupportingElement>
      ) : null}
    </SidebarThreadSubagentCopyElement>
  );
}
