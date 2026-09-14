import type { ReactNode } from '@lynx-js/react';

import { useTheme } from '../../adapters/useTheme.lynx';
import { cx, textContent } from './shared.lynx';
import './primitives.css';

export function Alert(props: { readonly children?: ReactNode; readonly className?: string; readonly size?: 'sm' | 'default'; readonly variant?: 'default' | 'error' | 'info' | 'success' | 'warning'; readonly accessibilityLabel?: string }) {
  const { svgColors } = useTheme();
  const semanticStyle = {
    default: { backgroundColor: svgColors.alertDefaultSurface },
    error: { backgroundColor: svgColors.alertErrorSurface, borderColor: svgColors.alertErrorBorder },
    info: { backgroundColor: svgColors.alertInfoSurface, borderColor: svgColors.alertInfoBorder },
    success: { backgroundColor: svgColors.alertSuccessSurface, borderColor: svgColors.alertSuccessBorder },
    warning: { backgroundColor: svgColors.alertWarningSurface, borderColor: svgColors.alertWarningBorder },
  }[props.variant ?? 'default'];
  return <view className={cx('LxAlert', `LxAlert--${props.size ?? 'default'}`, `LxAlert--${props.variant ?? 'default'}`, props.className)} style={semanticStyle} accessibility-element accessibility-label={props.accessibilityLabel} accessibility-role="alert">{props.children}</view>;
}
export function AlertTitle(props: { readonly children?: ReactNode; readonly className?: string }) { return <>{textContent(props.children, cx('LxAlertTitle', props.className))}</>; }
export function AlertDescription(props: { readonly children?: ReactNode; readonly className?: string }) { return <view className={cx('LxAlertDescription', props.className)}>{props.children}</view>; }
export function AlertAction(props: { readonly children?: ReactNode; readonly className?: string }) { return <view className={cx('LxAlertAction', props.className)}>{props.children}</view>; }
