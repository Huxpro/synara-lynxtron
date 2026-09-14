import { Undo2Icon } from '../lib/icons.lynx';
import { useTheme } from './useTheme.lynx';

export function SettingsResetIcon() {
  const { svgColors } = useTheme();
  return <Undo2Icon size={14} color={svgColors.mutedForeground80} />;
}
