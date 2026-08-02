// FILE: ThemePackEditorCompositionElements.tsx
// Purpose: Browser interaction elements beneath the shared theme-pack editor.

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HexColorPicker } from "react-colorful";
import { copyTextToClipboard } from "~/platform/clipboard";
import { useUniqueId } from "~/hooks/useUniqueId";
import { cn } from "../../lib/utils";
import type {
  ChromeTheme,
  ThemeVariant,
} from "../../theme/theme.logic";
import {
  SETTINGS_CARD_CLASS_NAME,
  SETTINGS_CARD_ROW_CLASS_NAME,
  SETTINGS_CONTROL_RADIUS_CLASS_NAME,
} from "../../settingsPanelStyles";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { Select, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { toastManager } from "../ui/toast";
import { SettingsSelectPopup } from "./SettingsPanelPrimitives";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const COLOR_PICKER_COMMIT_DELAY_MS = 220;

export function ThemePackRootElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <div className={cn(SETTINGS_CARD_CLASS_NAME, "overflow-hidden")}>
      {props.children}
    </div>
  );
}

export function ThemePackHeaderElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-3 sm:py-3.5">
      {props.children}
    </div>
  );
}

export function ThemePackTitleElement(props: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="mr-auto flex items-center gap-2">
      <h3 className="text-sm font-medium text-foreground">{props.title}</h3>
      {props.children}
    </div>
  );
}

export function ThemePackResetActionElement(props: {
  readonly onReset: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onReset}
      className="rounded-md px-1.5 py-0.5 text-[11px] text-[var(--color-text-foreground-secondary)] transition-colors hover:bg-[var(--color-background-elevated-secondary)] hover:text-[var(--color-text-foreground)]"
    >
      Reset
    </button>
  );
}

export function ThemePackImportActionElement(props: {
  readonly variant: ThemeVariant;
  readonly onImport: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    try {
      props.onImport(value);
      toastManager.add({
        type: "success",
        title: "Theme imported",
        description: `Updated the ${props.variant} theme pack.`,
      });
      setValue("");
      setError(null);
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to import that theme string.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-[var(--color-text-foreground-secondary)] transition-colors hover:bg-[var(--color-background-elevated-secondary)] hover:text-[var(--color-text-foreground)]"
          >
            Import
          </button>
        }
      />
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import {props.variant} theme</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Paste a{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-chat-code">
              codex-theme-v1:
            </code>{" "}
            share string. The embedded variant must match {props.variant}, and
            the selected code theme must exist for that variant.
          </p>
        </DialogHeader>
        <DialogPanel>
          <Textarea
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            placeholder='codex-theme-v1:{"codeThemeId":"linear",...}'
            spellCheck={false}
            rows={5}
            className="font-chat-code text-[11px]"
            aria-label="Theme share string"
          />
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </DialogPanel>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button" size="sm">
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            size="sm"
            disabled={value.trim().length === 0}
            onClick={submit}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export function ThemePackCopyActionElement(props: {
  readonly variant: ThemeVariant;
  readonly shareString: string;
}) {
  const copy = async () => {
    try {
      await copyTextToClipboard(props.shareString);
      toastManager.add({
        type: "success",
        title: "Theme copied",
        description: `Copied the ${props.variant} theme share string.`,
      });
    } catch {
      toastManager.add({
        type: "error",
        title: "Copy failed",
        description: "Unable to copy the theme share string.",
      });
    }
  };
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded-md px-2 py-1 text-xs text-[var(--color-text-foreground-secondary)] transition-colors hover:bg-[var(--color-background-elevated-secondary)] hover:text-[var(--color-text-foreground)]"
    >
      Copy
    </button>
  );
}

export function ThemePackCodeThemeControlElement(props: {
  readonly value: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly theme: ChromeTheme;
  readonly options: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly previewTheme: ChromeTheme;
  }>;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Select
      value={props.value}
      onValueChange={(value) => {
        if (typeof value === "string") props.onChange(value);
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          SETTINGS_CONTROL_RADIUS_CLASS_NAME,
          "ml-1 min-w-52 gap-2",
        )}
        aria-label={props.ariaLabel}
      >
        <SelectValue className="flex-1 text-left">
          <CodeThemeOption label={props.label} theme={props.theme} />
        </SelectValue>
      </SelectTrigger>
      <SettingsSelectPopup
        align="end"
        alignItemWithTrigger={false}
        className="p-1.5"
      >
        {props.options.map((option) => (
          <SelectItem
            hideIndicator
            key={option.id}
            value={option.id}
            className={cn(
              SETTINGS_CONTROL_RADIUS_CLASS_NAME,
              "px-2 py-2",
            )}
          >
            <CodeThemeOption
              label={option.label}
              theme={option.previewTheme}
            />
          </SelectItem>
        ))}
      </SettingsSelectPopup>
    </Select>
  );
}

export function ThemePackContextElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <div className="px-4 pb-3 text-[11px] text-[var(--color-text-foreground-secondary)]">
      {props.children}
    </div>
  );
}

