import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

interface ChildrenProps {
  readonly children?: ReactNode | undefined;
}

export function CenteredEmptyLandingViewportElement({
  className,
  children,
}: ChildrenProps & { readonly className?: string | undefined }) {
  return (
    <div className={cn("chat-pane-enter flex flex-1 items-center justify-center", className)}>
      {children}
    </div>
  );
}

export function CenteredEmptyLandingStackElement({ children }: ChildrenProps) {
  return <div className="flex w-full flex-col justify-center">{children}</div>;
}
