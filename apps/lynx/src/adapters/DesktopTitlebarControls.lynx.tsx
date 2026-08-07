import sidebarToggleSvg from '@synara-central-icons/sidebar-hidden-left-wide.svg?raw';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import { useTheme } from './useTheme.lynx';
import './desktop-titlebar-controls.css';

const arrowForwardSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M295.6 163.7c-5.1 5-5.1 13.3-.1 18.4l60.8 60.9H124.9c-7.1 0-12.9 5.8-12.9 13s5.8 13 12.9 13h231.3l-60.8 60.9c-5 5.1-4.9 13.3.1 18.4 5.1 5 13.2 5 18.3-.1l82.4-83c1.1-1.2 2-2.5 2.7-4.1.7-1.6 1-3.3 1-5 0-3.4-1.3-6.6-3.7-9.1l-82.4-83c-4.9-5.2-13.1-5.3-18.2-.3z"/></svg>';

function TitlebarControl(props: {
  readonly accessibleLabel: string;
  readonly className: string;
  readonly foregroundContent: string;
  readonly secondaryContent: string;
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `${props.className}${
      props.disabled ? ' DesktopTitlebarControl--disabled' : ''
    }`,
    accessibleLabel: props.accessibleLabel,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.accessibleLabel}
      {...interaction.eventProps}
    >
      <svg
        className="DesktopTitlebarControlIcon DesktopTitlebarControlIcon--secondary"
        content={props.secondaryContent}
      />
      <svg
        className="DesktopTitlebarControlIcon DesktopTitlebarControlIcon--foreground"
        content={props.foregroundContent}
      />
    </view>
  );
}

export function DesktopTitlebarControls(props: {
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly placement: 'closed' | 'open';
  readonly onGoBack: () => void;
  readonly onGoForward: () => void;
  readonly onToggleSidebar: () => void;
}) {
  const { svgColors } = useTheme();
  const secondary = svgColors.secondaryForeground;
  const foreground = svgColors.foreground;
  const sidebarSecondary = colorizeLynxSvg(sidebarToggleSvg, secondary);
  const sidebarForeground = colorizeLynxSvg(sidebarToggleSvg, foreground);
  const arrowSecondary = colorizeLynxSvg(arrowForwardSvg, secondary);
  const arrowForeground = colorizeLynxSvg(arrowForwardSvg, foreground);
  return (
    <view
      className={`DesktopTitlebarControls DesktopTitlebarControls--${props.placement}`}
    >
      <TitlebarControl
        accessibleLabel="Toggle thread sidebar"
        className="DesktopTitlebarControl DesktopTitlebarControl--toggle"
        secondaryContent={sidebarSecondary}
        foregroundContent={sidebarForeground}
        onActivate={props.onToggleSidebar}
      />
      <TitlebarControl
        accessibleLabel="Back"
        className="DesktopTitlebarControl DesktopTitlebarControl--navigation DesktopTitlebarControl--back"
        secondaryContent={arrowSecondary}
        foregroundContent={arrowForeground}
        disabled={!props.canGoBack}
        onActivate={props.onGoBack}
      />
      <TitlebarControl
        accessibleLabel="Forward"
        className="DesktopTitlebarControl DesktopTitlebarControl--navigation"
        secondaryContent={arrowSecondary}
        foregroundContent={arrowForeground}
        disabled={!props.canGoForward}
        onActivate={props.onGoForward}
      />
    </view>
  );
}
