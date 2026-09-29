import { Fragment, type ReactNode } from "react";

export function AppShellFrameElement({ children }: { readonly children?: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
