// Transcript rows that are cards rather than text: a sent message's
// attachments, an answered agent question, the proposed plan and a turn's
// changed files. Upstream draws these inside `MessagesTimeline.tsx` and
// `ProposedPlanCard.tsx` (DOM); the anatomy and metrics here follow those.

import { useEffect, useState } from "@lynx-js/react";
import { formatClockElapsed } from "@synara-web/session-logic";
import type { WorkLogUserInputExchangeItem } from "@synara-web/workLog";
import {
  getChatMessageFooterTextStyle,
  getChatTranscriptTextStyle,
  getChatTranscriptUserMessageTextStyle,
} from "@synara-web/components/chat/chatTypography";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { ChatMarkdown } from "../components/markdown/ChatMarkdown";
import type { MarkdownNode } from "../components/markdown/markdownAst.lynx";
import { FileIcon } from "../lib/icons.lynx";
import type {
  ProposedPlanCardPresentation,
  TurnChangedFilesPresentation,
  UserMessageAttachmentsPresentation,
} from "./transcriptRowCards.logic";

import "./transcript-row-cards.css";

type TextStyle = Record<string, string>;

/**
 * The running turn's header: the settled "Worked for 12s" line's twin, not
 * collapsible and counting up, over the same full-width divider.
 */
export function TranscriptWorkingHeader(props: { readonly startedAt: string }) {
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  useEffect(() => {
    "background only";
    const timer = setInterval(() => setNowIso(new Date().toISOString()), 1_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <view className="TranscriptWorkingHeader">
      <text className="TranscriptWorkingHeaderLabel">
        {`Working for ${formatClockElapsed(props.startedAt, nowIso) ?? "0s"}`}
      </text>
      <view className="TranscriptWorkingHeaderDivider" />
    </view>
  );
}

/** File pills and image thumbnails above a sent message's bubble. */
export function TranscriptUserAttachments(props: {
  readonly attachments: UserMessageAttachmentsPresentation;
  readonly hasText: boolean;
}) {
  const { files, images } = props.attachments;
  return (
    <>
      {files.length > 0 ? (
        <view className="TranscriptUserFiles">
          {files.map((file) => (
            <view
              className="TranscriptUserFileChip"
              key={file.id}
              accessibility-element
              accessibility-label={`${file.name}, ${file.sizeLabel}`}
            >
              <FileIcon
                className="TranscriptUserFileChipIcon"
                color="var(--muted-foreground)"
                size={14}
              />
              <text className="TranscriptUserFileChipName" text-maxline="1">
                {file.name}
              </text>
              <text className="TranscriptUserFileChipSize">{file.sizeLabel}</text>
            </view>
          ))}
        </view>
      ) : null}
      {images.length > 0 ? (
        <view
          className={`TranscriptUserImages${props.hasText ? " TranscriptUserImages--before-text" : ""}`}
        >
          {images.map((image) => (
            <view
              className="TranscriptUserImage"
              key={image.id}
              accessibility-element
              accessibility-label={image.name}
            >
              {image.previewUrl ? (
                <image
                  className="TranscriptUserImagePreview"
                  mode="aspectFill"
                  src={image.previewUrl}
                />
              ) : (
                <FileEntryIcon className="TranscriptUserImageIcon" pathValue={image.name} />
              )}
            </view>
          ))}
        </view>
      ) : null}
    </>
  );
}

/** An answered agent question: the question on the left, the answer on the right. */
export function TranscriptUserInputExchange(props: {
  readonly chatFontSizePx: number;
  readonly items: ReadonlyArray<WorkLogUserInputExchangeItem>;
}) {
  const labelStyle = getChatMessageFooterTextStyle(props.chatFontSizePx) as TextStyle;
  const questionStyle = getChatTranscriptTextStyle(props.chatFontSizePx) as TextStyle;
  const answerStyle = getChatTranscriptUserMessageTextStyle(props.chatFontSizePx) as TextStyle;
  return (
    <view className="TranscriptUserInputExchange">
      {props.items.map((item) => (
        <view className="TranscriptUserInputExchangeItem" key={item.id}>
          <view className="TranscriptUserInputBubble TranscriptUserInputBubble--question">
            <text className="TranscriptUserInputLabel" style={labelStyle}>
              {item.header}
            </text>
            <text className="TranscriptUserInputText" style={questionStyle}>
              {item.question}
            </text>
            {item.options.length > 0 ? (
              <text className="TranscriptUserInputLabel" style={labelStyle}>
                {item.options.join(" · ")}
              </text>
            ) : null}
          </view>
          <view className="TranscriptUserInputBubble TranscriptUserInputBubble--answer">
            <text className="TranscriptUserInputLabel" style={labelStyle}>
              Answer
            </text>
            <text className="TranscriptUserInputText" style={answerStyle}>
              {item.answer ?? "No answer"}
            </text>
          </view>
        </view>
      ))}
    </view>
  );
}

/** The proposed plan: badge, title and the plan's markdown; long plans start collapsed. */
export function TranscriptProposedPlanCard(props: {
  readonly chatFontSizePx: number;
  readonly collapsedPreviewTree?: MarkdownNode | null | undefined;
  readonly displayedTree?: MarkdownNode | null | undefined;
  readonly onOpenFileReference?: ((relativePath: string) => void) | undefined;
  readonly plan: ProposedPlanCardPresentation;
  readonly workspaceRoot: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = props.plan.collapsedPreviewMarkdown !== null;
  const collapsed = canCollapse && !expanded;
  const toggle = useLynxInteractiveState({
    baseClassName: "TranscriptPlanToggle",
    accessibleLabel: expanded ? "Collapse plan" : "Expand plan",
    onActivate: () => setExpanded((current) => !current),
  });
  return (
    <view className="TranscriptPlanCard">
      <view className="TranscriptPlanHeader">
        <view className="TranscriptPlanBadge">
          <text className="TranscriptPlanBadgeText">Plan</text>
        </view>
        <text className="TranscriptPlanTitle" text-maxline="1">
          {props.plan.title}
        </text>
      </view>
      <view
        className="TranscriptPlanBody"
        style={getChatTranscriptTextStyle(props.chatFontSizePx) as TextStyle}
      >
        {collapsed ? (
          <ChatMarkdown
            cwd={props.workspaceRoot}
            key="collapsed"
            onOpenFileReference={props.onOpenFileReference}
            preparsedTree={props.collapsedPreviewTree}
            text={props.plan.collapsedPreviewMarkdown ?? ""}
          />
        ) : (
          <ChatMarkdown
            cwd={props.workspaceRoot}
            key="full"
            onOpenFileReference={props.onOpenFileReference}
            preparsedTree={props.displayedTree}
            text={props.plan.displayedMarkdown}
          />
        )}
      </view>
      {canCollapse ? (
        <view className="TranscriptPlanFooter">
          <view className={toggle.className} {...toggle.eventProps}>
            <text className="TranscriptPlanToggleText">
              {expanded ? "Collapse plan" : "Expand plan"}
            </text>
          </view>
        </view>
      ) : null}
    </view>
  );
}

/** The end-of-turn changes card: totals, Review, and one row per changed file. */
export function TranscriptTurnChangedFiles(props: {
  readonly changes: TurnChangedFilesPresentation;
  readonly onReview?: (() => void) | undefined;
}) {
  const review = useLynxInteractiveState({
    baseClassName: "TranscriptTurnChangesReview",
    accessibleLabel: "Review changes",
    disabled: !props.onReview,
    onActivate: props.onReview,
  });
  return (
    <view className="TranscriptTurnChangesCard">
      <view className="TranscriptTurnChangesHeader">
        <view className="TranscriptTurnChangesSummary">
          <text className="TranscriptTurnChangesLabel" text-maxline="1">
            {props.changes.label}
          </text>
          <text className="TranscriptTurnChangesStats">
            <text className="TranscriptTurnChangesAdditions">{`+${props.changes.additions}`}</text>{" "}
            <text className="TranscriptTurnChangesDeletions">{`-${props.changes.deletions}`}</text>
          </text>
        </view>
        <view className={review.className} {...review.eventProps}>
          <text className="TranscriptTurnChangesReviewText">Review</text>
        </view>
      </view>
      {props.changes.files.map((file, index) => (
        <TranscriptTurnChangedFileRow
          file={file}
          key={file.path}
          last={index === props.changes.files.length - 1}
          onReview={props.onReview}
        />
      ))}
    </view>
  );
}

function TranscriptTurnChangedFileRow(props: {
  readonly file: TurnChangedFilesPresentation["files"][number];
  readonly last: boolean;
  readonly onReview?: (() => void) | undefined;
}) {
  const row = useLynxInteractiveState({
    baseClassName: `TranscriptTurnChangesFile${props.last ? " TranscriptTurnChangesFile--last" : ""}`,
    accessibleLabel: `Review ${props.file.path}`,
    disabled: !props.onReview,
    onActivate: props.onReview,
  });
  return (
    <view className={row.className} {...row.eventProps}>
      <FileEntryIcon className="TranscriptTurnChangesFileIcon" pathValue={props.file.path} />
      <text className="TranscriptTurnChangesFilePath" text-maxline="1">
        {props.file.path}
      </text>
      <text className="TranscriptTurnChangesStats">
        <text className="TranscriptTurnChangesAdditions">{`+${props.file.additions}`}</text>{" "}
        <text className="TranscriptTurnChangesDeletions">{`-${props.file.deletions}`}</text>
      </text>
    </view>
  );
}
