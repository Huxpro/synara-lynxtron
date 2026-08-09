// FILE: file-icons.ts
// Purpose: Map file/folder paths to Central icon names (the central-icons-reversed
//          asset set). Anything we don't have a dedicated glyph for falls back to
//          the generic `code-brackets` icon.
// Layer: app-level utility shared by composer, diff panel, timeline, sidebar.
// Depends on: Central icon assets served from /central-icons-reversed (see central-icons.tsx).

// Generic bracket glyph used whenever a file type has no dedicated Central icon.
const DEFAULT_FILE_ICON = "code-brackets";

const FILE_ICON_COLOR_BY_ICON_NAME = new Map<string, string>([
  ["audio", "#38bdf8"],
  ["bun", "#f4d7a1"],
  ["calendar-days", "#f59e0b"],
  ["c", "#659ad2"],
  ["cmd", "#4ade80"],
  ["code-brackets", "#9ca3af"],
  ["file-jpg", "#22c55e"],
  ["file-pdf", "#ef4444"],
  ["file-png", "#22c55e"],
  ["file-text", "#94a3b8"],
  ["file-zip", "#f97316"],
  ["git", "#f05032"],
  ["image-alt-text", "#22c55e"],
  ["java", "#f89820"],
  ["javascript", "#f7df1e"],
  ["json", "#f5c542"],
  ["lock", "#f59e0b"],
  ["markdown", "#6cb6ff"],
  ["npm", "#cb3837"],
  ["page-text", "#94a3b8"],
  ["php", "#777bb4"],
  ["phyton", "#3776ab"],
  ["react", "#61dafb"],
  ["rust", "#dea584"],
  ["settings-gear-1", "#a78bfa"],
  ["svelte", "#ff3e00"],
  ["typescript", "#3178c6"],
  ["vercel", "var(--foreground)"],
  ["video", "#c084fc"],
  ["vue", "#42b883"],
]);

const FILE_ICON_COLOR_CLASS_BY_ICON_NAME = new Map<string, string>([
  ["audio", "text-[#38bdf8]"],
  ["bun", "text-[#f4d7a1]"],
  ["calendar-days", "text-[#f59e0b]"],
  ["c", "text-[#659ad2]"],
  ["cmd", "text-[#4ade80]"],
  ["code-brackets", "text-[#9ca3af]"],
  ["file-jpg", "text-[#22c55e]"],
  ["file-pdf", "text-[#ef4444]"],
  ["file-png", "text-[#22c55e]"],
  ["file-text", "text-[#94a3b8]"],
  ["file-zip", "text-[#f97316]"],
  ["git", "text-[#f05032]"],
  ["image-alt-text", "text-[#22c55e]"],
  ["java", "text-[#f89820]"],
  ["javascript", "text-[#f7df1e]"],
  ["json", "text-[#f5c542]"],
  ["lock", "text-[#f59e0b]"],
  ["markdown", "text-[#6cb6ff]"],
  ["npm", "text-[#cb3837]"],
  ["page-text", "text-[#94a3b8]"],
  ["php", "text-[#777bb4]"],
  ["phyton", "text-[#3776ab]"],
  ["react", "text-[#61dafb]"],
  ["rust", "text-[#dea584]"],
  ["settings-gear-1", "text-[#a78bfa]"],
  ["svelte", "text-[#ff3e00]"],
  ["typescript", "text-[#3178c6]"],
  ["vercel", "text-foreground"],
  ["video", "text-[#c084fc]"],
  ["vue", "text-[#42b883]"],
]);

export function getFileIconColor(iconName: string): string {
  return (
    FILE_ICON_COLOR_BY_ICON_NAME.get(iconName) ??
    FILE_ICON_COLOR_BY_ICON_NAME.get(DEFAULT_FILE_ICON)!
  );
}

export function getFileIconColorClassName(iconName: string): string {
  return (
    FILE_ICON_COLOR_CLASS_BY_ICON_NAME.get(iconName) ??
    FILE_ICON_COLOR_CLASS_BY_ICON_NAME.get(DEFAULT_FILE_ICON)!
  );
}

// Lookup keys come from untrusted text (chat content, attachment names), so the
// tables must be Maps: a plain-object lookup for `constructor` or `__proto__` walks
// the prototype chain and returns an inherited member instead of an icon name.
function createIconTable(entries: Record<string, string>): ReadonlyMap<string, string> {
  return new Map(Object.entries(entries));
}

