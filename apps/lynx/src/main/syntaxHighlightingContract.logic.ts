export const MAX_NATIVE_SYNTAX_HIGHLIGHT_INPUT_CHARS = 250_000;
export const MAX_NATIVE_SYNTAX_HIGHLIGHT_LINES = 2_000;
export const MAX_NATIVE_SYNTAX_HIGHLIGHT_TOKENS = 8_000;
export const NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG = "host.syntaxHighlightCode";

const SYNTAX_LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  bash: "bash",
  c: "c",
  cc: "cpp",
  cjs: "javascript",
  cpp: "cpp",
  cs: "csharp",
  css: "css",
  diff: "diff",
  gql: "graphql",
  go: "go",
  graphql: "graphql",
  h: "c",
  hpp: "cpp",
  htm: "html",
  html: "html",
  java: "java",
  js: "javascript",
  json: "json",
  json5: "json5",
  jsonc: "jsonc",
  jsx: "jsx",
  kt: "kotlin",
  kts: "kotlin",
  md: "markdown",
  mdx: "mdx",
  mjs: "javascript",
  mts: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  scss: "scss",
  sh: "bash",
  sql: "sql",
  svelte: "svelte",
  swift: "swift",
  toml: "toml",
  ts: "typescript",
  tsx: "tsx",
  vue: "vue",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

const SYNTAX_LANGUAGE_BY_FILENAME: Readonly<Record<string, string>> = {
  ".env": "dotenv",
  ".gitattributes": "git-commit",
  ".gitignore": "git-commit",
  dockerfile: "dockerfile",
  makefile: "makefile",
};

export interface NativeSyntaxToken {
  readonly color: string;
  readonly content: string;
  readonly fontStyle: number;
}

export interface NativeSyntaxHighlightResult {
  readonly language: string;
  readonly lines: ReadonlyArray<ReadonlyArray<NativeSyntaxToken>>;
  readonly theme: "dark" | "light";
}

export interface NativeSyntaxHighlightThemes {
  readonly dark: NativeSyntaxHighlightResult;
  readonly light: NativeSyntaxHighlightResult;
}

const TOKEN_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function getNativeSyntaxLanguageForPath(path: string): string | null {
  const fileName = path.replace(/\\/g, "/").split("/").pop()?.toLowerCase();
  if (!fileName) return null;
  const filenameLanguage = SYNTAX_LANGUAGE_BY_FILENAME[fileName];
  if (filenameLanguage) return filenameLanguage;
  const extension = fileName.includes(".") ? fileName.split(".").pop() : null;
  return extension ? (SYNTAX_LANGUAGE_BY_EXTENSION[extension] ?? null) : null;
}

export function normalizeNativeSyntaxHighlightResult(input: {
  readonly code: string;
  readonly language: string;
  readonly lines: ReadonlyArray<
    ReadonlyArray<{
      readonly color?: unknown;
      readonly content?: unknown;
      readonly fontStyle?: unknown;
    }>
  >;
  readonly theme: "dark" | "light";
}): NativeSyntaxHighlightResult | null {
  if (
    input.code.length === 0 ||
    input.code.length > MAX_NATIVE_SYNTAX_HIGHLIGHT_INPUT_CHARS ||
    input.lines.length > MAX_NATIVE_SYNTAX_HIGHLIGHT_LINES
  ) {
    return null;
  }
  let tokenCount = 0;
  let reconstructed = "";
  const lines: NativeSyntaxToken[][] = [];
  for (let lineIndex = 0; lineIndex < input.lines.length; lineIndex += 1) {
    const sourceLine = input.lines[lineIndex] ?? [];
    const line: NativeSyntaxToken[] = [];
    for (const token of sourceLine) {
      tokenCount += 1;
      if (tokenCount > MAX_NATIVE_SYNTAX_HIGHLIGHT_TOKENS) return null;
      if (
        typeof token.content !== "string" ||
        typeof token.color !== "string" ||
        !TOKEN_COLOR_PATTERN.test(token.color)
      ) {
        return null;
      }
      const fontStyle =
        typeof token.fontStyle === "number" &&
        Number.isInteger(token.fontStyle) &&
        token.fontStyle >= 0 &&
        token.fontStyle <= 7
          ? token.fontStyle
          : 0;
      reconstructed += token.content;
      line.push({
        color: token.color.toUpperCase(),
        content: token.content,
        fontStyle,
      });
    }
    lines.push(line);
    if (lineIndex < input.lines.length - 1) reconstructed += "\n";
  }
  if (reconstructed !== input.code) return null;
  return {
    language: input.language,
    lines,
    theme: input.theme,
  };
}
