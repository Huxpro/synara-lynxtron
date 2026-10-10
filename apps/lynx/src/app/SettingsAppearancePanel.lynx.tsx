// FILE: SettingsAppearancePanel.lynx.tsx
// Purpose: The Appearance settings panel in upstream's current order (`renderAppearancePanel`
//   in routes/_chat.settings.tsx): the Theme section (reset action, mode picker cards, the
//   two theme pack editors), then Typography and spacing.
// Why not the shared SettingsAppearanceComposition: it lists the previous upstream panel
//   (a Theme row and the font switch in a card above the packs); upstream writes this panel
//   as inline JSX. Theme state edits still go through upstream's theme.logic reducers.
// Not rendered: upstream's App section (app icon, custom title bar), which exists only on
//   the Electron desktop bridge.

import type { ReactNode } from "@lynx-js/react";
import {
  DEFAULT_THEME_STATE,
  areThemePacksEqual,
  createThemeShareString,
  resetThemeVariant,
  resolveThemePack,
  setThemeCodeThemeId,
  setThemeFonts,
  setWindowTranslucency,
  updateChromeTheme,
  updateThemePackFromShareString,
  type ThemeMode,
  type ThemeState,
  type ThemeVariant,
} from "@synara-web/theme/theme.logic";
import {
  SETTINGS_DENSITY_OPTIONS,
  normalizeAppearanceNumber,
  type SettingsAppearanceKey,
  type SettingsAppearanceValues,
} from "@synara-web/components/settings/SettingsAppearanceComposition.logic";

import {
  SettingsAppearanceBooleanControlElement,
  SettingsAppearanceCardElement,
  SettingsAppearanceNumberControlElement,
  SettingsAppearanceRootElement,
  SettingsAppearanceRowElement,
  SettingsAppearanceSectionElement,
  SettingsAppearanceSegmentedControlElement,
  SettingsAppearanceTextControlElement,
  SettingsAppearanceThemePacksElement,
} from "../adapters/SettingsAppearanceCompositionElements.lynx";
import { SettingsHeadingElement } from "../adapters/SettingsHeadingElement.lynx";
import { SettingsResetIcon } from "../adapters/SettingsResetIcon.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { DEFAULT_CHAT_WIDTH, isChatWidthMode, type ChatWidthMode } from "@synara-web/lib/chatWidth";
import { toastManager } from "../components/ui/toast.lynx";
import { CHAT_WIDTH_OPTIONS } from "./chatWidthSetting.logic";
import { setChatWidthSetting, useChatWidthSetting } from "./chatWidthSetting.lynx";
import { ThemePackEditor } from "./ThemePackEditor.lynx";
import "./settings-appearance-panel.css";