// Exact basename → Central icon name (case-insensitive lookup). Add entries here
// when a well-known filename has a dedicated icon we want to surface.
const FILE_ICON_BY_BASENAME = createIconTable({
  "package.json": "npm",
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  ".npmrc": "npm",
  ".npmignore": "npm",
  "yarn.lock": "npm",
  ".yarnrc": "npm",
  ".yarnrc.yml": "npm",
  "pnpm-lock.yaml": "npm",
  "pnpm-workspace.yaml": "npm",
  "bun.lockb": "bun",
  "bun.lock": "bun",
  ".gitignore": "git",
  ".gitattributes": "git",
  ".gitmodules": "git",
  ".gitkeep": "git",
  ".gitconfig": "git",
  "tsconfig.json": "typescript",
  "tsconfig.base.json": "typescript",
  "tsconfig.build.json": "typescript",
  "tsconfig.node.json": "typescript",
  "tsconfig.eslint.json": "typescript",
  "cargo.toml": "rust",
  "cargo.lock": "rust",
  "requirements.txt": "phyton",
  pipfile: "phyton",
  "pyproject.toml": "phyton",
  "setup.py": "phyton",
  "setup.cfg": "phyton",
  "readme.md": "markdown",
  license: "file-text",
  "license.md": "file-text",
  "license.txt": "file-text",
  "vercel.json": "vercel",
  ".env": "settings-gear-1",
  ".env.local": "settings-gear-1",
  ".env.development": "settings-gear-1",
  ".env.production": "settings-gear-1",
  ".env.test": "settings-gear-1",
  ".env.example": "settings-gear-1",
});

// Extension → Central icon name. Longest extension wins because
// `extensionCandidates` yields compound extensions first (e.g. `.d.ts` before
// `.ts`). NOTE: the Python asset ships misspelled upstream as `phyton.svg`.
const FILE_ICON_BY_EXTENSION = createIconTable({
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  "d.ts": "typescript",
  tsx: "react",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "react",
  json: "json",
  json5: "json",
  jsonc: "json",
  md: "markdown",
  mdx: "markdown",
  mdc: "markdown",
  markdown: "markdown",
  py: "phyton",
  pyi: "phyton",
  pyc: "phyton",
  pyw: "phyton",
  rs: "rust",
  php: "php",
  phtml: "php",
  java: "java",
  c: "c",
  h: "c",
  vue: "vue",
  svelte: "svelte",
  yml: "settings-gear-1",
  yaml: "settings-gear-1",
  toml: "settings-gear-1",
  ini: "settings-gear-1",
  conf: "settings-gear-1",
  cfg: "settings-gear-1",
  env: "settings-gear-1",
  txt: "file-text",
  log: "file-text",
  csv: "file-chart",
  tsv: "file-chart",
  rtf: "page-text",
  doc: "page-text",
  docx: "page-text",
  odt: "page-text",
  xls: "file-chart",
  xlsx: "file-chart",
  ods: "file-chart",
  ppt: "page-text",
  pptx: "page-text",
  odp: "page-text",
  ics: "calendar-days",
  ifb: "calendar-days",
  vcs: "calendar-days",
  sh: "cmd",
  bash: "cmd",
  zsh: "cmd",
  fish: "cmd",
  bat: "cmd",
  ps1: "cmd",
  psm1: "cmd",
  psd1: "cmd",
  lock: "lock",
  png: "file-png",
  jpg: "file-jpg",
  jpeg: "file-jpg",
  gif: "image-alt-text",
  webp: "image-alt-text",
  bmp: "image-alt-text",
  tiff: "image-alt-text",
  avif: "image-alt-text",
  ico: "image-alt-text",
  svg: "image-alt-text",
  pdf: "file-pdf",
  zip: "file-zip",
  tar: "file-zip",
  gz: "file-zip",
  tgz: "file-zip",
  rar: "file-zip",
  "7z": "file-zip",
  bz2: "file-zip",
  xz: "file-zip",
  mp4: "video",
  m4v: "video",
  mov: "video",
  webm: "video",
  mkv: "video",
  avi: "video",
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  ogg: "audio",
  m4a: "audio",
  aac: "audio",
});

export function basenameOfPath(pathValue: string): string {
  const slashIndex = Math.max(pathValue.lastIndexOf("/"), pathValue.lastIndexOf("\\"));
  if (slashIndex === -1) return pathValue;
  return pathValue.slice(slashIndex + 1);
}

