import { getAppTypographyScale } from "@synara-web/lib/appTypography";
import { useState } from "@lynx-js/react";
import { formatPastedTextCountLabel, pastedTextTitle } from "@synara-web/lib/composerPastedText";
import {
  formatBrowserAnnotationLabel,
  type BrowserAnnotationDraft,
} from "@synara-web/lib/browserAnnotations";
import type { ParsedPullRequestContextEntry } from "@synara-web/lib/pullRequestContext";
import { ReferenceAttachmentCard } from "../adapters/ReferenceAttachmentCard.lynx";
import {
  ComposerAssistantSelectionsAttachmentElement,
  ComposerFileCommentsAttachmentElement,
} from "../adapters/ComposerReferenceAttachmentsCompositionElements.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { CircleAlertIcon, FileIcon } from "../lib/icons.lynx";
import { Hugeicon } from "../lib/hugeicons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import bubbleSvg from "@synara-central-icons/bubble-text.svg?raw";
import hammerSvg from "@synara-central-icons/hammer.svg?raw";
import issueSvg from "@synara-central-icons/record.svg?raw";
import { Tooltip, TooltipTrigger, TooltipPopup } from "../components/ui/tooltip.lynx";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "../components/ui/menu.lynx";
import { ScrollArea } from "../components/ui/scroll-area.lynx";
import {
  MAX_VISIBLE_BROWSER_ANNOTATIONS,
  USER_CONTEXT_SCOPE_ICONS,
} from "../generated/userMessageCards.generated";
import type { resolveTranscriptUserMessage } from "./transcriptUserMessage.logic";
import "./transcript-user-contexts.css";

