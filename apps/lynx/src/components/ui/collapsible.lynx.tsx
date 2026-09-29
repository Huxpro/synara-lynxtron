import { createContext, useContext, useState, type ReactNode } from "@lynx-js/react";

import { cx, renderSlot } from "./shared.lynx";
import { disclosureContentClassName, useLynxDisclosurePresence } from "../../platform/motion.lynx";
import "./primitives.css";

interface CollapsibleContextValue {
  readonly open: boolean;
  readonly toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue>({
  open: false,
  toggle: () => {},
});

export function Collapsible(props: {
  children?: ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false);
  const open = props.open ?? uncontrolledOpen;
  const toggle = () => {
    "background only";
    if (props.disabled) return;
    const next = !open;
    if (props.open === undefined) setUncontrolledOpen(next);
    props.onOpenChange?.(next);
  };
  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <view className={cx("LxCollapsible", props.className)}>{props.children}</view>
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger(props: {
  children?: ReactNode;
  render?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const collapsible = useContext(CollapsibleContext);
  return (
    <view
      className={cx("LxCollapsibleTrigger", props.className)}
      bindtap={props.disabled ? undefined : collapsible.toggle}
    >
      {renderSlot(props.render, props.children)}
    </view>
  );
}

export function CollapsiblePanel(props: {
  children?: ReactNode;
  className?: string;
  keepMounted?: boolean;
}) {
  const collapsible = useContext(CollapsibleContext);
  const present = useLynxDisclosurePresence(collapsible.open);
  if (!present && !props.keepMounted) return null;
  return (
    <view
      aria-hidden={!collapsible.open}
      className={disclosureContentClassName(
        collapsible.open,
        cx("LxCollapsiblePanel", props.className),
      )}
    >
      {props.children}
    </view>
  );
}

export const CollapsibleContent = CollapsiblePanel;