export function ThemePackRowElement(props: {
  readonly label: string;
  readonly children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        SETTINGS_CARD_ROW_CLASS_NAME,
        "flex min-h-12 items-center justify-between gap-3 border-t border-[color:var(--color-border)]",
      )}
    >
      <span className="text-sm text-foreground/90">{props.label}</span>
      <div className="flex shrink-0 items-center gap-2">{props.children}</div>
    </div>
  );
}

export function ThemePackColorControlElement(props: {
  readonly color: string;
  readonly ariaLabel: string;
  readonly onChange: (next: string) => void;
  readonly onReset?: (() => void) | undefined;
}) {
  const commitTimerRef = useRef<number | null>(null);
  const pendingCommitRef = useRef<string | null>(null);
  const colorRef = useRef(props.color);
  const [draftHexRaw, setDraftHex] = useState<string | null>(null);
  const draftHex = draftHexRaw === props.color ? null : draftHexRaw;
  const [isOpen, setIsOpen] = useState(false);
  const normalizedDraftHex = draftHex?.trim().toLowerCase() ?? null;
  const previewColor =
    normalizedDraftHex && HEX_COLOR_RE.test(normalizedDraftHex)
      ? normalizedDraftHex
      : props.color;
  const inputValue = draftHex ?? props.color;
  const textColor = readableTextColor(previewColor);
  const ringColor = readableTextColor(previewColor, 0.32);

  useEffect(() => {
    colorRef.current = props.color;
  }, [props.color]);

  const clearTimer = () => {
    if (commitTimerRef.current !== null) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  };
  const commit = (nextInput?: string | null) => {
    const next =
      nextInput === undefined ? pendingCommitRef.current : nextInput;
    clearTimer();
    pendingCommitRef.current = null;
    if (next && next !== colorRef.current) props.onChange(next);
  };
  const validDraft = (next: string) => {
    const normalized = next.trim().toLowerCase();
    setDraftHex(normalized);
    pendingCommitRef.current = normalized;
    clearTimer();
    commitTimerRef.current = window.setTimeout(
      () => commit(normalized),
      COLOR_PICKER_COMMIT_DELAY_MS,
    );
  };
  useEffect(() => () => clearTimer(), []);

  return (
    <div className="flex items-center gap-1">
      {props.onReset ? (
        <button
          type="button"
          onClick={() => {
            clearTimer();
            pendingCommitRef.current = null;
            setDraftHex(null);
            props.onReset?.();
          }}
          className="rounded-md p-1 text-[var(--color-text-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-elevated-secondary)] hover:text-[var(--color-text-foreground)]"
          aria-label={`Reset ${props.ariaLabel}`}
          title="Reset to default"
        >
          ↶
        </button>
      ) : null}
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            commit();
            setDraftHex(null);
          }
        }}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                SETTINGS_CONTROL_RADIUS_CLASS_NAME,
                "group relative flex h-8 min-w-44 items-center gap-2 overflow-hidden border px-2 pr-3 text-left transition-[transform,box-shadow] hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              )}
              style={{
                backgroundColor: previewColor,
                color: textColor,
                borderColor: ringColor,
              }}
              aria-label={props.ariaLabel}
            />
          }
        >
          <span
            aria-hidden
            className="block size-5 shrink-0 rounded-full border"
            style={{ borderColor: ringColor }}
          />
          <span className="font-system-ui flex-1 text-[12px] uppercase">
            {previewColor}
          </span>
        </PopoverTrigger>
        <PopoverPopup
          align="end"
          side="bottom"
          sideOffset={8}
          className="p-0 [&_[data-slot=popover-viewport]]:p-0"
        >
          <div className="theme-color-picker flex w-56 flex-col gap-3 p-3">
            <HexColorPicker color={previewColor} onChange={validDraft} />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => {
                const next = event.target.value;
                setDraftHex(next);
                if (HEX_COLOR_RE.test(next.trim())) validDraft(next);
              }}
              onBlur={() => {
                commit();
                setDraftHex(null);
              }}
              spellCheck={false}
              maxLength={7}
              className={cn(
                SETTINGS_CONTROL_RADIUS_CLASS_NAME,
                "h-8 border border-[color:var(--color-border-light)] bg-[var(--color-background-elevated-secondary)] px-2 text-center font-chat-code text-xs uppercase outline-none focus:border-[color:var(--color-border-focus)]",
              )}
              aria-label={`${props.ariaLabel} hex value`}
            />
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  );
}

