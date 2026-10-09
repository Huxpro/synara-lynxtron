import { useState, type ReactNode } from "@lynx-js/react";

import { Button, buttonVariants } from "../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch.lynx";
import { ChevronDownIcon, XIcon } from "../lib/icons.lynx";
import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "../components/ui/menu";
import { SettingsHeadingElement } from "./SettingsHeadingElement.lynx";
import { SettingsResetIcon } from "./SettingsResetIcon.lynx";
import { useLynxInteractiveState } from "./useLynxInteractiveState";
import type { ChromeTheme, ThemeVariant } from "@synara-web/theme/theme.logic";
import "./theme-pack-editor-composition-elements.css";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function mixThemeColors(fromHex: string, toHex: string, amount: number): string {
  if (!HEX_COLOR_RE.test(fromHex) || !HEX_COLOR_RE.test(toHex)) return fromHex;
  const channel = (hex: string, offset: number) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16);
  const clamped = Math.max(0, Math.min(1, amount));
  const mix = (offset: number) =>
    Math.round(
      channel(fromHex, offset) + (channel(toHex, offset) - channel(fromHex, offset)) * clamped,
    );
  return `rgb(${mix(1)}, ${mix(3)}, ${mix(5)})`;
}

export function readableThemeColor(hex: string, alpha = 1): string {
  if (!HEX_COLOR_RE.test(hex)) {
    return alpha === 1 ? "#ffffff" : `rgba(255, 255, 255, ${alpha})`;
  }
  const channel = (offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  const luminance = (0.299 * channel(1) + 0.587 * channel(3) + 0.114 * channel(5)) / 255;
  if (luminance > 0.6) {
    return alpha === 1 ? "#1a1c1f" : `rgba(26, 28, 31, ${alpha})`;
  }
  return alpha === 1 ? "#ffffff" : `rgba(255, 255, 255, ${alpha})`;
}

function CodeThemeOption(props: { readonly label: string; readonly theme: ChromeTheme }) {
  return (
    <view className="SharedThemePackCodeOption">
      <view
        className="SharedThemePackCodeSwatch"
        style={{
          backgroundColor: props.theme.surface,
          borderColor: mixThemeColors(props.theme.surface, props.theme.ink, 0.16),
        }}
      >
        <text className="SharedThemePackCodeSwatchText" style={{ color: props.theme.accent }}>
          Aa
        </text>
      </view>
      <text className="SharedThemePackCodeLabel">{props.label}</text>
    </view>
  );
}

export function ThemePackRootElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedThemePackRoot">{props.children}</view>;
}

export function ThemePackHeaderElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedThemePackHeader">{props.children}</view>;
}

export function ThemePackTitleElement(props: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedThemePackTitleLine">
      <SettingsHeadingElement className="SharedThemePackTitle">
        {props.title}
      </SettingsHeadingElement>
      {props.children}
    </view>
  );
}

export function ThemePackResetActionElement(props: { readonly onReset: () => void }) {
  return (
    <Button
      size="xs"
      variant="ghost"
      className="SharedThemePackResetAction"
      onClick={props.onReset}
    >
      Reset
    </Button>
  );
}

