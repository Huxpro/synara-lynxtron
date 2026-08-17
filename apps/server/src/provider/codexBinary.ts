import { existsSync } from "node:fs";

export const CHATGPT_BUNDLED_CODEX_PATH =
  "/Applications/ChatGPT.app/Contents/Resources/codex";

export function resolveCodexBinaryPath(
  configuredPath?: string | null,
  input: {
    readonly allowBundledDiscovery?: boolean;
    readonly platform?: NodeJS.Platform;
    readonly exists?: (path: string) => boolean;
  } = {},
): string {
  const configured = configuredPath?.trim();
  if (configured && configured !== "codex") {
    return configured;
  }
  const platform = input.platform ?? process.platform;
  const exists = input.exists ?? existsSync;
  const allowBundledDiscovery =
    input.allowBundledDiscovery ?? process.env.NODE_ENV !== "test";
  if (
    allowBundledDiscovery &&
    platform === "darwin" &&
    exists(CHATGPT_BUNDLED_CODEX_PATH)
  ) {
    return CHATGPT_BUNDLED_CODEX_PATH;
  }
  return configured || "codex";
}
