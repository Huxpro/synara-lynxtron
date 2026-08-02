import type { ReactNode } from '@lynx-js/react';

import {
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';

export function SidebarProjectDisclosureRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="AppSidebarProject">{props.children}</view>;
}

export function SidebarProjectDisclosureBodyElement(props: {
  readonly expanded: boolean;
  readonly children?: ReactNode;
}) {
  const present = useLynxDisclosurePresence(props.expanded);
  if (!present) return null;
  return (
    <view
      className={disclosureContentClassName(
        props.expanded,
        'AppSidebarProjectBody'
      )}
    >
      {props.children}
    </view>
  );
}
