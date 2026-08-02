// FILE: codeFenceCore.ts
// Purpose: Platform-neutral code-fence display parsing and indentation cleanup.
// Layer: shared chat markdown presentation logic (Web + Lynx)
// Exports: dedentCode, parseCodeFenceDisplayInfo

export interface CodeFenceDisplayInfo {
  /** Raw highlighter/display language token for a non-file fence. */
  readonly language: string;
  readonly isFileReference: boolean;
  readonly filePath: string | null;
  readonly fileName: string | null;
  readonly directory: string | null;
  readonly lineRange: string | null;
}

function basenameOfPath(pathValue: string): string {
  const slashIndex = Math.max(
    pathValue.lastIndexOf('/'),
    pathValue.lastIndexOf('\\')
  );
  return slashIndex === -1 ? pathValue : pathValue.slice(slashIndex + 1);
}

function directoryFromPath(filePath: string, fileName: string): string | null {
  const directory = filePath.slice(
    0,
    Math.max(0, filePath.length - fileName.length)
  );
  const trimmed = directory.replace(/[\\/]+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

function fileReferenceInfo(
  filePath: string,
  lineRange: string | null
): CodeFenceDisplayInfo {
  const fileName = basenameOfPath(filePath);
  return {
    // The platform renderer may resolve a richer syntax grammar from fileName.
    // The dependency-light shared display layer keeps a stable fallback token.
    language: 'text',
    isFileReference: true,
    filePath,
    fileName,
    directory: directoryFromPath(filePath, fileName),
    lineRange,
  };
}

const LEADING_WHITESPACE_REGEX = /^[ \t]*/;

export function dedentCode(code: string): string {
  const lines = code.split('\n');
  let minIndent = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = LEADING_WHITESPACE_REGEX.exec(line)?.[0].length ?? 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) return code;
  return lines.map((line) => line.slice(minIndent)).join('\n');
}

const CODE_REFERENCE_REGEX = /^(\d+):(\d+):(.+)$/;

export function parseCodeFenceDisplayInfo(rawInfo: string): CodeFenceDisplayInfo {
  const info = rawInfo.trim();
  const referenceMatch = info.match(CODE_REFERENCE_REGEX);
  if (referenceMatch) {
    const [, start, end, filePath] = referenceMatch;
    if (start != null && end != null && filePath != null) {
      return fileReferenceInfo(
        filePath,
        start === end ? start : `${start}-${end}`
      );
    }
  }

  if (info.includes('/') || info.includes('\\')) {
    return fileReferenceInfo(info, null);
  }

  return {
    language: info === 'gitignore' ? 'ini' : info.length > 0 ? info : 'text',
    isFileReference: false,
    filePath: null,
    fileName: null,
    directory: null,
    lineRange: null,
  };
}
