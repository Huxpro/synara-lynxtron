// FILE: SettingsAppearanceComposition.tsx
// Purpose: Physical-shared Appearance section/row/control composition.

import type { ReactNode } from "react";
import {
  DEFAULT_THEME_STATE,
  areThemePacksEqual,
  createThemeShareString,
  resetThemeVariant,
  resolveThemePack,
  setThemeCodeThemeId,
  setThemeFonts,
  updateChromeTheme,
  updateThemePackFromShareString,
  type ThemeState,
} from "../../theme/theme.logic";
import { ThemePackEditorComposition } from "./ThemePackEditorComposition";
import {
  SETTINGS_DENSITY_OPTIONS,
  SETTINGS_THEME_OPTIONS,
  SETTINGS_TIMESTAMP_OPTIONS,
  normalizeAppearanceNumber,
  type SettingsAppearanceKey,
  type SettingsAppearanceValues,
} from "./SettingsAppearanceComposition.logic";
import {
  SettingsAppearanceBooleanControlElement,
  SettingsAppearanceCardElement,
  SettingsAppearanceNumberControlElement,
  SettingsAppearanceRootElement,
  SettingsAppearanceRowElement,
  SettingsAppearanceSectionElement,
  SettingsAppearanceSegmentedControlElement,
  SettingsAppearanceSelectControlElement,
  SettingsAppearanceTextControlElement,
  SettingsAppearanceThemePacksElement,
} from "~/components/settings/SettingsAppearanceCompositionElements";

