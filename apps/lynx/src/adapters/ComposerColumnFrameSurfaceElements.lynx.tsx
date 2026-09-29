import type { ReactNode } from "@lynx-js/react";

import "./composer-column-frame-surface-elements.css";

export function ComposerColumnFrameSurfaceElement({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <view className={`ComposerColumnFrameSurfaceLynx ${className ?? ""}`}>{children}</view>;
}