// True when the basename matches a known filename or a known file extension.
// Used both for icon selection and to decide whether an inline token (e.g. an
// assistant's `path/to/file.ts`) should render as a file mention chip.
export function pathLooksLikeKnownFile(pathValue: string): boolean {
  const basename = basenameOfPath(pathValue).toLowerCase();
  if (FILE_ICON_BY_BASENAME.has(basename)) {
    return true;
  }
  return extensionCandidates(basename).some((candidate) => FILE_ICON_BY_EXTENSION.has(candidate));
}

export function inferEntryKindFromPath(pathValue: string): "file" | "directory" {
  const base = basenameOfPath(pathValue);
  if (pathLooksLikeKnownFile(pathValue)) {
    return "file";
  }
  if (base.startsWith(".") && !base.slice(1).includes(".")) {
    return "directory";
  }
  if (base.includes(".")) {
    return "file";
  }
  return "directory";
}

function extensionCandidates(fileName: string): string[] {
  const candidates: string[] = [];
  let dotIndex = fileName.indexOf(".");
  while (dotIndex !== -1 && dotIndex < fileName.length - 1) {
    const candidate = fileName.slice(dotIndex + 1);
    if (candidate.length > 0) candidates.push(candidate);
    dotIndex = fileName.indexOf(".", dotIndex + 1);
  }
  return candidates;
}

// Resolves the Central icon name for a file path, defaulting to the generic
// bracket glyph when the basename/extension has no dedicated icon.
export function getFileIconName(pathValue: string): string {
  const basename = basenameOfPath(pathValue).toLowerCase();
  const byName = FILE_ICON_BY_BASENAME.get(basename);
  if (byName) return byName;
  for (const candidate of extensionCandidates(basename)) {
    const byExt = FILE_ICON_BY_EXTENSION.get(candidate);
    if (byExt) return byExt;
  }
  return DEFAULT_FILE_ICON;
}

// MIME type → Central icon name, used as a fallback for attachments whose
// filename has no recognizable extension (e.g. a download named only by its
// Content-Type, like a UUID carrying a `text/calendar` body). Mirrors the
// families covered by the extension map so the two stay visually consistent.
const FILE_ICON_BY_MIME_TYPE = createIconTable({
  "application/pdf": "file-pdf",
  "application/json": "json",
  "application/xml": "code-brackets",
  "application/zip": "file-zip",
  "application/gzip": "file-zip",
  "application/x-tar": "file-zip",
  "application/x-7z-compressed": "file-zip",
  "application/vnd.ms-excel": "file-chart",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file-chart",
  "application/vnd.oasis.opendocument.spreadsheet": "file-chart",
  "application/msword": "page-text",
  "application/vnd.ms-word": "page-text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "page-text",
  "application/vnd.oasis.opendocument.text": "page-text",
  "application/vnd.ms-powerpoint": "page-text",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "page-text",
  "application/vnd.oasis.opendocument.presentation": "page-text",
  "application/rtf": "page-text",
  "text/calendar": "calendar-days",
  "text/csv": "file-chart",
  "text/tab-separated-values": "file-chart",
  "text/markdown": "markdown",
  "text/html": "code-brackets",
  "text/xml": "code-brackets",
});

// Attachments default to a neutral document glyph rather than the source-code
// bracket: an arbitrary upload is far likelier to be a document than code.
const DEFAULT_ATTACHMENT_ICON = "file-text";

// Resolves the Central icon name for a chat file attachment. Prefers the
// filename (basename, then extension) like `getFileIconName`, then falls back to
// the MIME type and finally a generic document glyph — never the bracket glyph,
// which misreads on non-code uploads.
export function getAttachmentIconName(attachment: {
  name: string;
  mimeType?: string | null | undefined;
}): string {
  const basename = basenameOfPath(attachment.name).toLowerCase();
  const byName = FILE_ICON_BY_BASENAME.get(basename);
  if (byName) return byName;
  for (const candidate of extensionCandidates(basename)) {
    const byExt = FILE_ICON_BY_EXTENSION.get(candidate);
    if (byExt) return byExt;
  }

  const mimeType = attachment.mimeType?.trim().toLowerCase() ?? "";
  if (mimeType.length > 0) {
    const byMime = FILE_ICON_BY_MIME_TYPE.get(mimeType);
    if (byMime) return byMime;
    const topLevelType = mimeType.split("/")[0];
    if (topLevelType === "image") return "image-alt-text";
    if (topLevelType === "audio") return "audio";
    if (topLevelType === "video") return "video";
    if (topLevelType === "text") return "file-text";
  }

  return DEFAULT_ATTACHMENT_ICON;
}
