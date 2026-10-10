// FILE: app/ProviderHandoffDivider.lynx.tsx
// Purpose: Lynx rendering of upstream's `chat/ProviderHandoffDivider.tsx` and the
//   `ProviderHandoffDetails` block of `chat/TimelineWorkEntryRow.tsx`: the transcript
//   boundary where a thread was handed to another provider in place, which opens on
//   the transferred context (or, for a failed handoff, the start error).
//   Upstream writes both as DOM markup; the data (`ProviderHandoffInfo` from
//   `workLog`, `resolveThreadModelSummary`) is upstream's, imported.
// Layer: Lynx transcript UI

import { useState } from "@lynx-js/react";
import type { ModelSelection } from "@synara/contracts";
import { PROVIDER_DESCRIPTORS } from "@synara/shared/providerMetadata";
import {
  formatThreadModelSummaryLabel,
  resolveThreadModelSummary,
} from "@synara-web/lib/threadModelSummary";
import type { ProviderHandoffInfo } from "@synara-web/workLog";
import fastModeSvg from "@synara-central-icons-fill/zap.svg?raw";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { ArrowRightIcon, CircleAlertIcon } from "../lib/icons.lynx";
import { Hugeicon } from "../lib/hugeicons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { disclosureContentClassName, useLynxDisclosurePresence } from "../platform/motion.lynx";

import "./provider-handoff-divider.css";

/**
 * `providerModelLabel` of upstream's `TimelineWorkEntryRow.tsx` (file-local there;
 * `plan/upstream-parallel-copies.json` fails the build when upstream changes it).
 */
export function providerModelLabel(selection: ModelSelection): string {
  const displayName =
    PROVIDER_DESCRIPTORS.find((descriptor) => descriptor.kind === selection.provider)
      ?.displayName ?? selection.provider;
  const summary = resolveThreadModelSummary(selection);
  const modelLabel = summary
    ? `${formatThreadModelSummaryLabel(summary)}${summary.fastMode ? " · Fast" : ""}`
    : selection.model;
  return `${displayName} · ${modelLabel}`;
}

/** What assistive tech reads for one side: upstream's button text, in its reading order. */
function endpointAccessibleText(selection: ModelSelection): string {
  const summary = resolveThreadModelSummary(selection);
  return [
    summary?.modelLabel ?? selection.model,
    summary?.fastMode ? "Fast mode" : null,
    summary?.statusLabel ?? null,
  ]
    .filter((part): part is string => part !== null)
    .join(" ");
}

export function resolveProviderHandoffDividerLabel(info: ProviderHandoffInfo): string {
  return [
    info.status === "failed" ? "Handoff failed" : "Context handoff",
    endpointAccessibleText(info.sourceModelSelection),
    endpointAccessibleText(info.targetModelSelection),
  ].join(" ");
}

// Same reading order as the composer's model trigger: provider glyph, model name,
// fast-mode bolt, then the effort label.
function HandoffEndpoint(props: {
  readonly selection: ModelSelection;
  readonly tone: "muted" | "target" | "failed";
  readonly struck?: boolean;
}) {
  const { semanticIconColor } = useTheme();
  const summary = resolveThreadModelSummary(props.selection);
  return (
    <view
      className={`ProviderHandoffEndpoint ProviderHandoffEndpoint--${props.tone}${
        props.struck ? " ProviderHandoffEndpoint--struck" : ""
      }`}
    >
      <OpenAIProviderIcon provider={props.selection.provider} />
      <text className="ProviderHandoffEndpointModel" text-maxline="1">
        {summary?.modelLabel ?? props.selection.model}
      </text>
      {summary?.fastMode ? (
        <svg
          className="ProviderHandoffEndpointFast"
          content={colorizeLynxSvg(fastModeSvg, semanticIconColor("secondary"))}
        />
      ) : null}
      {summary?.statusLabel ? (
        <text className="ProviderHandoffEndpointStatus">{summary.statusLabel}</text>
      ) : null}
    </view>
  );
}

export function ProviderHandoffDetails(props: { readonly info: ProviderHandoffInfo }) {
  const { info } = props;
  const failed = info.status === "failed";
  const rows: ReadonlyArray<readonly [string, string]> = [
    ["From", providerModelLabel(info.sourceModelSelection)],
    ["To", providerModelLabel(info.targetModelSelection)],
    failed
      ? ["Error", info.failureDetail ?? "The session did not start."]
      : [
          "Context",
          info.contextText ? `${info.contextText.length.toLocaleString()} characters` : "None",
        ],
  ];
  return (
    <view className="ProviderHandoffDetails">
      <view className="ProviderHandoffDetailsCard">
        {rows.map(([term, value]) => (
          <view key={term} className="ProviderHandoffDetailsRow">
            <text className="ProviderHandoffDetailsTerm">{term}</text>
            <text className="ProviderHandoffDetailsValue">{value}</text>
          </view>
        ))}
      </view>
      {!failed && info.contextText ? (
        <view className="ProviderHandoffContextSection">
          <text className="ProviderHandoffContextTitle">Transferred context</text>
          <scroll-view className="ProviderHandoffContext" scroll-orientation="vertical">
            <text className="ProviderHandoffContextText">{info.contextText}</text>
          </scroll-view>
          <text className="ProviderHandoffContextNote">
            Sent ahead of your next message so the new model can continue this thread.
          </text>
        </view>
      ) : null}
    </view>
  );
}

export function ProviderHandoffDivider(props: { readonly info: ProviderHandoffInfo }) {
  const { info } = props;
  const [open, setOpen] = useState(false);
  const present = useLynxDisclosurePresence(open);
  const failed = info.status === "failed";
  const interaction = useLynxInteractiveState({
    baseClassName: `ProviderHandoffDividerButton${
      failed ? " ProviderHandoffDividerButton--failed" : ""
    }`,
    accessibleLabel: resolveProviderHandoffDividerLabel(info),
    accessibilityValue: open ? "Expanded" : "Collapsed",
    onActivate: () => setOpen((value) => !value),
  });
  return (
    <view className="ProviderHandoffDivider">
      <view className="ProviderHandoffDividerLine">
        <view className="ProviderHandoffDividerRule" />
        <view className={interaction.className} aria-expanded={open} {...interaction.eventProps}>
          {failed ? (
            <CircleAlertIcon
              className="ProviderHandoffDividerIcon"
              color="var(--destructive)"
              size={14}
            />
          ) : (
            <Hugeicon
              className="ProviderHandoffDividerIcon"
              color="var(--muted-foreground)"
              name="HandoffIcon"
              size={14}
            />
          )}
          <text className="ProviderHandoffDividerTitle">
            {failed ? "Handoff failed" : "Context handoff"}
          </text>
          <HandoffEndpoint
            selection={info.sourceModelSelection}
            tone={failed ? "failed" : "muted"}
          />
          <ArrowRightIcon
            className="ProviderHandoffDividerArrow"
            color={failed ? "var(--destructive)" : "var(--muted-foreground)"}
            size={12}
          />
          <HandoffEndpoint
            selection={info.targetModelSelection}
            struck={failed}
            tone={failed ? "failed" : "target"}
          />
        </view>
        <view className="ProviderHandoffDividerRule" />
      </view>
      {present ? (
        <view className={disclosureContentClassName(open, "ProviderHandoffDividerPanel")}>
          <ProviderHandoffDetails info={info} />
        </view>
      ) : null}
    </view>
  );
}
