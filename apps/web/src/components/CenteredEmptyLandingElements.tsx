import type { ReactNode } from "react";

import { COMPOSER_MUTED_ACCENT_TEXT_CLASS_NAME } from "~/components/chat/composerPickerStyles";
import { SynaraLogo } from "~/components/SynaraLogo";
import { cn } from "~/lib/utils";

interface ChildrenProps {
  readonly children?: ReactNode | undefined;
}

export function CenteredEmptyLandingFrameElement({
  className,
  children,
}: ChildrenProps & { readonly className?: string | undefined }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-6 pb-5 text-center select-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CenteredEmptyLandingLogoElement() {
  return <SynaraLogo aria-label="Synara logo" className="size-10" />;
}

export function CenteredEmptyLandingHeadingElement({
  projectName,
}: {
  readonly projectName: string | null;
}) {
  return (
    <h2
      data-testid="empty-landing-heading"
      className="text-[26px] font-normal leading-[1.15] tracking-[-0.015em] text-foreground/95 sm:text-[30px]"
    >
      {projectName ? (
        <>
          What should we do in{" "}
          <span className={COMPOSER_MUTED_ACCENT_TEXT_CLASS_NAME}>{projectName}</span>?
        </>
      ) : (
        "What should we work on?"
      )}
    </h2>
  );
}
