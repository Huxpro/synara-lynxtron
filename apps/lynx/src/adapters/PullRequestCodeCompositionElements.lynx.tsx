import type { ReactNode } from "@lynx-js/react";

import {
  formatGitPathForDisplay,
  type PullRequestCodeSyntaxToken,
  type PullRequestDiffLineKind,
} from "@synara-web/components/pullRequest/pullRequestCode.logic";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { useTheme } from "./useTheme.lynx";
import { ChevronRightIcon } from "../lib/icons.lynx";
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from "../platform/motion.lynx";
import "./pull-request-code-composition-elements.css";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

type ChildrenProps = { readonly children?: ReactNode };

const DIFF_BUFFER_PATTERN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <path d="M-2 2L2-2M0 8L8 0M6 10L10 6" fill="none" stroke="currentColor" stroke-width="1"/>
</svg>`;

export function PullRequestCodeRootElement(props: ChildrenProps) {
  return <view className="SharedPrCodeRoot">{props.children}</view>;
}

export function PullRequestCodeNoticeElement(
  props: ChildrenProps & { readonly intent?: "warning" | "muted" },
) {
  return (
    <text
      className={`SharedPrCodeNotice${
        props.intent === "warning" ? " SharedPrCodeNotice--warning" : ""
      }`}
    >
      {props.children}
    </text>
  );
}

export function PullRequestCodeStatsElement(props: {
  readonly fileCount: number;
  readonly additions: number;
  readonly deletions: number;
}) {
  return (
    <view className="SharedPrCodeStats">
      <text className="SharedPrCodeStatsText">
        {props.fileCount} {props.fileCount === 1 ? "file" : "files"}
      </text>
      <text className="SharedPrCodeStatsAddition">+{props.additions}</text>
      <text className="SharedPrCodeStatsDeletion">-{props.deletions}</text>
    </view>
  );
}

export function PullRequestCodeFileElement(props: ChildrenProps & { readonly id?: string }) {
  return (
    <view id={props.id} className="SharedPrCodeFile">
      {props.children}
    </view>
  );
}

export function PullRequestCodeFileHeaderElement(props: {
  readonly path: string;
  readonly previousPath: string | null;
  readonly relation: "copied" | "renamed" | null;
  readonly additions: number;
  readonly deletions: number;
  readonly expanded: boolean;
  readonly pathPresentation?: "full" | "basename-first";
  readonly trailingActions?: ReactNode;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const path = formatGitPathForDisplay(props.path);
  const slash = path.lastIndexOf("/");
  const basename = slash === -1 ? path : path.slice(slash + 1);
  const directory = slash === -1 ? "" : path.slice(0, slash + 1);
  const previousPath = props.previousPath ? formatGitPathForDisplay(props.previousPath) : null;
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedPrCodeFileHeader",
    accessibleLabel: `${props.expanded ? "Collapse" : "Expand"} ${path}`,
    accessibilityValue: props.expanded ? "Expanded" : "Collapsed",
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-expanded={props.expanded}
      {...interaction.eventProps}
    >
      {props.pathPresentation === "basename-first" ? (
        <FileEntryIcon className="SharedPrCodeFileTypeIcon" pathValue={path} />
      ) : null}
      <view className="SharedPrCodeFileIdentity">
        <text className="SharedPrCodeFilePath">
          {props.pathPresentation === "basename-first" ? basename : path}
        </text>
        {props.pathPresentation === "basename-first" && directory ? (
          <text className="SharedPrCodeFileDirectory">{directory}</text>
        ) : null}
      </view>
      {previousPath ? (
        <text className="SharedPrCodeFilePrevious">
          {props.relation === "copied"
            ? "copied from"
            : props.relation === "renamed"
              ? "renamed from"
              : "from"}{" "}
          {previousPath}
        </text>
      ) : null}
      <text className="SharedPrCodeStatsAddition">+{props.additions}</text>
      <text className="SharedPrCodeStatsDeletion">-{props.deletions}</text>
      {props.trailingActions}
      <ChevronRightIcon
        className={disclosureChevronClassName(props.expanded, "SharedPrCodeFileChevron")}
        color={semanticIconColor("secondary")}
        size={10}
      />
    </view>
  );
}

export function PullRequestCodeDisclosureElement(
  props: ChildrenProps & { readonly expanded: boolean },
) {
  const present = useLynxDisclosurePresence(props.expanded);
  if (!present) return null;
  return (
    <view
      className={disclosureContentClassName(props.expanded, "SharedPrCodeDisclosure")}
      aria-hidden={!props.expanded}
    >
      {props.children}
    </view>
  );
}

export function PullRequestCodeLinesElement(props: ChildrenProps & { readonly wordWrap: boolean }) {
  if (props.wordWrap) {
    return (
      <view className="SharedPrCodeLines SharedPrCodeLines--wrap">
        <view className="SharedPrCodeLinesContent">{props.children}</view>
      </view>
    );
  }
  return (
    <scroll-view className="SharedPrCodeLines" scroll-orientation="horizontal">
      <view className="SharedPrCodeLinesContent">{props.children}</view>
    </scroll-view>
  );
}

export function PullRequestCodeLineElement(props: {
  readonly kind: PullRequestDiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly side?: "left" | "right";
  readonly syntaxTokens?: readonly PullRequestCodeSyntaxToken[];
  readonly text: string;
  readonly wordWrap: boolean;
}) {
  const { codeFontFamily } = useTheme();
  const prefix =
    props.kind === "addition"
      ? "+"
      : props.kind === "deletion"
        ? "-"
        : props.kind === "hunk"
          ? "@"
          : props.kind.startsWith("no-newline-")
            ? "\\"
            : " ";
  return (
    <view
      className={`SharedPrCodeLine SharedPrCodeLine--${props.kind}${
        props.wordWrap ? " SharedPrCodeLine--wrap" : ""
      }${props.side ? ` SharedPrCodeLine--split-${props.side}` : ""}`}
    >
      {props.side === "right" ? null : (
        <text className="SharedPrCodeLineNumber" style={{ fontFamily: codeFontFamily }}>
          {props.oldLine ?? ""}
        </text>
      )}
      {props.side === "left" ? null : (
        <text className="SharedPrCodeLineNumber" style={{ fontFamily: codeFontFamily }}>
          {props.newLine ?? ""}
        </text>
      )}
      {props.side ? null : (
        <text className="SharedPrCodeLinePrefix" style={{ fontFamily: codeFontFamily }}>
          {prefix}
        </text>
      )}
      <text className="SharedPrCodeLineText" style={{ fontFamily: codeFontFamily }}>
        {props.syntaxTokens?.length
          ? props.syntaxTokens.map((token, tokenIndex) => (
              <text
                key={`${tokenIndex}:${token.content}`}
                style={{
                  color: token.color,
                  ...(token.emphasized
                    ? {
                        backgroundColor:
                          props.kind === "addition"
                            ? "rgba(0, 162, 64, 0.2)"
                            : "rgba(224, 46, 42, 0.2)",
                        borderRadius: "3px",
                      }
                    : {}),
                  ...(token.fontStyle & 1 ? { fontStyle: "italic" } : {}),
                  ...(token.fontStyle & 2 ? { fontWeight: 700 } : {}),
                  ...(token.fontStyle & 4 ? { textDecoration: "underline" } : {}),
                }}
              >
                {token.content}
              </text>
            ))
          : props.text || " "}
      </text>
    </view>
  );
}

export function PullRequestCodeSplitRowElement(props: {
  readonly left?: ReactNode;
  readonly right?: ReactNode;
}) {
  const leftEmpty = !props.left;
  const rightEmpty = !props.right;
  return (
    <view className="SharedPrCodeSplitRow">
      <view
        className={`SharedPrCodeSplitSide SharedPrCodeSplitSide--left${
          leftEmpty ? " SharedPrCodeSplitSide--empty" : ""
        }`}
      >
        {props.left ?? (
          <view className="SharedPrCodeSplitBuffer">
            <svg className="SharedPrCodeSplitBufferPattern" content={DIFF_BUFFER_PATTERN_SVG} />
          </view>
        )}
      </view>
      <view className={`SharedPrCodeSplitSide${rightEmpty ? " SharedPrCodeSplitSide--empty" : ""}`}>
        {props.right ?? (
          <view className="SharedPrCodeSplitBuffer">
            <svg className="SharedPrCodeSplitBufferPattern" content={DIFF_BUFFER_PATTERN_SVG} />
          </view>
        )}
      </view>
    </view>
  );
}

export function PullRequestCodeMoreElement(props: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedPrCodeMore${props.disabled ? " SharedPrCodeMore--disabled" : ""}`,
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedPrCodeMoreText">{props.label}</text>
    </view>
  );
}
