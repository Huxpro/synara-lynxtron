import { useTheme } from "../adapters/useTheme.lynx";
import { XIcon } from "../lib/icons.lynx";

export function NotificationDismissIcon() {
  const { svgColors } = useTheme();
  return <XIcon color={svgColors.foreground65} size={12} />;
}