export function SettingsAppearanceComposition(props: {
  readonly values: SettingsAppearanceValues;
  readonly defaults: SettingsAppearanceValues;
  readonly resolvedTheme: "light" | "dark";
  readonly showCodeThemeSelection: boolean;
  readonly showFontSmoothing: boolean;
  readonly showTimestampFormat: boolean;
  readonly themeState: ThemeState;
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly onChange: <Key extends SettingsAppearanceKey>(
    key: Key,
    value: SettingsAppearanceValues[Key],
  ) => void;
}) {
  const row = (
    key: SettingsAppearanceKey,
    title: string,
    description: string,
    control: ReactNode,
    terminal = false,
  ) => (
    <SettingsAppearanceRowElement
      key={key}
      terminal={terminal}
      title={title}
      description={description}
      resetLabel={title.toLowerCase()}
      changed={props.values[key] !== props.defaults[key]}
      onReset={() =>
        props.onChange(key, props.defaults[key] as SettingsAppearanceValues[typeof key])
      }
    >
      {control}
    </SettingsAppearanceRowElement>
  );

  return (
    <SettingsAppearanceRootElement>
      <SettingsAppearanceSectionElement title="Theme and typography">
        <SettingsAppearanceCardElement>
          {row(
            "themeMode",
            "Theme",
            "Choose how Synara looks across the app.",
            <SettingsAppearanceSegmentedControlElement
              value={props.values.themeMode}
              ariaLabel="Theme preference"
              options={SETTINGS_THEME_OPTIONS}
              onChange={(value) =>
                props.onChange("themeMode", value as SettingsAppearanceValues["themeMode"])
              }
            />,
          )}
          {row(
            "systemUiFont",
            "Use system UI font",
            "Ignore the theme's custom UI font and render the interface with the native system font (SF Pro on macOS).",
            <SettingsAppearanceBooleanControlElement
              checked={props.values.systemUiFont}
              ariaLabel="Use system UI font"
              onChange={(checked) => props.onChange("systemUiFont", checked)}
            />,
            true,
          )}
        </SettingsAppearanceCardElement>

        <SettingsAppearanceThemePacksElement>
          {(props.resolvedTheme === "dark"
            ? (["dark", "light"] as const)
            : (["light", "dark"] as const)
          ).map((variant) => {
            const pack = resolveThemePack(props.themeState, variant);
            const defaultPack = resolveThemePack(DEFAULT_THEME_STATE, variant);
            return (
              <ThemePackEditorComposition
                key={variant}
                showCodeThemeSelection={props.showCodeThemeSelection}
                variant={variant}
                isActive={props.resolvedTheme === variant}
                mode={props.values.themeMode}
                pack={pack}
                defaultPack={defaultPack}
                isPristine={areThemePacksEqual(pack, defaultPack)}
                shareString={createThemeShareString(variant, pack)}
                onImport={(value) =>
                  props.onThemeStateChange(
                    updateThemePackFromShareString(props.themeState, value, variant),
                  )
                }
                onResetVariant={() =>
                  props.onThemeStateChange(resetThemeVariant(props.themeState, variant))
                }
                onSetCodeThemeId={(value) =>
                  props.onThemeStateChange(setThemeCodeThemeId(props.themeState, variant, value))
                }
                onUpdateTheme={(patch) =>
                  props.onThemeStateChange(updateChromeTheme(props.themeState, variant, patch))
                }
                onUpdateFonts={(patch) =>
                  props.onThemeStateChange(setThemeFonts(props.themeState, variant, patch))
                }
              />
            );
          })}
        </SettingsAppearanceThemePacksElement>

        <SettingsAppearanceCardElement>
          {row(
            "uiDensity",
            "UI density",
            "Control spacing in the sidebar, composer, chat gutters, and settings rows without changing font size.",
            <SettingsAppearanceSegmentedControlElement
              value={props.values.uiDensity}
              ariaLabel="UI density"
              options={SETTINGS_DENSITY_OPTIONS}
              onChange={(value) =>
                props.onChange("uiDensity", value as SettingsAppearanceValues["uiDensity"])
              }
            />,
          )}
          {row(
            "chatFontSizePx",
            "Base font size",
            "Adjust the app text base in pixels. Chat and UI typography scale proportionally from this value.",
            <SettingsAppearanceNumberControlElement
              value={props.values.chatFontSizePx}
              suffix="px"
              ariaLabel="Base font size in pixels"
              onChange={(value) =>
                props.onChange("chatFontSizePx", normalizeAppearanceNumber("chatFontSizePx", value))
              }
            />,
          )}
          {row(
            "terminalFontSizePx",
            "Terminal font size",
            "Adjust terminal text independently from the app and chat font size.",
            <SettingsAppearanceNumberControlElement
              value={props.values.terminalFontSizePx}
              suffix="px"
              ariaLabel="Terminal font size in pixels"
              onChange={(value) =>
                props.onChange(
                  "terminalFontSizePx",
                  normalizeAppearanceNumber("terminalFontSizePx", value),
                )
              }
            />,
          )}
          {row(
            "terminalFontFamily",
            "Terminal font",
            "Type any monospace font installed on this device (e.g. Fira Code). Leave empty for the default. Fonts that aren't installed fall back to the system monospace.",
            <SettingsAppearanceTextControlElement
              value={props.values.terminalFontFamily}
              placeholder="Default (JetBrains Mono)"
              ariaLabel="Terminal font family"
              onChange={(value) => props.onChange("terminalFontFamily", value)}
            />,
            !props.showFontSmoothing,
          )}
          {props.showFontSmoothing
            ? row(
                "enableNativeFontSmoothing",
                "Font smoothing",
                "Use macOS-style antialiasing for lighter, crisper text rendering.",
                <SettingsAppearanceBooleanControlElement
                  checked={props.values.enableNativeFontSmoothing}
                  ariaLabel="Enable font smoothing"
                  onChange={(checked) => props.onChange("enableNativeFontSmoothing", checked)}
                />,
                true,
              )
            : null}
        </SettingsAppearanceCardElement>
      </SettingsAppearanceSectionElement>

      <SettingsAppearanceSectionElement title="Time and reading">
        <SettingsAppearanceCardElement>
          {props.showTimestampFormat
            ? row(
                "timestampFormat",
                "Time format",
                "System default follows your browser or OS clock preference.",
                <SettingsAppearanceSelectControlElement
                  value={props.values.timestampFormat}
                  ariaLabel="Timestamp format"
                  options={SETTINGS_TIMESTAMP_OPTIONS}
                  onChange={(value) =>
                    props.onChange(
                      "timestampFormat",
                      value as SettingsAppearanceValues["timestampFormat"],
                    )
                  }
                />,
                true,
              )
            : null}
        </SettingsAppearanceCardElement>
      </SettingsAppearanceSectionElement>
    </SettingsAppearanceRootElement>
  );
}