export function ThemePackImportActionElement(props: {
  readonly variant: ThemeVariant;
  readonly onImport: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const close = () => {
    setOpen(false);
    setValue("");
    setError(null);
    setFocused(false);
  };
  const submit = () => {
    try {
      props.onImport(value);
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to import that theme string.");
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setOpen(true);
        else close();
      }}
    >
      <DialogTrigger
        className={buttonVariants({
          size: "sm",
          variant: "ghost",
          className:
            "SharedThemePackImportTriggerHost SharedThemePackHeaderAction SharedThemePackImportTrigger",
        })}
        ariaLabel="Import theme"
      >
        <text className="LxButton__text">Import</text>
      </DialogTrigger>
      <DialogPopup
        className="SharedThemePackImportDialog"
        viewportClassName="SharedThemePackImportViewport"
        showCloseButton={false}
      >
        <DialogClose className="SharedThemePackImportClose" ariaLabel="Close theme import">
          <XIcon
            className="SharedThemePackImportCloseIcon"
            color="var(--muted-foreground)"
            size={16}
            style={{ opacity: 0.8 }}
          />
        </DialogClose>
        <scroll-view className="SharedThemePackImportScroll" scroll-y>
          <DialogHeader className="SharedThemePackImportHeader">
            <text className="SharedThemePackImportTitle">Import {props.variant} theme</text>
            <text className="SharedThemePackImportDescription">
              Paste a <text className="SharedThemePackImportCode">codex-theme-v1:</text> share
              string. The embedded variant must match {props.variant}, and the selected code theme
              must exist for that variant.
            </text>
          </DialogHeader>
          <DialogPanel className="SharedThemePackImportPanel">
            <view
              className={`SharedThemePackImportTextareaControl${
                focused ? " SharedThemePackImportTextareaControl--focused" : ""
              }`}
            >
              <textarea
                className="SharedThemePackImportTextarea"
                aria-label="Theme share string"
                aria-invalid={Boolean(error)}
                accessibility-element
                accessibility-label="Theme share string"
                focusable
                default-value={value}
                placeholder='codex-theme-v1:{"codeThemeId":"linear",...}'
                placeholder-color="var(--theme-pack-import-placeholder)"
                maxlines={5}
                bindfocus={() => setFocused(true)}
                bindblur={() => setFocused(false)}
                bindinput={(event) => {
                  setValue(event.detail.value);
                  setError(null);
                }}
              />
            </view>
            {error ? (
              <text
                className="SharedThemePackImportError"
                accessibility-element
                accessibility-role="alert"
              >
                {error}
              </text>
            ) : null}
          </DialogPanel>
          <DialogFooter className="SharedThemePackImportFooter">
            <Button
              size="sm"
              variant="outline"
              className="SharedThemePackImportCancel"
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="SharedThemePackImportSubmit"
              disabled={value.trim().length === 0}
              onClick={submit}
            >
              Import
            </Button>
          </DialogFooter>
        </scroll-view>
      </DialogPopup>
    </Dialog>
  );
}

