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

export type PullRequestDiffLineKind = "hunk" | "context" | "addition" | "deletion";

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

function projectFileLines(file: Extract<RenderablePatch, { kind: "files" }>['files'][number]) {
  const fileKey = buildFileDiffRenderKey(file);
  const lines: PullRequestDiffLineView[] = [];
  let rowIndex = 0;
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
        }
        continue;
      }
      for (let index = 0; index < segment.deletions; index += 1) {
        lines.push({
          id: lineId(fileKey, "deletion", rowIndex++),
          kind: "deletion",
          oldLine: oldLine++,
          newLine: null,
          text: portableLineText(file.deletionLines[segment.deletionLineIndex + index] ?? ""),
        });
      }
      for (let index = 0; index < segment.additions; index += 1) {
        lines.push({
          id: lineId(fileKey, "addition", rowIndex++),
          kind: "addition",
          oldLine: null,
          newLine: newLine++,
          text: portableLineText(file.additionLines[segment.additionLineIndex + index] ?? ""),
        });
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
    if (!current.inHunk || line.startsWith("\\ No newline at end of file")) continue;
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
      lines: projectFileLines(file),
    };
  });
  const totals = summarizeFileDiffStats(renderable.files);
  return { kind: "files", ...totals, files };
}
