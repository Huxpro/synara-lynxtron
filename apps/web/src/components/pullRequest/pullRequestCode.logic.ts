// Shared pull-request diff projection. Web keeps the canonical @pierre parser;
// Native consumes this JSON-shaped model through a small Lynx presentation island.

import {
  buildFileDiffRenderKey,
  getRenderablePatch,
  resolveFileDiffPath,
  sortFileDiffsByPath,
  summarizeFileDiffStats,
  summarizeRenderablePatchStats,
  type RenderablePatch,
} from "~/lib/diffRendering";

export type PullRequestDiffLineKind =
  | "hunk"
  | "context"
  | "addition"
  | "deletion"
  | "no-newline-addition"
  | "no-newline-deletion"
  | "no-newline-context";

export interface PullRequestDiffLineView {
  readonly id: string;
  readonly kind: PullRequestDiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly text: string;
}

export interface PullRequestDiffFileView {
  readonly key: string;
  readonly path: string;
  readonly previousPath: string | null;
  readonly additions: number;
  readonly deletions: number;
  readonly binary: boolean;
  readonly modeChange: {
    readonly previous: string;
    readonly next: string;
  } | null;
  readonly lifecycle: "added" | "deleted" | null;
  readonly lines: readonly PullRequestDiffLineView[];
}

export type PullRequestCodeView =
  | { readonly kind: "empty" }
  | {
      readonly kind: "raw";
      readonly reason: string;
      readonly lines: readonly PullRequestDiffLineView[];
    }
  | {
      readonly kind: "files";
      readonly additions: number;
      readonly deletions: number;
      readonly files: readonly PullRequestDiffFileView[];
    };

// `gh pr diff --patch` returns an mbox-style envelope before the first unified
// diff. Pierre intentionally parses unified patches, so keep the original text
// for copy operations but project the render model from the first file marker.
function unifiedDiffBody(patch: string | undefined): string | undefined {
  if (!patch) return patch;
  const marker = "diff --git ";
  if (patch.startsWith(marker)) return patch;
  const markerIndex = patch.indexOf(`\n${marker}`);
  return markerIndex === -1 ? patch : patch.slice(markerIndex + 1);
}

export function buildPullRequestParsedCodeModel(
  patch: string | undefined,
  cacheScope = "pull-request:code",
) {
  const renderablePatch = getRenderablePatch(unifiedDiffBody(patch), cacheScope);
  const renderableFiles =
    renderablePatch?.kind === "files" ? sortFileDiffsByPath(renderablePatch.files) : [];
  return {
    renderablePatch,
    renderableFiles,
    patchTotals: summarizeRenderablePatchStats(renderablePatch),
  };
}

function lineId(fileKey: string, kind: PullRequestDiffLineKind, index: number): string {
  return `${fileKey}:${kind}:${index}`;
}

// @pierre keeps the separator and the following patch prefix on individual
// parsed line strings. Its DOM renderer consumes that framing internally; the
// portable row model must remove it without trimming meaningful code spaces.
function portableLineText(text: string): string {
  return text.replace(/\r?\n[ +\-]?$/, "");
}

interface NoNewlineMarker {
  readonly afterKind: "addition" | "deletion" | "context";
  readonly afterIndex: number;
}

function noNewlineMarkers(
  patch: string | undefined,
): ReadonlyMap<string, readonly NoNewlineMarker[]> {
  const body = unifiedDiffBody(patch);
  if (!body) return new Map();
  const markers = new Map<string, NoNewlineMarker[]>();
  let currentPath: string | null = null;
  let inHunk = false;
  let additionIndex = 0;
  let deletionIndex = 0;
  let contextIndex = 0;
  let previousKind: "addition" | "deletion" | "context" | null = null;
  for (const line of body.split(/\r?\n/)) {
    const fileMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (fileMatch) {
      currentPath = stripGitPathPrefix(fileMatch[2] ?? "");
      inHunk = false;
      additionIndex = 0;
      deletionIndex = 0;
      contextIndex = 0;
      previousKind = null;
      continue;
    }
    if (/^@@ /.test(line)) {
      inHunk = true;
      previousKind = null;
      continue;
    }
    if (!currentPath || !inHunk) continue;
    if (line.startsWith("+")) {
      additionIndex += 1;
      previousKind = "addition";
      continue;
    }
    if (line.startsWith("-")) {
      deletionIndex += 1;
      previousKind = "deletion";
      continue;
    }
    if (line.startsWith(" ")) {
      contextIndex += 1;
      previousKind = "context";
      continue;
    }
    if (line === "\\ No newline at end of file" && previousKind) {
      const currentMarkers = markers.get(currentPath) ?? [];
      currentMarkers.push({
        afterKind: previousKind,
        afterIndex:
          previousKind === "addition"
            ? additionIndex
            : previousKind === "deletion"
              ? deletionIndex
              : contextIndex,
      });
      markers.set(currentPath, currentMarkers);
    }
    previousKind = null;
  }
  return markers;
}