export function ThemePackCopyActionElement(props: {
  readonly variant: ThemeVariant;
  readonly shareString: string;
}) {
  const copy = () => {
    "background only";
    void import(/* webpackMode: "eager" */ "../platform/clipboard")
      .then(({ clipboard }) => clipboard.writeText(props.shareString))
      .catch((error) => {
        console.warn(`[settings] ${props.variant} theme copy failed`, String(error));
      });
  };
  return (
    <Button size="sm" variant="ghost" className="SharedThemePackHeaderAction" onClick={copy}>
      Copy
    </Button>
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
    <Menu>
      <MenuTrigger ariaLabel={props.ariaLabel}>
        <Button
          variant="outline"
          className="SharedThemePackCodeSelect"
          buttonProps={{ "accessibility-element": false }}
        >
          <CodeThemeOption label={props.label} theme={props.theme} />
          <ChevronDownIcon
            className="SharedThemePackCodeChevron"
            size={14}
            color="var(--foreground)"
          />
        </Button>
      </MenuTrigger>
      <MenuPopup className="SharedThemePackCodePopup">
        <MenuRadioGroup
          value={props.value}
          onValueChange={(value) => {
            if (value !== props.value) props.onChange(value);
          }}
        >
          {props.options.map((option) => (
            <MenuRadioItem
              key={option.id}
              value={option.id}
              className="SharedThemePackCodeMenuItem"
            >
              <CodeThemeOption label={option.label} theme={option.previewTheme} />
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

export function ThemePackContextElement(props: { readonly children?: ReactNode }) {
  return <text className="SharedThemePackContext">{props.children}</text>;
}

export function ThemePackRowElement(props: {
  readonly label: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedThemePackRow">
      <text className="SharedThemePackRowLabel">{props.label}</text>
      <view className="SharedThemePackRowControl">{props.children}</view>
    </view>
  );
}

export function ThemePackColorControlElement(props: {
  readonly color: string;
  readonly ariaLabel: string;
  readonly onChange: (next: string) => void;
  readonly onReset?: (() => void) | undefined;
}) {
  const previewColor = HEX_COLOR_RE.test(props.color) ? props.color.toLowerCase() : "#000000";
  return (
    <view className="SharedThemePackColorLine">
      {props.onReset ? (
        <Button
          size="icon-sm"
          variant="ghost"
          className="SharedThemePackColorReset"
          aria-label={`Reset ${props.ariaLabel}`}
          onClick={props.onReset}
        >
          <SettingsResetIcon />
        </Button>
      ) : null}
      <view
        className="SharedThemePackColorControl"
        style={{
          backgroundColor: previewColor,
          borderColor: readableThemeColor(previewColor, 0.32),
        }}
      >
        <view
          className="SharedThemePackColorIndicator"
          style={{ borderColor: readableThemeColor(previewColor, 0.32) }}
          aria-hidden="true"
        />
        <Input
          nativeInput
          unstyled
          className="SharedThemePackColorInput"
          value={props.color.toUpperCase()}
          accessibility-label={`${props.ariaLabel} hex value`}
          onChange={(event) => {
            const next = event.target.value.trim().toLowerCase();
            if (next !== props.color.toLowerCase() && HEX_COLOR_RE.test(next)) {
              props.onChange(next);
            }
          }}
          style={{ color: readableThemeColor(previewColor) }}
        />
      </view>
    </view>
  );
}

export function ThemePackFontControlElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly mono?: boolean;
  readonly onChange: (next: string) => void;
}) {
  return (
    <Input
      nativeInput
      size="sm"
      variant="soft"
      className={`SharedThemePackFontInput${props.mono ? " SharedThemePackFontInput--mono" : ""}`}
      value={props.value}
      placeholder={props.placeholder}
      accessibility-label={props.ariaLabel}
      onChange={(event) => {
        if (event.target.value !== props.value) {
          props.onChange(event.target.value);
        }
      }}
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
      ariaLabel={props.ariaLabel}
      className={`SharedThemePackSwitch${props.checked ? " SharedThemePackSwitch--on" : ""}`}
      thumbClassName="SharedThemePackSwitchThumb"
      onCheckedChange={props.onChange}
    />
  );
}

/**
 * Upstream's ThemeSlider: a 0–100 track by default (Contrast), or a `min`–`max` range with
 * a suffix or a label standing in for the number (the translucency sliders).
 */
export function ThemePackContrastControlElement(props: {
  readonly value: number;
  readonly ariaLabel: string;
  readonly min?: number;
  readonly max?: number;
  readonly suffix?: string;
  /** Shown instead of the number, e.g. while the value is still the automatic default. */
  readonly valueLabel?: string;
  readonly onChange: (value: number) => void;
}) {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const [dragging, setDragging] = useState(false);
  const [trackRect, setTrackRect] = useState({ left: 0, width: 0 });
  const valueText = props.valueLabel ?? `${props.value}${props.suffix ?? ""}`;
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedThemePackContrastTrack",
    accessibleLabel: props.ariaLabel,
    accessibilityTraits: "adjustable",
    accessibilityValue: valueText,
    focusable: true,
  });
  const fillPercent = Math.max(0, Math.min(100, ((props.value - min) / (max - min)) * 100));
  const updateFromPointer = (event: ThemePackContrastPointerEvent) => {
    const percent = resolveThemePackContrastPointerValue(event, trackRect);
    if (percent === null) return;
    const next = Math.round(min + (percent / 100) * (max - min));
    if (next !== props.value) props.onChange(next);
  };
  const handleKeyDown = (event: { readonly key: string; preventDefault?: () => void }) => {
    const next = resolveThemePackContrastKeyValue(props.value, event.key, min, max);
    if (next === null) return;
    event.preventDefault?.();
    if (next !== props.value) props.onChange(next);
  };
  return (
    <view className="SharedThemePackContrast">
      <view
        className={interaction.className}
        {...interaction.eventProps}
        aria-label={props.ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={props.value}
        bindlayoutchange={(event: ThemePackContrastLayoutEvent) => {
          "background only";
          const detail = event.detail ?? event.params ?? {};
          if (typeof detail.left === "number" && typeof detail.width === "number") {
            setTrackRect({ left: detail.left, width: detail.width });
          }
        }}
        bindmousedown={(event: ThemePackContrastPointerEvent) => {
          interaction.eventProps.bindmousedown?.();
          setDragging(true);
          updateFromPointer(event);
        }}
        bindmousemove={(event: ThemePackContrastPointerEvent) => {
          if (dragging) updateFromPointer(event);
        }}
        bindmouseup={(event: ThemePackContrastPointerEvent) => {
          updateFromPointer(event);
          setDragging(false);
          interaction.eventProps.bindmouseup?.();
        }}
        bindmouseleave={() => {
          setDragging(false);
          interaction.eventProps.bindmouseleave?.();
        }}
        bindtouchstart={(event: ThemePackContrastPointerEvent) => {
          interaction.eventProps.bindtouchstart?.();
          setDragging(true);
          updateFromPointer(event);
        }}
        bindtouchmove={(event: ThemePackContrastPointerEvent) => {
          if (dragging) updateFromPointer(event);
        }}
        bindtouchend={(event: ThemePackContrastPointerEvent) => {
          updateFromPointer(event);
          setDragging(false);
          interaction.eventProps.bindtouchend?.();
        }}
        bindtouchcancel={() => {
          setDragging(false);
          interaction.eventProps.bindtouchcancel?.();
        }}
        bindkeydown={handleKeyDown}
      >
        <view className="SharedThemePackContrastRail" />
        <view className="SharedThemePackContrastFill" style={{ width: `${fillPercent}%` }} />
        <view className="SharedThemePackContrastThumb" style={{ left: `${fillPercent}%` }} />
      </view>
      <text className="SharedThemePackContrastValue">{valueText}</text>
    </view>
  );
}

interface ThemePackContrastPointerEvent {
  readonly clientX?: number;
  readonly pageX?: number;
  readonly detail?: {
    readonly clientX?: number;
    readonly pageX?: number;
    /** Page-space x of a Lynx touch event. */
    readonly x?: number;
  };
  readonly touches?: readonly {
    readonly clientX?: number;
    readonly pageX?: number;
  }[];
  readonly changedTouches?: readonly {
    readonly clientX?: number;
    readonly pageX?: number;
  }[];
}

interface ThemePackContrastLayoutEvent {
  readonly detail?: {
    readonly left?: number;
    readonly width?: number;
  };
  readonly params?: {
    readonly left?: number;
    readonly width?: number;
  };
}

export function resolveThemePackContrastPointerValue(
  event: ThemePackContrastPointerEvent,
  rect: { readonly left: number; readonly width: number },
): number | null {
  if (rect.width <= 0) return null;
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  const x =
    touch?.clientX ??
    touch?.pageX ??
    event.detail?.clientX ??
    event.clientX ??
    event.detail?.pageX ??
    event.pageX ??
    event.detail?.x;
  if (typeof x !== "number" || !Number.isFinite(x)) return null;
  return Math.round(Math.max(0, Math.min(1, (x - rect.left) / rect.width)) * 100);
}

export function resolveThemePackContrastKeyValue(
  value: number,
  key: string,
  min = 0,
  max = 100,
): number | null {
  if (key === "Home") return min;
  if (key === "End") return max;
  if (key === "ArrowLeft" || key === "ArrowDown") {
    return Math.max(min, value - 1);
  }
  if (key === "ArrowRight" || key === "ArrowUp") {
    return Math.min(max, value + 1);
  }
  return null;
}
