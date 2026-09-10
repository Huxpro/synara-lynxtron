import type { ReactNode } from '@lynx-js/react';

import { cx } from './shared.lynx';
import './primitives.css';

export function Skeleton(props: { readonly children?: ReactNode; readonly className?: string }) {
  return <view aria-hidden="true" className={cx('LxSkeleton', props.className)}>{props.children}</view>;
}
