import { useTheme } from "../adapters/useTheme.lynx";
import { CircleAlertIcon } from "../lib/icons.lynx";

export function PluginLibraryWarning(props: { readonly message: string }) {
  const { svgColors } = useTheme();
  return (
    <view className="PluginLibraryWarning">
      <CircleAlertIcon className="PluginLibraryWarningIcon" color={svgColors.warning} size={15} />
      <text className="PluginLibraryWarningText">{props.message}</text>
    </view>
  );
}
