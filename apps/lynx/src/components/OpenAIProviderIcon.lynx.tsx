import openAiSvg from "@synara-provider-icons/openai.svg?raw";
import claudeSvg from "@synara-provider-icons/claudeai.svg?raw";
import cursorSvg from "@synara-provider-icons/cursor.svg?raw";
import antigravitySvg from "@synara-provider-icons/antigravity.svg?raw";
import grokSvg from "@synara-provider-icons/grok.svg?raw";
import openCodeSvg from "@synara-provider-icons/opencode.svg?raw";
import droidSvg from "@synara-provider-icons/droid.svg?raw";
import piSvg from "@synara-provider-icons/pi.svg?raw";

import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";

const PROVIDER_SVG: Readonly<Record<string, string>> = {
  codex: openAiSvg,
  claudeAgent: claudeSvg,
  cursor: cursorSvg,
  antigravity: antigravitySvg,
  grok: grokSvg,
  droid: droidSvg,
  opencode: openCodeSvg,
  pi: piSvg,
};

// Electron's ClaudeAI glyph paints its brand fill unless a caller passes an explicit color;
// every other provider glyph follows the text color.
const PROVIDER_BRAND_COLOR: Readonly<Record<string, string>> = {
  claudeAgent: "#D97757",
};

/** The color Electron's provider glyph renders with where the caller only sets a text tint. */
export function resolveProviderGlyphColor(provider: string, textColor: string): string {
  return PROVIDER_BRAND_COLOR[provider] ?? textColor;
}

export function hasLynxProviderIcon(provider: string): boolean {
  return PROVIDER_SVG[provider] !== undefined;
}

export function OpenAIProviderIcon({
  provider = "codex",
  color,
}: {
  readonly provider?: string;
  readonly color?: string;
}) {
  const { semanticIconColor } = useTheme();
  const content = colorizeLynxSvg(
    PROVIDER_SVG[provider] ?? openAiSvg,
    color ?? semanticIconColor("secondary"),
  );
  return <svg className="OpenAIProviderIcon" content={content} />;
}
