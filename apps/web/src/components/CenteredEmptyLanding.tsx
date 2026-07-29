import {
  CenteredEmptyLandingFrameElement,
  CenteredEmptyLandingHeadingElement,
  CenteredEmptyLandingLogoElement,
} from "~/components/CenteredEmptyLandingElements";

export interface CenteredEmptyLandingProps {
  readonly className?: string;
  readonly projectName?: string | null;
}

export function CenteredEmptyLanding({
  className,
  projectName = null,
}: CenteredEmptyLandingProps) {
  return (
    <CenteredEmptyLandingFrameElement className={className}>
      <CenteredEmptyLandingLogoElement />
      <CenteredEmptyLandingHeadingElement projectName={projectName} />
    </CenteredEmptyLandingFrameElement>
  );
}
