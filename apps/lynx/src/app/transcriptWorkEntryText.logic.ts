// The sentence a tool row shows ("Ran ./scripts/release.sh", "Read math.ts").
//
// Upstream builds it inside its DOM row component
// (`workEntryDisplayParts` in `components/chat/TimelineWorkEntryRow.tsx`), which
// Lynx cannot import. The rules below are that function's, in the same order,
// over the same upstream helpers; only the wiring exists twice.

import {
  formatAgentActivityEntryPreview,
  isReasoningUpdateWorkEntry,
} from "@synara-web/components/chat/agentActivity.logic";
import { normalizeCompactToolLabel } from "@synara-web/components/chat/MessagesTimeline.logic";
import { basenameOfPath } from "@synara-web/file-icons";
import {
  computerToolName,
  describeComputerToolCall,
} from "@synara-web/lib/computerToolPresentation";
import { formatLiveActivityMeta } from "@synara-web/lib/liveActivityPresentation";
import {
  extractToolArgumentField,
  isPrefixedToolArgumentSummary,
} from "@synara-web/lib/toolArgumentSummary";
import {
  deriveFriendlyCommandTarget,
  deriveSynaraMcpToolTitle,
  extractWebFetchUrl,
  isGenericToolTitle,
  isSynaraBrowserToolCall,
  normalizeToolTextForComparison,
  sanitizeSynaraMcpToolPreview,
  type SynaraMcpToolStatus,
} from "@synara-web/lib/toolCallLabel";
import type { WorkLogEntry } from "@synara-web/session-logic";

function toolStatus(entry: WorkLogEntry): SynaraMcpToolStatus {
  if (entry.toolStatus) return entry.toolStatus;
  return entry.activityKind !== undefined && entry.activityKind !== "tool.completed"
    ? "running"
    : "completed";
}

function synaraToolInput(entry: WorkLogEntry) {
  return {
    toolName: entry.toolName,
    title: entry.toolTitle,
    fallbackLabel: entry.label,
    status: toolStatus(entry),
  };
}

function capitalizePhrase(value: string): string {
  const trimmed = value.trim();
  return trimmed.length === 0 ? value : `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function extractFilePathFromDetail(detail: string): string | null {
  const plainPathMatch = /^(.+?\.[A-Za-z0-9][A-Za-z0-9._-]*)(?::\d+)?(?::\d+)?$/u.exec(
    detail.trim(),
  );
  if (plainPathMatch?.[1]?.includes("/")) return plainPathMatch[1].trim();
  return extractToolArgumentField(detail, ["file_path", "filePath", "path", "filename"], {
    fallbackScan: "whenUnparsed",
  });
}

function workEntryHeading(entry: WorkLogEntry): string {
  if (computerToolName(entry.toolName)) {
    const title = normalizeCompactToolLabel(entry.toolTitle ?? "");
    if (title && !isGenericToolTitle(title) && !computerToolName(title)) {
      return capitalizePhrase(title);
    }
    return describeComputerToolCall({ toolName: entry.toolName, args: undefined })!.summary;
  }
  if (entry.activityKind === "turn.tasks.updated") return capitalizePhrase(entry.label);
  const synaraTitle = deriveSynaraMcpToolTitle(synaraToolInput(entry));
  if (synaraTitle) return synaraTitle;
  return capitalizePhrase(normalizeCompactToolLabel(entry.toolTitle ?? entry.label));
}

function workEntryPreview(entry: WorkLogEntry): string | null {
  if (isReasoningUpdateWorkEntry(entry)) return formatAgentActivityEntryPreview(entry);
  const isFileRelated =
    entry.requestKind === "file-read" ||
    entry.requestKind === "file-change" ||
    entry.itemType === "file_change";
  if (entry.itemType === "command_execution" || entry.command || entry.rawCommand) {
    const command = entry.command ?? entry.rawCommand;
    if (command) return deriveFriendlyCommandTarget(command);
  }
  if (entry.preview) return entry.preview;
  if (entry.changedFiles && entry.changedFiles.length > 0) {
    const names = entry.changedFiles.map((path) => basenameOfPath(path));
    return names.length === 1 ? names[0]! : `${names.length} files`;
  }
  if (entry.itemType === "collab_agent_tool_call") {
    return entry.detail ?? entry.subagentAction?.prompt ?? null;
  }
  if (!entry.detail) return null;
  const filePath = extractFilePathFromDetail(entry.detail);
  if (filePath) return basenameOfPath(filePath);
  if (isFileRelated) return null;
  const detail = entry.detail.trim();
  if (detail.startsWith("{") || detail.startsWith("[")) return null;
  if (toolStatus(entry) !== "failed" && isPrefixedToolArgumentSummary(detail)) return null;
  const readLines = /^Read\s+(\d+\s+lines?)$/i.exec(detail);
  return readLines?.[1] ?? detail;
}

function isGitHubMcpToolCall(entry: WorkLogEntry): boolean {
  return Boolean(entry.toolName?.trim().toLowerCase().startsWith("mcp__codex_apps__github"));
}

/** Upstream's `workEntryDisplayText`: the tool's verb plus what it acted on. */
export function workEntryDisplayText(entry: WorkLogEntry): string {
  const webFetchUrl = extractWebFetchUrl(entry);
  // Upstream shows the link chip's label here (`describeLinkChip`); that module
  // is not loaded by Lynx, so the address itself is shown.
  if (webFetchUrl) return webFetchUrl;
  const heading = workEntryHeading(entry);
  const rawPreview = workEntryPreview(entry);
  const preview =
    !isGitHubMcpToolCall(entry) &&
    (isSynaraBrowserToolCall(synaraToolInput(entry)) ||
      deriveSynaraMcpToolTitle(synaraToolInput(entry)) !== null)
      ? sanitizeSynaraMcpToolPreview({ preview: rawPreview, heading, status: toolStatus(entry) })
      : rawPreview;
  if ((isReasoningUpdateWorkEntry(entry) || entry.activityKind === "tool.summary") && preview) {
    return preview;
  }
  if (!preview) return heading;
  return normalizeToolTextForComparison(heading) === normalizeToolTextForComparison(preview)
    ? heading
    : `${heading} ${preview}`;
}

/**
 * The row's trailing state ("Failed · 2s elapsed"), which upstream appends to
 * a tool row that is not simply completed. `null` for a completed row.
 */
export function workEntryLiveActivityMeta(entry: WorkLogEntry, nowMs: number): string | null {
  return entry.liveActivity
    ? formatLiveActivityMeta(entry.liveActivity, nowMs, {
        subagent: entry.itemType === "collab_agent_tool_call",
      })
    : null;
}
