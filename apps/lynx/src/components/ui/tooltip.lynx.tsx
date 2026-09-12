import {
  createContext,
  Fragment,
  useContext,
  useState,
  type ReactNode,
} from '@lynx-js/react';

import { cx, renderSlot, textContent } from './shared.lynx';
import './primitives.css';

interface TooltipContextValue {
  open: boolean;
  toggle: () => void;
}

const TooltipContext = createContext<TooltipContextValue>({
  open: false,
  toggle: () => {},
});

export function Tooltip(props: {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false);
  const open = props.open ?? uncontrolledOpen;
  const toggle = () => {
    'background only';
    const next = !open;
    if (props.open === undefined) setUncontrolledOpen(next);
    props.onOpenChange?.(next);
  };
  return (
    <TooltipContext.Provider value={{ open, toggle }}>
      <view className="LxTooltipRoot">{props.children}</view>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger(props: {
  children?: ReactNode;
  render?: ReactNode;
  className?: string;
}) {
  const tooltip = useContext(TooltipContext);
  return (
    <view className={cx('LxTooltipTrigger', props.className)} bindtap={tooltip.toggle}>
      {renderSlot(props.render, props.children)}
    </view>
  );
}

export function TooltipPopup(props: {
  children?: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  variant?: 'default' | 'picker';
}) {
  const tooltip = useContext(TooltipContext);
  if (!tooltip.open) return null;
  return (
    <view
      className={cx(
        'LxTooltipPopup',
        props.variant === 'picker' && 'LxTooltipPopup--picker',
        props.className
      )}
    >
      {textContent(props.children, 'LxTooltipText')}
    </view>
  );
}

export function TooltipProvider(props: { children?: ReactNode }) {
  return <Fragment>{props.children}</Fragment>;
}

export const TooltipCreateHandle = undefined;
