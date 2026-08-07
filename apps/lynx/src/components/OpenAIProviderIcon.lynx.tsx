import openAiSvg from '@synara-provider-icons/openai.svg?raw';
import claudeSvg from '@synara-provider-icons/claudeai.svg?raw';
import cursorSvg from '@synara-provider-icons/cursor.svg?raw';
import antigravitySvg from '@synara-provider-icons/antigravity.svg?raw';
import grokSvg from '@synara-provider-icons/grok.svg?raw';
import openCodeSvg from '@synara-provider-icons/opencode.svg?raw';
import droidSvg from '@synara-provider-icons/droid.svg?raw';
import kiloSvg from '@synara-provider-icons/kilo.svg?raw';
import piSvg from '@synara-provider-icons/pi.svg?raw';

import { useTheme } from '../adapters/useTheme.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';

const PROVIDER_SVG: Readonly<Record<string, string>> = {
  codex: openAiSvg,
  claudeAgent: claudeSvg,
  cursor: cursorSvg,
  antigravity: antigravitySvg,
  grok: grokSvg,
  droid: droidSvg,
  kilo: kiloSvg,
  opencode: openCodeSvg,
  pi: piSvg,
};

export function hasLynxProviderIcon(provider: string): boolean {
  return PROVIDER_SVG[provider] !== undefined;
}

export function OpenAIProviderIcon({
  provider = 'codex',
}: {
  readonly provider?: string;
}) {
  const { svgColors } = useTheme();
  const content = colorizeLynxSvg(
    PROVIDER_SVG[provider] ?? openAiSvg,
    svgColors.mutedForeground
  );
  return (
    <svg
      className="OpenAIProviderIcon"
      content={content}
    />
  );
}
