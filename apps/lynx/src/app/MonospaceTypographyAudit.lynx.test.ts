import { describe, expect, it } from "@rstest/core";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const stylesheet = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

const sourceRoot = dirname(fileURLToPath(new URL("../", import.meta.url)));

function productStylesheets(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return ["dist", "generated", "node_modules", "output"].includes(entry.name)
        ? []
        : productStylesheets(path);
    }
    return entry.isFile() && entry.name.endsWith(".css") && entry.name !== "native-fonts.css"
      ? [path]
      : [];
  });
}

describe("Native monospace typography inventory", () => {
  it("routes code-bearing surfaces through configurable semantic font tokens", () => {
    const cases = [
      ["./explorer-dock.css", ".ExplorerDockSyntaxCode", "--font-chat-code-family"],
      ["./explorer-dock.css", ".ExplorerDockSyntaxLineNumber", "--font-mono-family"],
      ["./explorer-dock.css", ".ExplorerDockSyntaxLineNumberText", "--font-mono-family"],
      ["./diff-dock.css", ".DiffDockFileJumpPath", "--font-mono-family"],
      ["./thread-terminal.css", ".ThreadTerminalOutput", "--font-mono-family"],
      ["./thread-terminal.css", ".ThreadTerminalOutputLine", "--font-mono-family"],
      ["../components/markdown/markdown.css", ".MdCode", "--font-chat-code-family"],
      ["../components/markdown/markdown.css", ".MdInlineCode", "--font-mono-family"],
      [
        "../adapters/pull-request-code-composition-elements.css",
        ".SharedPrCodeLineText",
        "--font-chat-code-family",
      ],
      [
        "../adapters/pull-request-code-composition-elements.css",
        ".SharedPrCodeLineNumber",
        "--font-chat-code-family",
      ],
      [
        "../adapters/pull-request-code-composition-elements.css",
        ".SharedPrCodeLinePrefix",
        "--font-chat-code-family",
      ],
      [
        "../adapters/pull-request-code-composition-elements.css",
        ".SharedPrCodeFilePath",
        "--font-mono-family",
      ],
      [
        "../adapters/theme-pack-editor-composition-elements.css",
        ".SharedThemePackFontInput--mono .LxInput",
        "--font-chat-code-family",
      ],
      ["./settings-custom-models-panel.css", ".SettingsCustomModelsRowSlug", "--font-mono-family"],
    ] as const;

    for (const [file, selector, token] of cases) {
      const source = stylesheet(file);
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const blocks = Array.from(
        source.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "g")),
        (match) => match[1] ?? "",
      );
      expect(blocks.length, `${file} contains ${selector}`).toBeGreaterThan(0);
      expect(blocks.some((block) => block.includes(`font-family: var(${token})`))).toBe(true);
    }
  });

  it("keeps editor breadcrumb and comment copy on the Electron UI-font contract", () => {
    const cases = [
      ["./explorer-dock.css", ".ExplorerDockBreadcrumbDirectory"],
      ["./explorer-dock.css", ".ExplorerDockBreadcrumbFile"],
      ["./explorer-dock.css", ".ExplorerDockCommentTarget"],
      ["./explorer-dock.css", ".ExplorerDockCommentInput"],
      [
        "../adapters/pull-request-summary-composition-elements.css",
        ".SharedPrCommentComposerInput",
      ],
      ["./kanban-new-task-dialog.css", ".KanbanNewTaskInput"],
    ] as const;
    for (const [file, selector] of cases) {
      const source = stylesheet(file);
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
      expect(match?.[1], `${file} ${selector}`).toContain("font-family: var(--font-ui-family)");
    }
  });

  it("does not hard-code a monospace family outside the font registration", () => {
    const files = [
      "./App.css",
      "./explorer-dock.css",
      "./diff-dock.css",
      "./thread-terminal.css",
      "./settings-custom-models-panel.css",
      "../components/markdown/markdown.css",
      "../adapters/pull-request-code-composition-elements.css",
      "../adapters/theme-pack-editor-composition-elements.css",
    ];
    for (const file of files) {
      const source = stylesheet(file);
      expect(source, file).not.toMatch(
        /font-family:\s*"(?:JetBrains Mono Variable|SFMono-Regular)"/u,
      );
    }
  });

  it("routes every explicit product font-family through a semantic token", () => {
    for (const file of productStylesheets(sourceRoot)) {
      const source = readFileSync(file, "utf8");
      const declarations = Array.from(
        source.matchAll(/font-family:\s*([^;}]*)/g),
        (match) => match[1]?.trim() ?? "",
      );
      for (const declaration of declarations) {
        expect(declaration, `${file}: ${declaration}`).toMatch(
          /^var\(--font-(?:ui|heading|mono|chat-code)-family\)$/,
        );
      }
    }
  });
});