function projectFileLines(
  file: Extract<RenderablePatch, { kind: "files" }>['files'][number],
  markers: readonly NoNewlineMarker[],
) {
  const fileKey = buildFileDiffRenderKey(file);
  const lines: PullRequestDiffLineView[] = [];
  const markerKeys = new Set(
    markers.map((marker) => `${marker.afterKind}:${marker.afterIndex}`),
  );
  let rowIndex = 0;
  let additionIndex = 0;
  let deletionIndex = 0;
  let contextIndex = 0;
  const appendNoNewlineMarker = (
    afterKind: "addition" | "deletion" | "context",
    afterIndex: number,
  ) => {
    if (!markerKeys.has(`${afterKind}:${afterIndex}`)) return;
    const kind: PullRequestDiffLineKind =
      afterKind === "addition"
        ? "no-newline-addition"
        : afterKind === "deletion"
          ? "no-newline-deletion"
          : "no-newline-context";
    lines.push({
      id: lineId(fileKey, kind, rowIndex++),
      kind,
      oldLine: null,
      newLine: null,
      text: "No newline at end of file",
    });
  };
  for (const hunk of file.hunks) {
    lines.push({
      id: lineId(fileKey, "hunk", rowIndex++),
      kind: "hunk",
      oldLine: null,
      newLine: null,
      text: portableLineText(
        hunk.hunkSpecs ?? `@@ -${hunk.deletionStart} +${hunk.additionStart} @@`,
      ),
    });
    let oldLine = hunk.deletionStart;
    let newLine = hunk.additionStart;
    for (const segment of hunk.hunkContent) {
      if (segment.type === "context") {
        for (let index = 0; index < segment.lines; index += 1) {
          contextIndex += 1;
          lines.push({
            id: lineId(fileKey, "context", rowIndex++),
            kind: "context",
            oldLine: oldLine++,
            newLine: newLine++,
            text: portableLineText(
              file.additionLines[segment.additionLineIndex + index] ??
              file.deletionLines[segment.deletionLineIndex + index] ??
              "",
            ),
          });
          appendNoNewlineMarker("context", contextIndex);
        }
        continue;
      }
      for (let index = 0; index < segment.deletions; index += 1) {
        deletionIndex += 1;
        lines.push({
          id: lineId(fileKey, "deletion", rowIndex++),
          kind: "deletion",
          oldLine: oldLine++,
          newLine: null,
          text: portableLineText(file.deletionLines[segment.deletionLineIndex + index] ?? ""),
        });
        appendNoNewlineMarker("deletion", deletionIndex);
      }
      for (let index = 0; index < segment.additions; index += 1) {
        additionIndex += 1;
        lines.push({
          id: lineId(fileKey, "addition", rowIndex++),
          kind: "addition",
          oldLine: null,
          newLine: newLine++,
          text: portableLineText(file.additionLines[segment.additionLineIndex + index] ?? ""),
        });
        appendNoNewlineMarker("addition", additionIndex);
      }
    }
  }
  return lines;
}

function stripGitPathPrefix(path: string): string {
  return path.startsWith("a/") || path.startsWith("b/") ? path.slice(2) : path;
}

function binaryFilePaths(patch: string | undefined): ReadonlySet<string> {
  const body = unifiedDiffBody(patch);
  if (!body) return new Set();
  const paths = new Set<string>();
  let currentPath: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const fileMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (fileMatch) {
      currentPath = stripGitPathPrefix(fileMatch[2] ?? "");
      continue;
    }
    if (currentPath && /^Binary files .+ and .+ differ$/.test(line)) {
      paths.add(currentPath);
    }
  }
  return paths;
}

