import type { ReactNode } from "@lynx-js/react";

import "./centered-empty-landing-stack-elements.css";

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function CenteredEmptyLandingViewportElement({
  children,
}: ChildrenProps & { readonly className?: string }) {
  return <view className="SharedEmptyLandingViewport">{children}</view>;
}

export function CenteredEmptyLandingStackElement({ children }: ChildrenProps) {
  return <view className="SharedEmptyLandingStack">{children}</view>;
}
