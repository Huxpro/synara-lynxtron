import type { ReactNode } from "@lynx-js/react";

import "./app-shell-frame-elements.css";

export function AppShellFrameElement({ children }: { readonly children?: ReactNode }) {
  return <view className="SharedAppShellFrame">{children}</view>;
}
