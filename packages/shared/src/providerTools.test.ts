import { describe, expect, it } from "vitest";

import { PROVIDER_TOOL_CONFIGS, providerToolDescriptionText } from "./providerTools";

describe("provider tools configuration", () => {
  it("owns every provider and provider-specific field in canonical order", () => {
    expect(PROVIDER_TOOL_CONFIGS.map((config) => config.provider)).toEqual([
      "codex",
      "claudeAgent",
      "cursor",
      "antigravity",
      "grok",
      "droid",
      "opencode",
      "pi",
    ]);
    expect(
      Object.fromEntries(
        PROVIDER_TOOL_CONFIGS.map((config) => [
          config.provider,
          config.fields.map((field) => [field.kind, field.settingsKey]),
        ]),
      ),
    ).toEqual({
      codex: [
        ["text", "codexBinaryPath"],
        ["text", "codexHomePath"],
      ],
      claudeAgent: [["text", "claudeBinaryPath"]],
      cursor: [
        ["text", "cursorBinaryPath"],
        ["text", "cursorApiEndpoint"],
      ],
      antigravity: [["text", "antigravityBinaryPath"]],
      grok: [["text", "grokBinaryPath"]],
      droid: [["text", "droidBinaryPath"]],
      opencode: [
        ["text", "openCodeBinaryPath"],
        ["text", "openCodeServerUrl"],
        ["password", "openCodeServerPassword"],
        ["boolean", "openCodeExperimentalWebSockets"],
      ],
      pi: [
        ["text", "piBinaryPath"],
        ["text", "piAgentDir"],
      ],
    });
  });

  it("retains password redaction keys, docs, and platform-neutral descriptions", () => {
    const openCode = PROVIDER_TOOL_CONFIGS.find((config) => config.provider === "opencode");
    const openCodePassword = openCode?.fields.find((field) => field.kind === "password");
    const codex = PROVIDER_TOOL_CONFIGS.find((config) => config.provider === "codex");
    const codexBinary = codex?.fields.find((field) => field.settingsKey === "codexBinaryPath");

    expect(openCodePassword?.configuredKey).toBe("openCodeServerPasswordConfigured");
    expect(openCode?.docs.map((doc) => doc.label)).toEqual(["Install", "Update", "Config"]);
    expect(providerToolDescriptionText(codexBinary?.description ?? [])).toBe(
      "Leave blank to use codex from your PATH.",
    );
    expect(codexBinary?.description).toContainEqual({
      text: "codex",
      code: true,
    });
  });
});
