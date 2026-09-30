import type { ComponentProps } from "react";

export function ChatSurfaceHeaderFrameElement({
  padded: _padded,
  ...props
}: ComponentProps<"header"> & { readonly padded?: boolean | undefined }) {
  return <header {...props} />;
}
