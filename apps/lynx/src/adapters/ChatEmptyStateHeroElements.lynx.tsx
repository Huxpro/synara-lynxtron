import type { ReactNode } from '@lynx-js/react';

import { SynaraLogo } from '~/components/SynaraLogo';
import './chat-empty-state-hero-elements.css';

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function ChatEmptyStateHeroFrameElement(props: ChildrenProps) {
  return <view className="SharedChatEmptyHero">{props.children}</view>;
}

export function ChatEmptyStateHeroLogoElement() {
  return <SynaraLogo aria-label="Synara logo" className="SharedChatEmptyHeroLogo" />;
}

export function ChatEmptyStateHeroTextFrameElement(props: ChildrenProps) {
  return <view className="SharedChatEmptyHeroTextFrame">{props.children}</view>;
}

export function ChatEmptyStateHeroHeadingElement(props: ChildrenProps) {
  return <text className="SharedChatEmptyHeroHeading">{props.children}</text>;
}

export function ChatEmptyStateHeroProjectElement(props: ChildrenProps) {
  return <text className="SharedChatEmptyHeroProject">{props.children}</text>;
}