/** Upstream ThemeModePicker's `THEME_MODE_CHOICES`, in its order. */
const THEME_MODE_CHOICES: ReadonlyArray<{ readonly value: ThemeMode; readonly label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * Upstream ThemeModePicker's `MOCKUP_COLORS`: a fixed grayscale rendering of each
 * appearance, deliberately independent of the active theme pack.
 */
const MOCKUP_COLORS: Record<
  ThemeVariant,
  {
    readonly backdrop: string;
    readonly panel: string;
    readonly headerBar: string;
    readonly headerBarSoft: string;
    readonly card: string;
    readonly rowBar: string;
  }
> = {
  light: {
    backdrop: "#e9e9e9",
    panel: "#f6f6f6",
    headerBar: "#cfcfcf",
    headerBarSoft: "#e0e0e0",
    card: "#ffffff",
    rowBar: "#e3e3e3",
  },
  dark: {
    backdrop: "#5f5f5f",
    panel: "#2c2c2c",
    headerBar: "#a6a6a6",
    headerBarSoft: "#7d7d7d",
    card: "#3a3a3a",
    rowBar: "#707070",
  },
};

function ThemeModeMockupHalf(props: { readonly variant: ThemeVariant }) {
  const colors = MOCKUP_COLORS[props.variant];
  return (
    <view className="SettingsThemeModeMockupHalf" style={{ backgroundColor: colors.backdrop }}>
      <view className="SettingsThemeModeMockupPanel" style={{ backgroundColor: colors.panel }}>
        <view
          className="SettingsThemeModeMockupBar"
          style={{ backgroundColor: colors.headerBar }}
        />
        <view
          className="SettingsThemeModeMockupBar SettingsThemeModeMockupBar--soft"
          style={{ backgroundColor: colors.headerBarSoft }}
        />
        <view className="SettingsThemeModeMockupCard" style={{ backgroundColor: colors.card }}>
          {[0, 1, 2].map((row) => (
            <view
              key={row}
              className="SettingsThemeModeMockupRow"
              style={{ backgroundColor: colors.rowBar }}
            />
          ))}
        </view>
      </view>
    </view>
  );
}

function ThemeModeOption(props: {
  readonly choice: (typeof THEME_MODE_CHOICES)[number];
  readonly active: boolean;
  readonly onSelect: () => void;
}) {
  // "<group>: <option>", the form Native's segmented radios have always announced.
  const label = `Theme preference: ${props.choice.label}`;
  const interaction = useLynxInteractiveState({
    baseClassName: `SettingsThemeModeOption${props.active ? " SettingsThemeModeOption--active" : ""}`,
    accessibleLabel: label,
    accessibilityValue: props.active ? "Selected" : undefined,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-label={label}
      aria-checked={props.active}
      {...interaction.eventProps}
    >
      <view className="SettingsThemeModeFrame">
        <view className="SettingsThemeModeMockup">
          {props.choice.value === "system" ? (
            <>
              <ThemeModeMockupHalf variant="light" />
              <ThemeModeMockupHalf variant="dark" />
            </>
          ) : (
            <ThemeModeMockupHalf variant={props.choice.value} />
          )}
        </view>
      </view>
      <text className="SettingsThemeModeLabel">{props.choice.label}</text>
    </view>
  );
}

function ThemeSectionResetButton(props: { readonly onReset: () => void }) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedSettingsAppearanceReset SettingsThemeSectionReset",
    accessibleLabel: "Reset theme to default",
    onActivate: props.onReset,
  });
  return (
    <view
      className={interaction.className}
      aria-label="Reset theme to default"
      {...interaction.eventProps}
    >
      <SettingsResetIcon />
    </view>
  );
}

