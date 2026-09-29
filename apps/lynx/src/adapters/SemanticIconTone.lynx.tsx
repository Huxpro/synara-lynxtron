import type { SemanticIconTone as SemanticIconToneName } from "@synara/shared/semanticIconTone";
import { semanticIconToneColor } from "@synara/shared/semanticIconTone";
import { CopyIcon } from "../lib/icons.lynx";
import { useTheme } from "./useTheme.lynx";

export function SemanticIconTone(props: { readonly tone: SemanticIconToneName }) {
  const { svgColors } = useTheme();
  const color = {
    primary: svgColors.iconPrimary,
    secondary: svgColors.iconSecondary,
    tertiary: svgColors.iconTertiary,
    accent: svgColors.iconAccent,
    inverse: svgColors.inverse,
    disabled: svgColors.disabled,
  }[props.tone];
  return (
    <view className="SemanticIconToneLynx" data-icon-tone={props.tone}>
      <view
        className={`SemanticIconToneGlyphLynx${
          props.tone === "inverse" ? " SemanticIconToneGlyphLynx--inverse" : ""
        }`}
      >
        <CopyIcon size={16} color={color ?? semanticIconToneColor(props.tone)} />
      </view>
      <text className="SemanticIconToneLabelLynx">{props.tone}</text>
    </view>
  );
}
