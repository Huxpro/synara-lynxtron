import type { ReactNode } from '@lynx-js/react';

import { cx, textContent } from './shared.lynx';
import './primitives.css';

export function Badge(props: {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly shape?: 'default' | 'capsule';
  readonly size?: 'sm' | 'default' | 'lg';
  readonly variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'error' | 'info' | 'success' | 'warning';
}) {
  return <view className={cx('LxBadge', `LxBadge--${props.size ?? 'default'}`, `LxBadge--${props.variant ?? 'default'}`, props.shape === 'capsule' && 'LxBadge--capsule', props.className)}>{textContent(props.children, 'LxBadge__text')}</view>;
}
