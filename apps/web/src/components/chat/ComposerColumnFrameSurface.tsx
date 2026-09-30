// FILE: ComposerColumnFrameSurface.tsx
// Purpose: Portable composer max-width frame shared by Web and Lynx.
// Layer: Chat composer layout

import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { ComposerColumnFrameSurfaceElement } from "~/components/chat/ComposerColumnFrameSurfaceElements";
import { COMPOSER_COLUMN_FRAME_CLASS_NAME } from "./composerPickerStyles";

export function ComposerColumnFrameSurface({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
}) {
  return (
    <ComposerColumnFrameSurfaceElement className={cn(COMPOSER_COLUMN_FRAME_CLASS_NAME, className)}>
      {children}
    </ComposerColumnFrameSurfaceElement>
  );
}
