import {
  useEffect,
  useState,
  type ReactNode,
} from '@lynx-js/react';

import {
  useLynxDisclosurePresence,
} from '../platform/motion';
import { LynxInteractionScope } from '../components/ui/interaction-scope.lynx';
import './sidebar-disclosure.css';

export function SidebarDisclosure(props: {
  readonly children: ReactNode;
  readonly open: boolean;
}) {
  const present = useLynxDisclosurePresence(props.open);
  const [revealed, setRevealed] = useState(props.open);

  useEffect(() => {
    'background only';
    if (!props.open || !present) {
      setRevealed(false);
      return;
    }
    const timeout = setTimeout(() => setRevealed(true), 0);
    return () => clearTimeout(timeout);
  }, [present, props.open]);

  if (!present) return null;
  const interactive = props.open && revealed;
  return (
    <view
      className={`SidebarDisclosure${
        revealed
          ? ' SidebarDisclosure--open'
          : ' SidebarDisclosure--closed'
      }`}
      aria-hidden={!interactive}
      accessibility-elements-hidden={!interactive}
    >
      <view className="SidebarDisclosureInner">
        <LynxInteractionScope disabled={!interactive}>
          {props.children}
        </LynxInteractionScope>
      </view>
    </view>
  );
}
