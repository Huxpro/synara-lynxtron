import type { ReactNode } from '@lynx-js/react';

import openAiSvg from '@synara-provider-icons/openai.svg?raw';
import claudeSvg from '@synara-provider-icons/claudeai.svg?raw';
import cursorSvg from '@synara-provider-icons/cursor.svg?raw';
import antigravitySvg from '@synara-provider-icons/antigravity.svg?raw';
import grokSvg from '@synara-provider-icons/grok.svg?raw';
import openCodeSvg from '@synara-provider-icons/opencode.svg?raw';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from './useTheme.lynx';
import './sidebar-thread-provider-identity-elements.css';

const PROVIDER_SVG: Readonly<Record<string, string>> = {
  codex: openAiSvg,
  claudeAgent: claudeSvg,
  cursor: cursorSvg,
  antigravity: antigravitySvg,
  grok: grokSvg,
  opencode: openCodeSvg,
};

export function SidebarThreadProviderIdentityContainerElement({
  handoff,
  children,
}: {
  readonly handoff: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <view
      className={`SharedSidebarProviderIdentity${
        handoff ? ' SharedSidebarProviderIdentity--handoff' : ''
      }`}
    >
      {children}
    </view>
  );
}

export function SidebarThreadProviderIdentityIconElement({
  provider,
  placement,
}: {
  readonly provider: string;
  readonly placement: 'single' | 'source' | 'target';
}) {
  const { semanticIconColor } = useTheme();
  const source = PROVIDER_SVG[provider];
  const content = source
    ? colorizeLynxSvg(source, semanticIconColor('primary'))
    : undefined;
  return (
    <view
      className={`SharedSidebarProviderIcon SharedSidebarProviderIcon--${placement}`}
    >
      {content ? (
        <svg className="SharedSidebarProviderIconSvg" content={content} />
      ) : (
        <text className="SharedSidebarProviderIconFallback">
          {provider.slice(0, 1).toUpperCase()}
        </text>
      )}
    </view>
  );
}
