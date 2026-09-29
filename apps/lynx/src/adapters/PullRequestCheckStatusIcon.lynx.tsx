import circleCheckSvg from "@synara-central-icons-fill/circle-check.svg?raw";
import circleXSvg from "@synara-central-icons-fill/circle-x.svg?raw";
import loaderSvg from "@synara-central-icons-fill/loader.svg?raw";
import type { PullRequestCheckStatus } from "@synara/contracts";

import { useTheme } from "./useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";

export function PullRequestCheckStatusIcon(props: { readonly status: PullRequestCheckStatus }) {
  const { activeTheme, semanticIconColor, svgColors } = useTheme();
  if (props.status === "skipped" || props.status === "neutral") {
    return (
      <view
        className="SharedPrSummaryCheckStatusIcon SharedPrSummaryCheckStatusIcon--neutral"
        accessibility-element={false}
      />
    );
  }
  const content =
    props.status === "pending"
      ? loaderSvg
      : props.status === "success"
        ? circleCheckSvg
        : circleXSvg;
  const color =
    props.status === "pending"
      ? svgColors.warning
      : props.status === "success"
        ? activeTheme.theme.semanticColors.diffAdded
        : activeTheme.theme.semanticColors.diffRemoved;
  return (
    <svg
      className={`SharedPrSummaryCheckStatusIcon${
        props.status === "pending" ? " SharedPrSummaryCheckStatusIcon--pending" : ""
      }`}
      content={colorizeLynxSvg(content, color ?? semanticIconColor("secondary"))}
      accessibility-element={false}
    />
  );
}
