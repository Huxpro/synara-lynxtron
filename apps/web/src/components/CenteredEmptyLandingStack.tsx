import type { ReactNode } from "react";

import {
  CenteredEmptyLandingStackElement,
  CenteredEmptyLandingViewportElement,
} from "~/components/CenteredEmptyLandingStackElements";

export function CenteredEmptyLandingStack({
  className,
  children,
}: {
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <CenteredEmptyLandingViewportElement className={className}>
      <CenteredEmptyLandingStackElement>{children}</CenteredEmptyLandingStackElement>
    </CenteredEmptyLandingViewportElement>
  );
}