type UserDisplay = ReturnType<typeof resolveTranscriptUserMessage>;
function ContextPrompt(props: { readonly text: string; readonly fontSizePx: number }) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const height = Math.min(
    320,
    (contentHeight ??
      props.text.split("\n").length * getAppTypographyScale(props.fontSizePx).uiSmPx * 1.375) + 18,
  );
  return (
    <ScrollArea className="TranscriptContextPrompt" style={{ height }}>
      <view
        bindlayoutchange={(event: { readonly detail?: { readonly height?: number } }) => {
          "background only";
          const next = event.detail?.height;
          if (typeof next === "number" && next > 0)
            setContentHeight((previous) =>
              previous !== null && Math.abs(previous - next) < 0.5 ? previous : next,
            );
        }}
      >
        <text className="TranscriptContextPromptText">{props.text}</text>
      </view>
    </ScrollArea>
  );
}
function PastedTextCard(props: {
  readonly text: string;
  readonly lineCount: number;
  readonly charCount: number;
  readonly fontSizePx: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = `${expanded ? "Hide" : "Show"} text · ${formatPastedTextCountLabel(props)}`;
  const action = useLynxInteractiveState({
    baseClassName: "ComposerReferenceCardActionLynx",
    accessibleLabel: label,
    onActivate: () => setExpanded(!expanded),
  });
  return (
    <view className="TranscriptContextAttachment">
      <ReferenceAttachmentCard
        className="TranscriptPastedTextCard"
        icon={<FileIcon size={12} />}
        title={pastedTextTitle(props.text)}
        subtitle={
          <view className={action.className} {...action.eventProps}>
            <text className="ComposerReferenceCardActionTextLynx">{label}</text>
          </view>
        }
      />
      {expanded ? <ContextPrompt text={props.text} fontSizePx={props.fontSizePx} /> : null}
    </view>
  );
}
function PullRequestIcon(props: { readonly context: ParsedPullRequestContextEntry }) {
  const { semanticIconColor } = useTheme();
  const name = USER_CONTEXT_SCOPE_ICONS[props.context.scope];
  if (props.context.itemKind === "issue" || name === "ChatBubbleIcon" || name === "HammerIcon")
    return (
      <svg
        style={{ width: 16, height: 16 }}
        content={colorizeLynxSvg(
          props.context.itemKind === "issue"
            ? issueSvg
            : name === "ChatBubbleIcon"
              ? bubbleSvg
              : hammerSvg,
          semanticIconColor("secondary"),
        )}
      />
    );
  if (name === "CircleAlertIcon") return <CircleAlertIcon size={16} />;
  return <Hugeicon name={name} size={16} />;
}
function PullRequestCard({
  context,
  fontSizePx,
}: {
  readonly context: ParsedPullRequestContextEntry;
  readonly fontSizePx: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const action = useLynxInteractiveState({
    baseClassName: "TranscriptPullRequestTrigger",
    accessibleLabel: expanded ? "Hide the prompt this card sent" : "Show the prompt this card sent",
    onActivate: () => setExpanded(!expanded),
  });
  return (
    <view className="TranscriptContextAttachment">
      <view className={action.className} {...action.eventProps}>
        <ReferenceAttachmentCard
          className="TranscriptPullRequestCard"
          icon={<PullRequestIcon context={context} />}
          title={context.title}
          subtitle={
            context.subtitle ? (
              <text className="ComposerReferenceCardMetaLynx" text-maxline="1">
                {context.subtitle}
              </text>
            ) : null
          }
        />
      </view>
      {expanded ? <ContextPrompt text={context.text} fontSizePx={fontSizePx} /> : null}
    </view>
  );
}
function AnnotationChip({ annotation }: { readonly annotation: BrowserAnnotationDraft }) {
  const label = formatBrowserAnnotationLabel(annotation),
    page = annotation.source.pageTitle || annotation.source.url;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <view
            className="TranscriptBrowserAnnotation"
            accessibility-element
            accessibility-label={`Browser annotation ${annotation.ordinal}: ${label}, ${page}`}
          >
            <text className="TranscriptBrowserAnnotationOrdinal">#{annotation.ordinal}</text>
            <text className="TranscriptBrowserAnnotationLabel" text-maxline="1">
              {label}
            </text>
          </view>
        }
      />
      <TooltipPopup side="top">{`#${annotation.ordinal} · ${label}\n${page}\n${annotation.selector}`}</TooltipPopup>
    </Tooltip>
  );
}
export function TranscriptUserContexts({
  display,
  fontSizePx,
}: {
  readonly display: UserDisplay;
  readonly fontSizePx: number;
}) {
  const state = display.displayed,
    visible = state.browserAnnotations.slice(0, MAX_VISIBLE_BROWSER_ANNOTATIONS),
    hidden = state.browserAnnotations.slice(MAX_VISIBLE_BROWSER_ANNOTATIONS);
  return (
    <>
      {display.assistantSelections.length ? (
        <view className="TranscriptReferenceSummary">
          <ComposerAssistantSelectionsAttachmentElement selections={display.assistantSelections} />
        </view>
      ) : null}
      {visible.length ? (
        <view className="TranscriptBrowserAnnotationStrip">
          {visible.map((a) => (
            <AnnotationChip key={a.id} annotation={a} />
          ))}
          {hidden.length ? (
            <Menu>
              <MenuTrigger
                ariaLabel={`Show ${hidden.length} more browser annotation${hidden.length === 1 ? "" : "s"}`}
              >
                <text>
                  +{hidden.length} other{hidden.length === 1 ? "" : "s"}
                </text>
              </MenuTrigger>
              <MenuPopup align="end">
                {hidden.map((a) => (
                  <MenuItem key={a.id}>{formatBrowserAnnotationLabel(a)}</MenuItem>
                ))}
              </MenuPopup>
            </Menu>
          ) : null}
        </view>
      ) : null}
      {state.fileComments.length ? (
        <view className="TranscriptReferenceSummary">
          <ComposerFileCommentsAttachmentElement comments={state.fileComments} />
        </view>
      ) : null}
      {state.pastedTexts.length ? (
        <view className="TranscriptContextAttachments">
          {state.pastedTexts.map((p) => (
            <PastedTextCard key={p.index} {...p} fontSizePx={fontSizePx} />
          ))}
        </view>
      ) : null}
      {state.pullRequestContexts.length ? (
        <view className="TranscriptContextAttachments">
          {state.pullRequestContexts.map((c) => (
            <PullRequestCard key={c.index} context={c} fontSizePx={fontSizePx} />
          ))}
        </view>
      ) : null}
    </>
  );
}
