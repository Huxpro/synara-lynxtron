// FILE: SettingsAppearanceCompositionElements.tsx
// Purpose: Browser elements beneath the shared Appearance composition.

import type { ReactNode } from "react";
import { TERMINAL_FONT_FAMILY_SUGGESTIONS } from "./SettingsAppearanceComposition.logic";
import { DeviceLaptopIcon, MoonIcon, SunIcon } from "../../lib/icons";
import {
  SETTINGS_PANEL_SECTION_CLASS_NAME,
  SETTINGS_SECTION_LABEL_CLASS_NAME,
} from "../../settingsPanelStyles";
import {
  SettingResetButton,
  SettingsSegmentedControl,
  SettingsSelectControl,
} from "./SettingControls";
import { SettingsCard, SettingsRow } from "./SettingsPanelPrimitives";
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "../ui/autocomplete";
import { Input } from "../ui/input";
import { SelectItem } from "../ui/select";
import { Switch } from "../ui/switch";

type Option = { readonly value: string; readonly label: string };

export function SettingsAppearanceRootElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return <div className="space-y-6">{props.children}</div>;
}

export function SettingsAppearanceSectionElement(props: {
  readonly title: string;
  readonly children?: ReactNode | undefined;
}) {
  return (
    <section className={SETTINGS_PANEL_SECTION_CLASS_NAME}>
      <h2 className={SETTINGS_SECTION_LABEL_CLASS_NAME}>{props.title}</h2>
      {props.children}
    </section>
  );
}

export function SettingsAppearanceCardElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return <SettingsCard>{props.children}</SettingsCard>;
}

export function SettingsAppearanceRowElement(props: {
  readonly terminal?: boolean | undefined;
  readonly title: string;
  readonly description: string;
  readonly resetLabel: string;
  readonly changed: boolean;
  readonly onReset: () => void;
  readonly children?: ReactNode | undefined;
}) {
  return (
    <SettingsRow
      title={props.title}
      description={props.description}
      resetAction={
        props.changed ? (
          <SettingResetButton label={props.resetLabel} onClick={props.onReset} />
        ) : null
      }
      control={props.children}
    />
  );
}

export function SettingsAppearanceSegmentedControlElement(props: {
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly Option[];
  readonly onChange: (value: string) => void;
}) {
  const options = props.options.map((option) => ({
    ...option,
    icon:
      props.ariaLabel !== "Theme preference" ? undefined : option.value === "light" ? (
        <SunIcon />
      ) : option.value === "dark" ? (
        <MoonIcon />
      ) : (
        <DeviceLaptopIcon />
      ),
  }));
  return (
    <SettingsSegmentedControl
      value={props.value}
      ariaLabel={props.ariaLabel}
      options={options}
      onValueChange={props.onChange}
    />
  );
}

export function SettingsAppearanceBooleanControlElement(props: {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={props.checked}
      aria-label={props.ariaLabel}
      onCheckedChange={(checked) => props.onChange(Boolean(checked))}
    />
  );
}

export function SettingsAppearanceNumberControlElement(props: {
  readonly value: number;
  readonly suffix: string;
  readonly ariaLabel: string;
  readonly onChange: (value: number) => void;
}) {
  return (
    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
      <Input
        type="number"
        size="sm"
        inputMode="numeric"
        variant="soft"
        className="w-full text-right sm:w-20"
        value={String(props.value)}
        onChange={(event) => {
          const value = event.target.value.trim();
          if (value) props.onChange(Number(value));
        }}
        aria-label={props.ariaLabel}
      />
      <span className="text-ui text-muted-foreground">{props.suffix}</span>
    </div>
  );
}

export function SettingsAppearanceTextControlElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly onChange: (value: string) => void;
}) {
  const query = props.value.trim().toLowerCase();
  const suggestions = query
    ? TERMINAL_FONT_FAMILY_SUGGESTIONS.filter((font) => font.toLowerCase().includes(query))
    : TERMINAL_FONT_FAMILY_SUGGESTIONS;
  return (
    <Autocomplete
      items={suggestions}
      mode="none"
      openOnInputClick
      value={props.value}
      onValueChange={props.onChange}
    >
      <AutocompleteInput
        size="sm"
        variant="soft"
        showTrigger
        showClear={props.value.length > 0}
        spellCheck={false}
        autoComplete="off"
        placeholder={props.placeholder}
        className="w-full sm:w-56"
        aria-label={props.ariaLabel}
      />
      <AutocompletePopup className="w-56 min-w-56 font-system-ui">
        <AutocompleteList>
          {suggestions.map((suggestion, index) => (
            <AutocompleteItem
              key={suggestion}
              index={index}
              value={suggestion}
              onClick={() => props.onChange(suggestion)}
            >
              {suggestion}
            </AutocompleteItem>
          ))}
          <AutocompleteEmpty>No matching suggested fonts.</AutocompleteEmpty>
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  );
}

export function SettingsAppearanceSelectControlElement(props: {
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly Option[];
  readonly onChange: (value: string) => void;
}) {
  const label = props.options.find((option) => option.value === props.value)?.label ?? props.value;
  return (
    <SettingsSelectControl
      value={props.value}
      ariaLabel={props.ariaLabel}
      triggerClassName="w-full sm:w-40"
      valueContent={label}
      onValueChange={props.onChange}
    >
      {props.options.map((option) => (
        <SelectItem hideIndicator key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SettingsSelectControl>
  );
}

export function SettingsAppearanceThemePacksElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return <div className="space-y-3">{props.children}</div>;
}
