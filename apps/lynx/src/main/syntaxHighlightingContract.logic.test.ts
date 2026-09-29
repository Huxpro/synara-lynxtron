import { describe, expect, it } from "@rstest/core";

import {
  MAX_NATIVE_SYNTAX_HIGHLIGHT_LINES,
  MAX_NATIVE_SYNTAX_HIGHLIGHT_TOKENS,
  getNativeSyntaxLanguageForPath,
  normalizeNativeSyntaxHighlightResult,
} from "./syntaxHighlightingContract.logic";

describe("Native syntax highlight contract", () => {
  it("maps supported paths without loading the full Shiki language registry", () => {
    expect(getNativeSyntaxLanguageForPath("src/App.lynx.tsx")).toBe("tsx");
    expect(getNativeSyntaxLanguageForPath("C:\\repo\\settings.jsonc")).toBe("jsonc");
    expect(getNativeSyntaxLanguageForPath("Dockerfile")).toBe("dockerfile");
    expect(getNativeSyntaxLanguageForPath(".gitignore")).toBe("git-commit");
    expect(getNativeSyntaxLanguageForPath("archive.bin")).toBeNull();
  });

  it("normalizes exact Shiki token output including a trailing newline", () => {
    expect(
      normalizeNativeSyntaxHighlightResult({
        code: "const ready = true;\n",
        language: "typescript",
        theme: "light",
        lines: [
          [
            { content: "const", color: "#d73a49", fontStyle: 0 },
            { content: " ready = true;", color: "#24292e", fontStyle: 0 },
          ],
          [],
        ],
      }),
    ).toEqual({
      language: "typescript",
      theme: "light",
      lines: [
        [
          { content: "const", color: "#D73A49", fontStyle: 0 },
          { content: " ready = true;", color: "#24292E", fontStyle: 0 },
        ],
        [],
      ],
    });
  });

  it("rejects token streams that do not reconstruct the source", () => {
    expect(
      normalizeNativeSyntaxHighlightResult({
        code: "const ready = true;",
        language: "typescript",
        theme: "dark",
        lines: [[{ content: "const ready = false;", color: "#FFFFFF" }]],
      }),
    ).toBeNull();
  });

  it("rejects invalid colors and oversized line/token projections", () => {
    expect(
      normalizeNativeSyntaxHighlightResult({
        code: "x",
        language: "text",
        theme: "light",
        lines: [[{ content: "x", color: "red" }]],
      }),
    ).toBeNull();
    expect(
      normalizeNativeSyntaxHighlightResult({
        code: "x",
        language: "text",
        theme: "light",
        lines: Array.from({ length: MAX_NATIVE_SYNTAX_HIGHLIGHT_LINES + 1 }, () => []),
      }),
    ).toBeNull();
    expect(
      normalizeNativeSyntaxHighlightResult({
        code: "x".repeat(MAX_NATIVE_SYNTAX_HIGHLIGHT_TOKENS + 1),
        language: "text",
        theme: "light",
        lines: [
          Array.from({ length: MAX_NATIVE_SYNTAX_HIGHLIGHT_TOKENS + 1 }, () => ({
            content: "x",
            color: "#000000",
          })),
        ],
      }),
    ).toBeNull();
  });
});