export function ThemePackFontControlElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly mono?: boolean;
  readonly onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      value={draft ?? props.value}
      placeholder={props.placeholder}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        props.onChange(next);
      }}
      onBlur={() => setDraft(null)}
      spellCheck={false}
      aria-label={props.ariaLabel}
      className={cn(
        SETTINGS_CONTROL_RADIUS_CLASS_NAME,
        "w-56",
        props.mono && "font-chat-code",
      )}
    />
  );
}

export function ThemePackBooleanControlElement(props: {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={props.checked}
      onCheckedChange={(checked) => props.onChange(Boolean(checked))}
      aria-label={props.ariaLabel}
    />
  );
}

export function ThemePackContrastControlElement(props: {
  readonly value: number;
  readonly ariaLabel: string;
  readonly onChange: (value: number) => void;
}) {
  const id = useUniqueId();
  const fill = Math.max(0, Math.min(100, props.value));
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
        aria-label={props.ariaLabel}
        className="theme-slider h-1.5 w-44 cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline-none"
        style={{
          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${fill}%, var(--input) ${fill}%, var(--input) 100%)`,
        }}
      />
      <span className="w-7 text-right font-chat-code text-xs text-muted-foreground tabular-nums">
        {props.value}
      </span>
    </div>
  );
}

function CodeThemeOption(props: {
  readonly label: string;
  readonly theme: ChromeTheme;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold leading-none"
        style={{
          backgroundColor: props.theme.surface,
          borderColor: mixColor(
            props.theme.surface,
            props.theme.ink,
            0.16,
          ),
          color: props.theme.accent,
        }}
      >
        Aa
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-[var(--color-text-foreground)]">
          {props.label}
        </div>
      </div>
    </div>
  );
}

function readableTextColor(hex: string, alpha = 1): string {
  const rgb = parseHex(hex);
  if (!rgb) return alpha === 1 ? "#ffffff" : `rgba(255,255,255,${alpha})`;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  if (luminance > 0.6) {
    return alpha === 1 ? "#1a1c1f" : `rgba(26,28,31,${alpha})`;
  }
  return alpha === 1 ? "#ffffff" : `rgba(255,255,255,${alpha})`;
}

function mixColor(fromHex: string, toHex: string, amount: number): string {
  const from = parseHex(fromHex);
  const to = parseHex(toHex);
  if (!from || !to) return fromHex;
  const clamped = Math.max(0, Math.min(1, amount));
  const red = Math.round(from.r + (to.r - from.r) * clamped);
  const green = Math.round(from.g + (to.g - from.g) * clamped);
  const blue = Math.round(from.b + (to.b - from.b) * clamped);
  return `rgb(${red}, ${green}, ${blue})`;
}

function parseHex(hex: string): {
  readonly r: number;
  readonly g: number;
  readonly b: number;
} | null {
  if (!HEX_COLOR_RE.test(hex)) return null;
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}
