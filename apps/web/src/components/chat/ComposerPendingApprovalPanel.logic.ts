import type { ProviderApprovalDecision } from "@synara/contracts";

import type { PendingApproval } from "../../pendingInteractionDerivation";

export type ParsedApproval = {
  tool: string | null;
  fileName: string | null;
  fileDir: string | null;
  command: string | null;
  fallback: string | null;
};

export type ApprovalActionTone = "neutral" | "primary" | "destructive";

export type ApprovalAction = {
  decision: ProviderApprovalDecision;
  label: string;
  description: string;
  tone: ApprovalActionTone;
};

export const APPROVAL_ACTIONS: ReadonlyArray<ApprovalAction> = [
  {
    decision: "accept",
    label: "Approve once",
    description: "Allow just this request",
    tone: "primary",
  },
  {
    decision: "acceptForSession",
    label: "Always allow this session",
    description: "Don't ask again this session",
    tone: "neutral",
  },
  {
    decision: "decline",
    label: "Decline",
    description: "Reject and let the agent continue",
    tone: "destructive",
  },
  {
    decision: "cancel",
    label: "Cancel turn",
    description: "Stop the current turn",
    tone: "neutral",
  },
];

export const APPROVAL_KIND_PROMPT: Record<PendingApproval["requestKind"], string> = {
  command: "Approve this command?",
  "file-read": "Approve reading this file?",
  "file-change": "Approve this file change?",
  permissions: "Grant these permissions?",
  tool: "Approve this tool call?",
};

export function parseApprovalDetail(detail: string | undefined): ParsedApproval {
  const empty: ParsedApproval = {
    tool: null,
    fileName: null,
    fileDir: null,
    command: null,
    fallback: null,
  };
  if (!detail || detail.length === 0) return empty;

  const colonIndex = detail.indexOf(": ");
  const tool = colonIndex === -1 ? null : detail.slice(0, colonIndex).trim() || null;
  const rawPayload = colonIndex === -1 ? detail : detail.slice(colonIndex + 2);
  const payload = stripTrailingEllipsis(rawPayload);

  const filePath =
    extractJsonString(payload, ["file_path", "path", "notebook_path", "filepath"]) ?? null;
  if (filePath) {
    const { name, parent } = splitPath(filePath);
    return { tool, fileName: name, fileDir: parent, command: null, fallback: null };
  }

  const command = extractJsonString(payload, ["command", "cmd"]) ?? null;
  if (command) {
    return {
      tool,
      fileName: null,
      fileDir: null,
      command: collapseWhitespace(command),
      fallback: null,
    };
  }

  const pattern = extractJsonString(payload, ["pattern", "query"]);
  if (pattern) {
    return {
      tool,
      fileName: null,
      fileDir: null,
      command: pattern,
      fallback: null,
    };
  }

  const url = extractJsonString(payload, ["url"]);
  if (url) {
    return { tool, fileName: null, fileDir: null, command: url, fallback: null };
  }

  const fallback = collapseWhitespace(payload);
  return {
    tool,
    fileName: null,
    fileDir: null,
    command: null,
    fallback: fallback.length > 0 ? fallback : null,
  };
}

export function shortenApprovalPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const homeMatch = normalized.match(/^\/(?:Users|home)\/[^/]+(?=\/|$)/);
  const withoutHome = homeMatch ? `~${normalized.slice(homeMatch[0].length)}` : normalized;
  const segments = withoutHome.split("/").filter((segment) => segment.length > 0);
  if (segments.length <= 3) return withoutHome;
  const leading = withoutHome.startsWith("~") ? "~" : "";
  const tail = segments.slice(-2).join("/");
  return `${leading}/…/${tail}`.replace(/^\/…/, "…");
}

function extractJsonString(payload: string, keys: ReadonlyArray<string>): string | null {
  const parsed = tryParseJson(payload);
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
  }

  for (const key of keys) {
    const value = regexExtractString(payload, key);
    if (value && value.length > 0) return value;
  }
  return null;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function regexExtractString(payload: string, key: string): string | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`"${escapedKey}"\\s*:\\s*"`, "g");
  const match = pattern.exec(payload);
  if (!match) return null;

  const start = match.index + match[0].length;
  let output = "";
  for (let index = start; index < payload.length; index += 1) {
    const character = payload[index];
    if (character === "\\") {
      const next = payload[index + 1];
      if (next === undefined) break;
      if (next === "n") output += "\n";
      else if (next === "t") output += "\t";
      else if (next === "r") output += "\r";
      else output += next;
      index += 1;
      continue;
    }
    if (character === '"') return output;
    output += character;
  }
  return output.length > 0 ? output : null;
}

function stripTrailingEllipsis(value: string): string {
  return value.replace(/\.{3}$/u, "").replace(/…$/u, "");
}

function splitPath(path: string): { name: string; parent: string | null } {
  const normalized = path.replace(/\\/g, "/");
  const trimmed = normalized.replace(/\/+$/, "");
  const lastSeparator = trimmed.lastIndexOf("/");
  if (lastSeparator === -1) return { name: trimmed, parent: null };
  return {
    name: trimmed.slice(lastSeparator + 1) || trimmed,
    parent: trimmed.slice(0, lastSeparator) || null,
  };
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
