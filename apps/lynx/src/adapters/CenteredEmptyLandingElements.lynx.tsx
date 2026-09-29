import type { ReactNode } from "@lynx-js/react";

import { SynaraLogo } from "~/components/SynaraLogo";
import "./centered-empty-landing-elements.css";

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function CenteredEmptyLandingFrameElement({
  className,
  children,
}: ChildrenProps & { readonly className?: string }) {
  return (
    <view className={`CenteredEmptyLandingFrame${className ? ` ${className}` : ""}`}>
      {children}
    </view>
  );
}

export function CenteredEmptyLandingLogoElement() {
  return <SynaraLogo className="CenteredEmptyLandingLogo" aria-label="Synara logo" />;
}

export function CenteredEmptyLandingHeadingElement({
  projectName,
}: {
  readonly projectName: string | null;
}) {
  return (
    <text
      className={`CenteredEmptyLandingHeading${
        projectName ? " CenteredEmptyLandingHeading--project" : ""
      }`}
    >
      {projectName ? (
        <>
          What should we do in <text className="CenteredEmptyLandingAccent">{projectName}</text>?
        </>
      ) : (
        "What should we work on?"
      )}
    </text>
  );
}
