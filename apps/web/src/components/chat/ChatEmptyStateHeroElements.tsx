// FILE: ChatEmptyStateHeroElements.tsx
// Purpose: Web host elements for the physically shared blank-transcript hero.

import type { ReactNode } from "react";

import { SynaraLogo } from "~/components/SynaraLogo";

interface ChildrenProps {
  readonly children?: ReactNode | undefined;
}

export function ChatEmptyStateHeroFrameElement(props: ChildrenProps) {
  return <div className="flex flex-col items-center gap-5 select-none">{props.children}</div>;
}

export function ChatEmptyStateHeroLogoElement() {
  return <SynaraLogo aria-label="Synara logo" className="size-10" />;
}

export function ChatEmptyStateHeroTextFrameElement(props: ChildrenProps) {
  return <div className="flex flex-col items-center gap-0.5">{props.children}</div>;
}

export function ChatEmptyStateHeroHeadingElement(props: ChildrenProps) {
  return <h1 className="text-2xl font-semibold text-foreground/90">{props.children}</h1>;
}

export function ChatEmptyStateHeroProjectElement(props: ChildrenProps) {
  return <span className="text-lg text-muted-foreground/40">{props.children}</span>;
}
