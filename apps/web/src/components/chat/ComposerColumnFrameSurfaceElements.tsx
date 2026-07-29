import type { ReactNode } from "react";

export function ComposerColumnFrameSurfaceElement({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={className}>{children}</div>;
}
