import type { ReactNode } from "react";

export function ComposerColumnFrameSurfaceElement({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
}) {
  return <div className={className}>{children}</div>;
}
