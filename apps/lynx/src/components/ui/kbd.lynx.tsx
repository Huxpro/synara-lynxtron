import type { ReactNode } from '@lynx-js/react';

import { cx, textContent } from './shared.lynx';
import './primitives.css';

export function Kbd(props: { children?: ReactNode; className?: string }) {
  return (
    <view className={cx('LxKbd', props.className)}>
      {textContent(props.children, 'LxKbd__text')}
    </view>
  );
}

export function KbdGroup(props: { children?: ReactNode; className?: string }) {
  return <view className={cx('LxKbdGroup', props.className)}>{props.children}</view>;
}