function fileModeChanges(
  patch: string | undefined,
): ReadonlyMap<string, { readonly previous: string; readonly next: string }> {
  const body = unifiedDiffBody(patch);
  if (!body) return new Map();
  const changes = new Map<string, { previous: string; next: string }>();
  let currentPath: string | null = null;
  let previousMode: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const fileMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (fileMatch) {
      currentPath = stripGitPathPrefix(fileMatch[2] ?? "");
      previousMode = null;
      continue;
    }
    if (!currentPath) continue;
    const oldModeMatch = /^old mode (\d+)$/.exec(line);
    if (oldModeMatch) {
      previousMode = oldModeMatch[1] ?? null;
      continue;
    }
    const newModeMatch = /^new mode (\d+)$/.exec(line);
    if (newModeMatch && previousMode) {
      changes.set(currentPath, {
        previous: previousMode,
        next: newModeMatch[1] ?? "",
      });
    }
  }
  return changes;
}

function fileLifecycles(
  patch: string | undefined,
): ReadonlyMap<string, "added" | "deleted"> {
  const body = unifiedDiffBody(patch);
  if (!body) return new Map();
  const lifecycles = new Map<string, "added" | "deleted">();
  let currentPath: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const fileMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (fileMatch) {
      currentPath = stripGitPathPrefix(fileMatch[2] ?? "");
      continue;
    }
    if (!currentPath) continue;
    if (/^new file mode \d+$/.test(line)) {
      lifecycles.set(currentPath, "added");
      continue;
    }
    if (/^deleted file mode \d+$/.test(line)) {
      lifecycles.set(currentPath, "deleted");
    }
  }
  return lifecycles;
}

/**
 * Pure-string fallback for runtimes where @pierre's parser cannot project a
 * valid unified patch. It deliberately covers the portable model only; Web's
 * richer DOM renderer continues to use Pierre whenever it is available.
 */
