import { describe, expect, it } from "vitest";

import {
  CHATGPT_BUNDLED_CODEX_PATH,
  resolveCodexBinaryPath,
} from "./codexBinary.ts";

describe("resolveCodexBinaryPath", () => {
  it("preserves an explicit custom binary", () => {
    expect(
      resolveCodexBinaryPath("/custom/codex", {
        platform: "darwin",
        exists: () => true,
      }),
    ).toBe("/custom/codex");
  });

  it("uses the ChatGPT bundled Codex on macOS for the default setting", () => {
    expect(
      resolveCodexBinaryPath("codex", {
        allowBundledDiscovery: true,
        platform: "darwin",
        exists: (path) => path === CHATGPT_BUNDLED_CODEX_PATH,
      }),
    ).toBe(CHATGPT_BUNDLED_CODEX_PATH);
  });

  it("uses the ChatGPT bundled Codex when no binary setting exists", () => {
    expect(
      resolveCodexBinaryPath(undefined, {
        allowBundledDiscovery: true,
        platform: "darwin",
        exists: (path) => path === CHATGPT_BUNDLED_CODEX_PATH,
      }),
    ).toBe(CHATGPT_BUNDLED_CODEX_PATH);
  });

  it("falls back to PATH resolution when the bundled binary is absent", () => {
    expect(
      resolveCodexBinaryPath("", {
        platform: "linux",
        exists: () => false,
      }),
    ).toBe("codex");
  });
});
