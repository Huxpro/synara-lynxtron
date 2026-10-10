import type { ReactNode } from "@lynx-js/react";

import { SynaraLogo } from "~/components/SynaraLogo";
import {
  landingProjectHeadingLabel,
  requestLandingProjectPicker,
} from "../components/composer/landingProjectPickerRequest.logic";
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

function openLandingProjectPicker() {
  "background only";
  requestLandingProjectPicker();
}

export function CenteredEmptyLandingHeadingElement({
  projectName,
}: {
  readonly projectName: string | null;
}) {
  const plainHeading = projectName
    ? landingProjectHeadingLabel(projectName)
    : "What should we work on?";
  return (
    // Upstream's <h2> is a centred block: as wide as its one-line text, or the whole column
    // once it wraps. A Lynx text that wraps shrinks to its widest line instead, so a
    // zero-height one-line copy sizes the box and the visible heading fills it.
    <view
      className="CenteredEmptyLandingHeadingBox"
      // Upstream names the project heading explicitly (its project combobox drops out of
      // the computed name); the plain heading is named by its own text there.
      accessibility-element={projectName ? true : undefined}
      accessibility-label={projectName ? plainHeading : undefined}
      accessibility-trait={projectName ? "header" : undefined}
    >
      <text
        className="CenteredEmptyLandingHeading CenteredEmptyLandingHeadingSizer"
        accessibility-element={false}
        text-maxline="1"
      >
        {plainHeading}
      </text>
      <text className="CenteredEmptyLandingHeading">
        {projectName ? (
          <>
            What should we do in{" "}
            <text className="CenteredEmptyLandingAccent" bindtap={openLandingProjectPicker}>
              {projectName}
            </text>
            ?
          </>
        ) : (
          plainHeading
        )}
      </text>
    </view>
  );
}
