import {
  CenteredEmptyLandingFrameElement,
  CenteredEmptyLandingHeadingElement,
  CenteredEmptyLandingLogoElement,
} from "~/components/CenteredEmptyLandingElements";

export interface CenteredEmptyLandingProps {
  readonly className?: string | undefined;
  readonly projectName?: string | null | undefined;
}

export function CenteredEmptyLanding({ className, projectName = null }: CenteredEmptyLandingProps) {
  return (
    <CenteredEmptyLandingFrameElement className={className}>
      <CenteredEmptyLandingLogoElement />
      <CenteredEmptyLandingHeadingElement projectName={projectName} />
    </CenteredEmptyLandingFrameElement>
  );
}
