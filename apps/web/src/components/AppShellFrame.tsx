import type { ReactNode } from "react";

import { AppShellFrameElement } from "~/components/AppShellFrameElements";

export function AppShellFrame({
  sidebar,
  children,
}: {
  readonly sidebar: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <AppShellFrameElement>
      {sidebar}
      {children}
    </AppShellFrameElement>
  );
}