export function buildPortableUnifiedDiffView(
  patch: string | undefined,
): Extract<PullRequestCodeView, { kind: "files" }> | null {
  const body = unifiedDiffBody(patch);
  if (!body) return null;
  const sourceLines = body.split(/\r?\n/);
  const files: PullRequestDiffFileView[] = [];
  let current:
    | {
        key: string;
        path: string;
        previousPath: string | null;
        additions: number;
        deletions: number;
        binary: boolean;
        modeChange: {
          previous: string;
          next: string;
        } | null;
        lifecycle: "added" | "deleted" | null;
        lines: PullRequestDiffLineView[];
        oldLine: number;
        newLine: number;
        inHunk: boolean;
      }
    | undefined;

  const finishCurrent = () => {
    if (!current) return;
    files.push({
      key: current.key,
      path: current.path,
      previousPath: current.previousPath,
      additions: current.additions,
      deletions: current.deletions,
      binary: current.binary,
      modeChange: current.modeChange,
      lifecycle: current.lifecycle,
      lines: current.lines,
    });
  };

  for (const line of sourceLines) {
    const fileMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (fileMatch) {
      finishCurrent();
      const previousPath = stripGitPathPrefix(fileMatch[1] ?? "");
      const path = stripGitPathPrefix(fileMatch[2] ?? "");
      current = {
        key: `portable:${previousPath}:${path}:${files.length}`,
        path,
        previousPath: previousPath !== path ? previousPath : null,
        additions: 0,
        deletions: 0,
        binary: false,
        modeChange: null,
        lifecycle: null,
        lines: [],
        oldLine: 0,
        newLine: 0,
        inHunk: false,
      };
      continue;
    }
    if (!current) continue;
    if (/^Binary files .+ and .+ differ$/.test(line)) {
      current.binary = true;
      continue;
    }
    const oldModeMatch = /^old mode (\d+)$/.exec(line);
    if (oldModeMatch) {
      current.modeChange = {
        previous: oldModeMatch[1] ?? "",
        next: "",
      };
      continue;
    }
    if (/^new file mode \d+$/.test(line)) {
      current.lifecycle = "added";
      continue;
    }
    if (/^deleted file mode \d+$/.test(line)) {
      current.lifecycle = "deleted";
      continue;
    }
    const newModeMatch = /^new mode (\d+)$/.exec(line);
    if (newModeMatch && current.modeChange) {
      current.modeChange = {
        previous: current.modeChange.previous,
        next: newModeMatch[1] ?? "",
      };
      continue;
    }
    const hunkMatch = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkMatch) {
      current.oldLine = Number(hunkMatch[1]);
      current.newLine = Number(hunkMatch[2]);
      current.inHunk = true;
      current.lines.push({
        id: lineId(current.key, "hunk", current.lines.length),
        kind: "hunk",
        oldLine: null,
        newLine: null,
        text: line,
      });
      continue;
    }
    if (!current.inHunk) continue;
    if (line === "\\ No newline at end of file") {
      const previousKind = current.lines.at(-1)?.kind;
      if (
        previousKind === "addition" ||
        previousKind === "deletion" ||
        previousKind === "context"
      ) {
        const kind: PullRequestDiffLineKind =
          previousKind === "addition"
            ? "no-newline-addition"
            : previousKind === "deletion"
              ? "no-newline-deletion"
              : "no-newline-context";
        current.lines.push({
          id: lineId(current.key, kind, current.lines.length),
          kind,
          oldLine: null,
          newLine: null,
          text: "No newline at end of file",
        });
      }
      continue;
    }
    if (line.startsWith("+")) {
      current.lines.push({
        id: lineId(current.key, "addition", current.lines.length),
        kind: "addition",
        oldLine: null,
        newLine: current.newLine++,
        text: line.slice(1),
      });
      current.additions += 1;
      continue;
    }
    if (line.startsWith("-")) {
      current.lines.push({
        id: lineId(current.key, "deletion", current.lines.length),
        kind: "deletion",
        oldLine: current.oldLine++,
        newLine: null,
        text: line.slice(1),
      });
      current.deletions += 1;
      continue;
    }
    if (line.startsWith(" ")) {
      current.lines.push({
        id: lineId(current.key, "context", current.lines.length),
        kind: "context",
        oldLine: current.oldLine++,
        newLine: current.newLine++,
        text: line.slice(1),
      });
    }
  }
  finishCurrent();
  if (files.length === 0) return null;
  files.sort((left, right) => left.path.localeCompare(right.path));
  return {
    kind: "files",
    additions: files.reduce((total, file) => total + file.additions, 0),
    deletions: files.reduce((total, file) => total + file.deletions, 0),
    files,
  };
}

export function buildPullRequestCodeView(
  patch: string | undefined,
  cacheScope = "pull-request:portable",
): PullRequestCodeView {
  const { renderablePatch: renderable, renderableFiles } =
    buildPullRequestParsedCodeModel(patch, cacheScope);
  if (!renderable) return { kind: "empty" };
  if (renderable.kind === "raw") {
    const portable = buildPortableUnifiedDiffView(patch);
    if (portable) return portable;
    return {
      kind: "raw",
      reason: renderable.reason,
      lines: renderable.text.split("\n").map((text, index) => ({
        id: `raw:${index}`,
        kind: "context" as const,
        oldLine: null,
        newLine: null,
        text,
      })),
    };
  }
  const binaryPaths = binaryFilePaths(patch);
  const modeChanges = fileModeChanges(patch);
  const lifecycles = fileLifecycles(patch);
  const eofMarkers = noNewlineMarkers(patch);
  const files = renderableFiles.map((file) => {
    const stats = summarizeFileDiffStats([file]);
    const path = resolveFileDiffPath(file);
    const previousPath = file.prevName ? resolveFileDiffPath({ ...file, name: file.prevName }) : null;
    return {
      key: buildFileDiffRenderKey(file),
      path,
      previousPath: previousPath && previousPath !== path ? previousPath : null,
      additions: stats.additions,
      deletions: stats.deletions,
      binary: binaryPaths.has(path),
      modeChange: modeChanges.get(path) ?? null,
      lifecycle: lifecycles.get(path) ?? null,
      lines: projectFileLines(file, eofMarkers.get(path) ?? []),
    };
  });
  const totals = summarizeFileDiffStats(renderable.files);
  return { kind: "files", ...totals, files };
}