export function SettingsAppearancePanel(props: {
  readonly values: SettingsAppearanceValues;
  readonly defaults: SettingsAppearanceValues;
  readonly resolvedTheme: ThemeVariant;
  readonly themeState: ThemeState;
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly onChange: <Key extends SettingsAppearanceKey>(
    key: Key,
    value: SettingsAppearanceValues[Key],
  ) => void;
}) {
  const { values, defaults, themeState } = props;
  const chatWidth = useChatWidthSetting();
  const changeChatWidth = (mode: ChatWidthMode) => {
    "background only";
    void setChatWidthSetting(mode).catch(() => {
      toastManager.add({
        type: "error",
        title: "Changes could not be saved. Your current values are still shown.",
      });
    });
  };
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
      changed={values[key] !== defaults[key]}
      onReset={() => props.onChange(key, defaults[key] as SettingsAppearanceValues[typeof key])}
    >
      {control}
    </SettingsAppearanceRowElement>
  );

  return (
    <SettingsAppearanceRootElement>
      <view className="SharedSettingsAppearanceSection SettingsThemeSection">
        <view className="SettingsThemeSectionHeader">
          <SettingsHeadingElement className="SharedSettingsAppearanceSectionTitle SettingsThemeSectionTitle">
            Theme
          </SettingsHeadingElement>
          {values.themeMode !== "system" ? (
            <ThemeSectionResetButton onReset={() => props.onChange("themeMode", "system")} />
          ) : null}
        </view>
        <view
          className="SettingsThemeModePicker"
          accessibility-element={true}
          accessibility-label="Theme preference"
          accessibility-trait="none"
        >
          {THEME_MODE_CHOICES.map((choice) => (
            <ThemeModeOption
              key={choice.value}
              choice={choice}
              active={choice.value === values.themeMode}
              onSelect={() => props.onChange("themeMode", choice.value)}
            />
          ))}
        </view>
        <SettingsAppearanceThemePacksElement>
          {(props.resolvedTheme === "dark"
            ? (["dark", "light"] as const)
            : (["light", "dark"] as const)
          ).map((variant) => {
            const pack = resolveThemePack(themeState, variant);
            const defaultPack = resolveThemePack(DEFAULT_THEME_STATE, variant);
            return (
              <ThemePackEditor
                key={variant}
                variant={variant}
                isActive={props.resolvedTheme === variant}
                mode={values.themeMode}
                pack={pack}
                defaultPack={defaultPack}
                isPristine={areThemePacksEqual(pack, defaultPack)}
                systemUiFont={themeState.systemUiFont}
                translucency={themeState.translucency[variant]}
                shareString={createThemeShareString(variant, pack)}
                onImport={(value) =>
                  props.onThemeStateChange(
                    updateThemePackFromShareString(themeState, value, variant),
                  )
                }
                onResetVariant={() =>
                  props.onThemeStateChange(resetThemeVariant(themeState, variant))
                }
                onUseVariant={() => props.onChange("themeMode", variant)}
                onSetCodeThemeId={(codeThemeId) =>
                  props.onThemeStateChange(setThemeCodeThemeId(themeState, variant, codeThemeId))
                }
                onUpdateTheme={(patch) =>
                  props.onThemeStateChange(updateChromeTheme(themeState, variant, patch))
                }
                onUpdateFonts={(patch) =>
                  props.onThemeStateChange(setThemeFonts(themeState, variant, patch))
                }
                onUpdateTranslucency={(patch) =>
                  props.onThemeStateChange(setWindowTranslucency(themeState, variant, patch))
                }
              />
            );
          })}
        </SettingsAppearanceThemePacksElement>
      </view>

      <SettingsAppearanceSectionElement title="Typography and spacing">
        <SettingsAppearanceCardElement>
          {row(
            "systemUiFont",
            "Use system UI font",
            "Ignore the theme's custom UI font and render the interface with the native system font (SF Pro on macOS).",
            <SettingsAppearanceBooleanControlElement
              checked={values.systemUiFont}
              ariaLabel="Use system UI font"
              onChange={(checked) => props.onChange("systemUiFont", checked)}
            />,
          )}
          {row(
            "uiDensity",
            "UI density",
            "Control spacing in the sidebar, composer, chat gutters, and settings rows without changing font size.",
            <SettingsAppearanceSegmentedControlElement
              value={values.uiDensity}
              ariaLabel="UI density"
              options={SETTINGS_DENSITY_OPTIONS}
              onChange={(value) =>
                props.onChange("uiDensity", value as SettingsAppearanceValues["uiDensity"])
              }
            />,
          )}
          <SettingsAppearanceRowElement
            title="Chat width"
            description="Control how wide the chat column grows. Wide and Full give tables and wide content more room."
            resetLabel="chat width"
            changed={chatWidth !== DEFAULT_CHAT_WIDTH}
            onReset={() => changeChatWidth(DEFAULT_CHAT_WIDTH)}
          >
            <SettingsAppearanceSegmentedControlElement
              value={chatWidth}
              ariaLabel="Chat width"
              options={CHAT_WIDTH_OPTIONS}
              onChange={(value) => {
                if (isChatWidthMode(value)) changeChatWidth(value);
              }}
            />
          </SettingsAppearanceRowElement>
          {row(
            "chatFontSizePx",
            "Base font size",
            "Adjust the app text base in pixels. Chat and UI typography scale proportionally from this value.",
            <SettingsAppearanceNumberControlElement
              value={values.chatFontSizePx}
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
              value={values.terminalFontSizePx}
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
              value={values.terminalFontFamily}
              placeholder="Default (JetBrains Mono)"
              ariaLabel="Terminal font family"
              onChange={(value) => props.onChange("terminalFontFamily", value)}
            />,
            true,
          )}
        </SettingsAppearanceCardElement>
      </SettingsAppearanceSectionElement>
    </SettingsAppearanceRootElement>
  );
}
