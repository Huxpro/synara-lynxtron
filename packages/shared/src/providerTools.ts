import type { ProviderKind } from "@synara/contracts";

export type ProviderToolTextKey =
  | "claudeBinaryPath"
  | "codexBinaryPath"
  | "codexHomePath"
  | "cursorBinaryPath"
  | "cursorApiEndpoint"
  | "antigravityBinaryPath"
  | "grokBinaryPath"
  | "droidBinaryPath"
  | "kiloBinaryPath"
  | "kiloServerUrl"
  | "openCodeBinaryPath"
  | "openCodeServerUrl"
  | "piBinaryPath"
  | "piAgentDir";

export type ProviderToolPasswordKey = "kiloServerPassword" | "openCodeServerPassword";
export type ProviderToolPasswordConfiguredKey =
  | "kiloServerPasswordConfigured"
  | "openCodeServerPasswordConfigured";
export type ProviderToolBooleanKey = "openCodeExperimentalWebSockets";

export type ProviderToolDescriptionSegment = {
  readonly text: string;
  readonly code?: boolean;
};

type ProviderToolFieldBase = {
  readonly label: string;
  readonly description: readonly ProviderToolDescriptionSegment[];
};

export type ProviderToolTextField = ProviderToolFieldBase & {
  readonly kind: "text";
  readonly settingsKey: ProviderToolTextKey;
  readonly placeholder: string;
};

export type ProviderToolPasswordField = ProviderToolFieldBase & {
  readonly kind: "password";
  readonly settingsKey: ProviderToolPasswordKey;
  readonly configuredKey: ProviderToolPasswordConfiguredKey;
  readonly placeholder: string;
};

export type ProviderToolBooleanField = ProviderToolFieldBase & {
  readonly kind: "boolean";
  readonly settingsKey: ProviderToolBooleanKey;
};

export type ProviderToolField =
  | ProviderToolTextField
  | ProviderToolPasswordField
  | ProviderToolBooleanField;

export type ProviderToolConfig = {
  readonly provider: ProviderKind;
  readonly docs: ReadonlyArray<{ readonly label: string; readonly href: string }>;
  readonly fields: readonly ProviderToolField[];
};

const text = (value: string): ProviderToolDescriptionSegment => ({ text: value });
const code = (value: string): ProviderToolDescriptionSegment => ({ text: value, code: true });

