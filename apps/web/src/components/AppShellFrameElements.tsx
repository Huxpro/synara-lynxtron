import { Fragment, type ReactNode } from "react";

export function AppShellFrameElement({ children }: { readonly children?: ReactNode | undefined }) {
  return <Fragment>{children}</Fragment>;
}
