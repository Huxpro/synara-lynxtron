// FILE: codeFence.ts
// Purpose: Parse markdown code-fence info strings into a highlighter language plus
//          optional file-reference metadata (Cursor-style `startLine:endLine:path`).
// Layer: web chat markdown helper
// Exports: parseCodeFenceInfo, type CodeFenceInfo
// Depends on: @pierre/diffs filename→language map (shared with the diff renderer)
//             and the shared path basename helper (file-icons).

import { getFiletypeFromFileName } from "@pierre/diffs";
import {
  parseCodeFenceDisplayInfo,
} from "./codeFenceCore";

export { dedentCode } from "./codeFenceCore";

export interface CodeFenceInfo {
  /** Highlighter language id (a valid Shiki language/alias, falling back to "text"). */
  readonly language: string;
  /** True when the fence info encodes a file reference rather than a bare language. */
  readonly isFileReference: boolean;
  /** Full file path when this fence references a file, else null. */
  readonly filePath: string | null;
  /** Basename of the referenced file for display, else null. */
  readonly fileName: string | null;
  /** Directory portion of the referenced path (no trailing slash), else null. */
  readonly directory: string | null;
  /** Line range label like "173-186" (or a single line), else null. */
  readonly lineRange: string | null;
}

// Parses a fence info string. Recognizes Cursor-style file references
// (`startLine:endLine:path`) and bare file paths, deriving the highlighter
// language from the file extension. Everything else is treated as a plain
// language token (preserving the legacy `gitignore` → `ini` alias).
export function parseCodeFenceInfo(rawInfo: string): CodeFenceInfo {
  const display = parseCodeFenceDisplayInfo(rawInfo);
  const language = display.isFileReference && display.fileName
    ? getFiletypeFromFileName(display.fileName)
    : display.language;
  return {
    ...display,
    language,
  };
}
