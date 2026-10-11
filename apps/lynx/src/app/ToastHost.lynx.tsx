import { useEffect, useMemo, useState, useSyncExternalStore } from "@lynx-js/react";
import type { ThreadId } from "@synara/contracts";
import {
  DEFAULT_TOAST_TIMEOUT_MS,
  shouldUseCompactToast,
} from "@synara-web/components/ui/toast.logic";
import {
  resolveVisibleToastThreadIds,
  shouldRenderToastForVisibleThreads,
} from "@synara-web/components/ui/toastRouteVisibility";
import { selectRightDockState, useRightDockStore } from "@synara-web/rightDockStore";
import { Button } from "../components/ui/button.lynx";
import { IconButton } from "../components/ui/icon-button.lynx";
import {
  readLynxToasts,
  subscribeLynxToasts,
  toastManager,
  type LynxToast,
  type LynxToastActionProps,
} from "../components/ui/toast.lynx";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { NotificationCard } from "./NotificationCard.lynx";
import { NotificationDismissIcon } from "./NotificationDismissIcon.lynx";

interface ToastData {
  readonly threadId?: ThreadId;
  readonly allowCrossThreadVisibility?: boolean;
  readonly compactContextual?: boolean;
  readonly dismissAfterVisibleMs?: number;
  readonly onClose?: () => void;
  readonly copyText?: string;
  readonly copyItems?: readonly { label: string; text: string }[];
  readonly secondaryActionProps?: LynxToastActionProps;
}
function dataFor(toast: LynxToast): ToastData {
  return toast.data && typeof toast.data === "object" ? (toast.data as ToastData) : {};
}
function copy(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
const lifetimes = new Map<string, { remaining: number; duration: number }>();

function ToastItem(props: {
  toast: LynxToast;
  visible: boolean;
  paused: boolean;
  active: boolean;
  onHeight: (height: number) => void;
}) {
  const { toast } = props;
  const data = dataFor(toast);
  const compact = shouldUseCompactToast({ ...toast, data });
  const { svgColors } = useTheme();
  const duration = data.dismissAfterVisibleMs ?? toast.timeout ?? DEFAULT_TOAST_TIMEOUT_MS;
  useEffect(() => {
    "background only";
    if (toast.type === "loading" || duration <= 0) return;
    let lifetime = lifetimes.get(toast.id);
    if (!lifetime || lifetime.duration !== duration) {
      lifetime = { remaining: duration, duration };
      lifetimes.set(toast.id, lifetime);
    }
    if (!props.active || props.paused || (data.dismissAfterVisibleMs && !props.visible)) return;
    const started = Date.now();
    const timer = setTimeout(() => {
      toastManager.close(toast.id);
      lifetimes.delete(toast.id);
    }, lifetime.remaining);
    return () => {
      clearTimeout(timer);
      lifetime.remaining = Math.max(0, lifetime.remaining - (Date.now() - started));
    };
  }, [
    toast.id,
    toast.type,
    duration,
    data.dismissAfterVisibleMs,
    props.active,
    props.paused,
    props.visible,
  ]);
  if (!props.visible) return null;
  const Icon = {
    error: CircleAlertIcon,
    warning: TriangleAlertIcon,
    info: InfoIcon,
    success: CircleCheckIcon,
    loading: LoaderCircleIcon,
  }[toast.type ?? ""];
  const dismiss = () => {
    data.onClose?.();
    toastManager.close(toast.id);
  };
  const copyText = async (value: string) => {
    "background only";
    const { clipboard } = await import(/* webpackMode: "eager" */ "../platform/clipboard");
    await clipboard.writeText(value);
  };
  const actions = [toast.actionProps, data.secondaryActionProps].filter(Boolean);
  return (
    <NotificationCard
      className={`LynxToast${compact ? " LynxToast--compact" : ""}${toast.type === "error" ? " LynxToast--error" : ""}`}
      label={copy(toast.title)}
      onHeight={props.onHeight}
      icon={
        Icon ? (
          <Icon
            className="LynxToastIcon"
            size={compact ? 14 : 16}
            color={toast.type === "error" ? svgColors.statusError : svgColors.foreground}
          />
        ) : null
      }
      title={<text className="LynxToastTitle">{copy(toast.title)}</text>}
      description={
        !compact || data.compactContextual ? (
          <text className="LynxToastDescription">{copy(toast.description)}</text>
        ) : null
      }
      actions={
        actions.length || data.copyText || data.copyItems?.length ? (
          <view className="LynxToastActions">
            {data.copyText ? (
              <Button size="xs" variant="ghost" onClick={() => void copyText(data.copyText!)}>
                Copy
              </Button>
            ) : null}
            {data.copyItems?.map((item) => (
              <Button
                key={item.label}
                size="xs"
                variant="ghost"
                onClick={() => void copyText(item.text)}
              >
                {item.label}
              </Button>
            ))}
            {actions.map((action, index) => (
              <Button
                className="LynxToastAction"
                key={index}
                size="xs"
                variant="ghost"
                onClick={() => action?.onClick?.()}
              >
                {copy(action?.children)}
              </Button>
            ))}
          </view>
        ) : null
      }
      close={
        <IconButton className="LynxToastClose" label="Dismiss toast" onClick={dismiss}>
          <NotificationDismissIcon />
        </IconButton>
      }
    />
  );
}

/** App-level sink consumer: survives composer unmounts and filters thread scope. */
export function ToastHost(props: {
  readonly activeThreadId: string | null;
  readonly rightDockRendered?: boolean;
}) {
  const toasts = useSyncExternalStore(subscribeLynxToasts, readLynxToasts, readLynxToasts);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [heights, setHeights] = useState<Readonly<Record<string, number>>>({});
  const dock = useRightDockStore(
    useMemo(
      () => selectRightDockState(props.activeThreadId as ThreadId | null),
      [props.activeThreadId],
    ),
  );
  const visibleThreads = resolveVisibleToastThreadIds({
    activeThreadId: props.activeThreadId as ThreadId | null,
    splitView: null,
    rightDockRendered: props.rightDockRendered ?? true,
    rightDockState: dock,
  });
  useEffect(() => {
    "background only";
    let disposed = false;
    let eventSeen = false;
    let unsubscribe: (() => void) | undefined;
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(async ({ onGlobalEvent, bridgeCall }) => {
        if (disposed) return;
        unsubscribe = onGlobalEvent("notification:window-active", (value: unknown) => {
          eventSeen = true;
          if (!disposed) setActive(value === true);
        });
        const value = await bridgeCall<{ active: boolean }>("notificationWindowActive");
        if (!disposed && !eventSeen) setActive(value.active === true);
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);
  useEffect(() => {
    const ids = new Set(toasts.map((toast) => toast.id));
    for (const id of lifetimes.keys()) if (!ids.has(id)) lifetimes.delete(id);
  }, [toasts]);
  const ordered = [...toasts].reverse();
  const visible = ordered.filter((toast) =>
    shouldRenderToastForVisibleThreads({
      ...dataFor(toast),
      toastThreadId: dataFor(toast).threadId,
      visibleThreadIds: visibleThreads,
    }),
  );
  const shown = visible.slice(0, 3);
  return (
    <view
      className="LynxToastStack"
      bindmouseenter={() => setPaused(true)}
      bindmouseleave={() => setPaused(false)}
    >
      {ordered.map((toast) => {
        const index = shown.findIndex((item) => item.id === toast.id);
        const offset = paused
          ? shown
              .slice(0, Math.max(0, index))
              .reduce((sum, item) => sum + (heights[item.id] ?? 0) + 8, 0)
          : Math.max(0, index) * 8;
        return (
          <view
            key={toast.id}
            className={`LynxToastPosition${index === 0 ? " LynxToastPosition--front" : ""}${!paused && index > 0 ? " LynxToastPosition--collapsed" : ""}`}
            style={{
              top: `${offset}px`,
              zIndex: 3 - index,
              transform: paused ? "scale(1)" : `scale(${1 - Math.max(0, index) * 0.05})`,
            }}
          >
            <ToastItem
              toast={toast}
              active={active}
              paused={paused}
              visible={index >= 0}
              onHeight={(height) =>
                setHeights((current) =>
                  current[toast.id] === height ? current : { ...current, [toast.id]: height },
                )
              }
            />
          </view>
        );
      })}
    </view>
  );
}