export const PROVIDER_TOOL_CONFIGS: readonly ProviderToolConfig[] = [
  {
    provider: "codex",
    docs: [
      { label: "Install", href: "https://help.openai.com/en/articles/11096431" },
      { label: "Update", href: "https://help.openai.com/en/articles/11096431" },
      { label: "Config", href: "https://github.com/openai/codex/blob/main/docs/config.md" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "codexBinaryPath",
        label: "Codex binary path",
        placeholder: "Codex binary path",
        description: [text("Leave blank to use "), code("codex"), text(" from your PATH.")],
      },
      {
        kind: "text",
        settingsKey: "codexHomePath",
        label: "CODEX_HOME path",
        placeholder: "CODEX_HOME",
        description: [text("Optional custom Codex home and config directory.")],
      },
    ],
  },
  {
    provider: "claudeAgent",
    docs: [
      { label: "Install", href: "https://code.claude.com/docs/en/installation" },
      {
        label: "Update",
        href: "https://code.claude.com/docs/en/installation#update-claude-code",
      },
      { label: "Config", href: "https://code.claude.com/docs/en/settings" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "claudeBinaryPath",
        label: "Claude binary path",
        placeholder: "Claude binary path",
        description: [text("Leave blank to use "), code("claude"), text(" from your PATH.")],
      },
    ],
  },
  {
    provider: "cursor",
    docs: [
      { label: "Install", href: "https://docs.cursor.com/en/cli/installation" },
      { label: "Update", href: "https://docs.cursor.com/en/cli/installation#updates" },
      { label: "Config", href: "https://docs.cursor.com/en/cli/overview" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "cursorBinaryPath",
        label: "Cursor binary path",
        placeholder: "Cursor Agent or Cursor CLI path",
        description: [
          text("Leave blank to use "),
          code("cursor-agent"),
          text(" from your PATH. Cursor editor CLI paths are accepted too."),
        ],
      },
      {
        kind: "text",
        settingsKey: "cursorApiEndpoint",
        label: "Cursor API endpoint",
        placeholder: "https://api2.cursor.sh",
        description: [text("Optional Cursor API endpoint override passed to `cursor-agent -e`.")],
      },
    ],
  },
  {
    provider: "antigravity",
    docs: [
      { label: "Install", href: "https://antigravity.google/docs/cli-using" },
      { label: "Reference", href: "https://antigravity.google/docs/cli-reference" },
      { label: "Hooks", href: "https://antigravity.google/docs/hooks" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "antigravityBinaryPath",
        label: "Antigravity binary path",
        placeholder: "Antigravity CLI binary path",
        description: [text("Leave blank to use "), code("agy"), text(" from your PATH.")],
      },
    ],
  },
  {
    provider: "grok",
    docs: [
      { label: "Install", href: "https://docs.x.ai/build/overview" },
      { label: "Headless", href: "https://docs.x.ai/build/cli/headless-scripting" },
      { label: "Config", href: "https://docs.x.ai/build/overview" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "grokBinaryPath",
        label: "Grok binary path",
        placeholder: "Grok binary path",
        description: [text("Leave blank to use "), code("grok"), text(" from your PATH.")],
      },
    ],
  },
  {
    provider: "droid",
    docs: [
      {
        label: "Quickstart",
        href: "https://docs.factory.ai/cli/getting-started/quickstart.md",
      },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "droidBinaryPath",
        label: "Droid binary path",
        placeholder: "droid",
        description: [text("Leave blank to use "), code("droid"), text(" from your PATH.")],
      },
    ],
  },
  {
    provider: "kilo",
    docs: [
      { label: "Install", href: "https://kilo.ai/docs/cli" },
      { label: "Update", href: "https://kilo.ai/docs/cli" },
      { label: "Config", href: "https://kilo.ai/docs/cli#configuration" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "kiloBinaryPath",
        label: "Kilo binary path",
        placeholder: "Kilo binary path",
        description: [text("Leave blank to use "), code("kilo"), text(" from your PATH.")],
      },
      {
        kind: "text",
        settingsKey: "kiloServerUrl",
        label: "Kilo server URL",
        placeholder: "http://127.0.0.1:4096",
        description: [
          text("Optional existing Kilo server URL. Leave blank to spawn a local server."),
        ],
      },
      {
        kind: "password",
        settingsKey: "kiloServerPassword",
        configuredKey: "kiloServerPasswordConfigured",
        label: "Kilo server password",
        placeholder: "Kilo server password",
        description: [text("Optional password for an externally managed Kilo server.")],
      },
    ],
  },
  {
    provider: "opencode",
    docs: [
      { label: "Install", href: "https://opencode.ai/docs/" },
      { label: "Update", href: "https://opencode.ai/docs/cli/" },
      { label: "Config", href: "https://opencode.ai/docs/config/" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "openCodeBinaryPath",
        label: "OpenCode binary path",
        placeholder: "OpenCode binary path",
        description: [text("Leave blank to use "), code("opencode"), text(" from your PATH.")],
      },
      {
        kind: "text",
        settingsKey: "openCodeServerUrl",
        label: "OpenCode server URL",
        placeholder: "http://127.0.0.1:4096",
        description: [
          text("Optional existing OpenCode server URL. Leave blank to spawn a local server."),
        ],
      },
      {
        kind: "password",
        settingsKey: "openCodeServerPassword",
        configuredKey: "openCodeServerPasswordConfigured",
        label: "OpenCode server password",
        placeholder: "OpenCode server password",
        description: [text("Optional password for an externally managed OpenCode server.")],
      },
      {
        kind: "boolean",
        settingsKey: "openCodeExperimentalWebSockets",
        label: "OpenAI response WebSockets",
        description: [
          text(
            "Use Opencode's experimental OpenAI response WebSocket transport for managed local servers.",
          ),
        ],
      },
    ],
  },
  {
    provider: "pi",
    docs: [
      { label: "Install", href: "https://pi.dev/docs/latest" },
      { label: "Update", href: "https://pi.dev/docs/latest/settings" },
      { label: "Config", href: "https://pi.dev/docs/latest/settings" },
    ],
    fields: [
      {
        kind: "text",
        settingsKey: "piBinaryPath",
        label: "Pi binary path",
        placeholder: "Pi binary path",
        description: [text("Leave blank to use "), code("pi"), text(" from your PATH.")],
      },
      {
        kind: "text",
        settingsKey: "piAgentDir",
        label: "Pi agent directory",
        placeholder: "Pi agent directory",
        description: [
          text("Optional custom Pi agent directory for auth, models, skills, and commands."),
        ],
      },
    ],
  },
];

export function providerToolDescriptionText(
  description: readonly ProviderToolDescriptionSegment[],
): string {
  return description.map((segment) => segment.text).join("");
}
