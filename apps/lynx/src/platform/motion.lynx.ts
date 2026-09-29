import { useEffect, useState } from "@lynx-js/react";

import "./motion.lynx.css";

export const DISCLOSURE_TRANSITION_MS = 220;
export const DISCLOSURE_CLEANUP_BUFFER_MS = 40;

export const DISCLOSURE_SHELL_MOTION_CLASS = "LynxDisclosureMotion";
export const DISCLOSURE_SHELL_OPEN_CLASS = "LynxDisclosureMotion--open";
export const DISCLOSURE_SHELL_CLOSED_CLASS = "LynxDisclosureMotion--closed";
export const DISCLOSURE_INNER_CLASS = "LynxDisclosureInner";
export const DISCLOSURE_CONTENT_MOTION_CLASS = "LynxDisclosureMotion";
export const DISCLOSURE_CONTENT_OPEN_CLASS = "LynxDisclosureMotion--open";
export const DISCLOSURE_CONTENT_CLOSED_CLASS = "LynxDisclosureMotion--closed";
export const DISCLOSURE_CHEVRON_MOTION_CLASS = "LynxDisclosureChevron";

let reducedMotion = false;
const reducedMotionListeners = new Set<(value: boolean) => void>();

export function setLynxReducedMotion(value: boolean): void {
  if (reducedMotion === value) return;
  reducedMotion = value;
  for (const listener of reducedMotionListeners) listener(value);
}

function useLynxReducedMotion(): boolean {
  const [value, setValue] = useState(reducedMotion);
  useEffect(() => {
    "background only";
    reducedMotionListeners.add(setValue);
    return () => {
      reducedMotionListeners.delete(setValue);
    };
  }, []);
  return value;
}

function classNames(...values: ReadonlyArray<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function disclosureShellClassName(open: boolean, className?: string): string {
  return classNames(
    DISCLOSURE_SHELL_MOTION_CLASS,
    open ? DISCLOSURE_SHELL_OPEN_CLASS : DISCLOSURE_SHELL_CLOSED_CLASS,
    className,
  );
}

export function disclosureContentClassName(open: boolean, className?: string): string {
  return classNames(
    DISCLOSURE_CONTENT_MOTION_CLASS,
    open ? DISCLOSURE_CONTENT_OPEN_CLASS : DISCLOSURE_CONTENT_CLOSED_CLASS,
    className,
  );
}

export function disclosureChevronClassName(open: boolean, className?: string): string {
  return classNames(
    DISCLOSURE_CHEVRON_MOTION_CLASS,
    open ? "LynxDisclosureChevron--open" : undefined,
    className,
  );
}

/**
 * Lynx does not support Web's grid-row disclosure interpolation. Keep Sidebar
 * content mounted for the transform/opacity exit, but allow transcript callers
 * to opt out so list measurement and bottom-follow never observe an animated
 * intermediate height.
 */
export function useLynxDisclosurePresence(
  open: boolean,
  options: {
    readonly preserveOnClose?: boolean;
    readonly transitionMs?: number;
  } = {},
): boolean {
  const preserveOnClose = options.preserveOnClose ?? true;
  const transitionMs = options.transitionMs ?? DISCLOSURE_TRANSITION_MS;
  const prefersReducedMotion = useLynxReducedMotion();
  const [present, setPresent] = useState(open);

  useEffect(() => {
    "background only";
    if (open) {
      setPresent(true);
      return;
    }
    if (!present) return;
    if (!preserveOnClose || prefersReducedMotion) {
      setPresent(false);
      return;
    }
    const timeout = setTimeout(
      () => setPresent(false),
      transitionMs + DISCLOSURE_CLEANUP_BUFFER_MS,
    );
    return () => clearTimeout(timeout);
  }, [open, prefersReducedMotion, preserveOnClose, present, transitionMs]);

  return present;
}
