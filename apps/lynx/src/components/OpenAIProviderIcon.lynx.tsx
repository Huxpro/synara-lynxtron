import openAiSvg from '@synara-provider-icons/openai.svg?raw';
import claudeSvg from '@synara-provider-icons/claudeai.svg?raw';
import cursorSvg from '@synara-provider-icons/cursor.svg?raw';
import antigravitySvg from '@synara-provider-icons/antigravity.svg?raw';
import grokSvg from '@synara-provider-icons/grok.svg?raw';
import openCodeSvg from '@synara-provider-icons/opencode.svg?raw';

import { useTheme } from '../adapters/useTheme.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';

const PROVIDER_SVG: Readonly<Record<string, string>> = {
  codex: openAiSvg,
  claudeAgent: claudeSvg,
  cursor: cursorSvg,
  antigravity: antigravitySvg,
  grok: grokSvg,
  opencode: openCodeSvg,
};

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
