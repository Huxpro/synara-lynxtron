// FILE: ThemePackEditor.lynx.tsx
// Purpose: Lynx rendering of upstream's components/ThemePackEditor.tsx for one variant:
//   header (title, Reset, Import, Copy), context line, the pack preview, the color, font
//   and window rows, and Contrast, in upstream's order.
// Layer: Lynx presentation. Labels and the context line come from the shared editor model;
//   every edit is one of upstream's theme.logic reducers, applied by the settings page.
// Lynx differences:
//   - The preview's colors are resolved in JS (`buildResolvedThemeTokens`): Lynx does not
//     apply custom properties set on an element's `style`, so upstream's variables scoped
//     to the preview box cannot paint it.
//   - The code theme select is hidden: Native's highlighter has fixed GitHub themes.
//   - Window material and its translucency rows edit the theme state Electron shares, and
//     say that Lynxtron windows do not render it.

import { DESKTOP_WINDOW_BLUR_RADIUS_MAX, DESKTOP_WINDOW_BLUR_RADIUS_MIN } from "@synara/contracts";
import { resolveThemePackEditorModel } from "@synara-web/components/settings/ThemePackEditorComposition.logic";
import {
  VIBRANCY_EQUIVALENT_BLUR_RADIUS,
  WINDOW_TRANSLUCENCY_OPACITY_MIN,
  buildResolvedThemeTokens,
  type ChromeTheme,
  type ThemeFonts,
  type ThemeMode,
  type ThemePack,
  type ThemeVariant,
  type WindowTranslucency,
} from "@synara-web/theme/theme.logic";

import { SettingsAppearanceSegmentedControlElement } from "../adapters/SettingsAppearanceCompositionElements.lynx";
import {
  ThemePackBooleanControlElement,
  ThemePackColorControlElement,
  ThemePackContextElement,
  ThemePackContrastControlElement,
  ThemePackCopyActionElement,
  ThemePackFontControlElement,
  ThemePackHeaderElement,
  ThemePackImportActionElement,
  ThemePackResetActionElement,
  ThemePackRootElement,
  ThemePackRowElement,
  ThemePackTitleElement,
} from "../adapters/ThemePackEditorCompositionElements.lynx";
import { Button } from "../components/ui/button";

/** Upstream ThemePackEditor's `WINDOW_MATERIAL_OPTIONS`. */
const WINDOW_MATERIAL_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "translucent", label: "Translucent" },
] as const;

export const WINDOW_TRANSLUCENCY_UNAVAILABLE_COPY =
  "Window translucency is not available in the Native app yet. These settings are saved and apply in the Electron app.";

export function ThemePackEditor(props: {
  readonly variant: ThemeVariant;
  readonly isActive: boolean;
  readonly mode: ThemeMode;
  readonly pack: ThemePack;
  readonly defaultPack: ThemePack;
  readonly isPristine: boolean;
  readonly systemUiFont: boolean;
  readonly translucency: WindowTranslucency;
  readonly shareString: string;
  readonly onImport: (value: string) => void;
  readonly onResetVariant: () => void;
  readonly onUseVariant: () => void;
  readonly onUpdateTheme: (patch: Partial<ChromeTheme>) => void;
  readonly onUpdateFonts: (patch: Partial<ThemeFonts>) => void;
  readonly onUpdateTranslucency: (patch: Partial<WindowTranslucency>) => void;
}) {
  const model = resolveThemePackEditorModel(props);
  const { theme } = props.pack;
  const defaultTheme = props.defaultPack.theme;
  const { translucency } = props;
  const preview = buildResolvedThemeTokens(props.pack, props.variant).codexVariables;
  const title = model.titleLabel;

  return (
    <ThemePackRootElement>
      <ThemePackHeaderElement>
        <ThemePackTitleElement title={title}>
          {!props.isPristine ? (
            <ThemePackResetActionElement onReset={props.onResetVariant} />
          ) : null}
        </ThemePackTitleElement>
        <ThemePackImportActionElement variant={props.variant} onImport={props.onImport} />
        <ThemePackCopyActionElement variant={props.variant} shareString={props.shareString} />
      </ThemePackHeaderElement>

      <view className="SharedThemePackContextRow">
        <ThemePackContextElement>{model.contextLabel}</ThemePackContextElement>
        {!props.isActive ? (
          <Button variant="outline" size="xs" onClick={props.onUseVariant}>
            Use {props.variant} theme
          </Button>
        ) : null}
      </view>

      <view className="SharedThemePackPreviewRow">
        <view
          className="SharedThemePackPreview"
          accessibility-element={true}
          accessibility-label={`${title} preview: ${model.codeThemeLabel}`}
          accessibility-trait="image"
          style={{
            backgroundColor: preview["--color-background-surface"],
            borderColor: preview["--color-border"],
          }}
        >
          <text
            className="SharedThemePackPreviewTitle"
            style={{ color: preview["--color-text-foreground"] }}
          >
            {model.codeThemeLabel}
          </text>
          <view
            className="SharedThemePackPreviewAccent"
            style={{ backgroundColor: preview["--color-background-accent"] }}
          >
            <text
              className="SharedThemePackPreviewAccentText"
              style={{ color: preview["--color-text-accent"] }}
            >
              Accent preview
            </text>
          </view>
        </view>
      </view>

      <ThemePackRowElement label="Accent">
        <ThemePackColorControlElement
          color={theme.accent}
          ariaLabel={`${title} accent color`}
          onChange={(accent) => props.onUpdateTheme({ accent })}
          onReset={
            theme.accent !== defaultTheme.accent
              ? () => props.onUpdateTheme({ accent: defaultTheme.accent })
              : undefined
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="Background">
        <ThemePackColorControlElement
          color={theme.surface}
          ariaLabel={`${title} background color`}
          onChange={(surface) => props.onUpdateTheme({ surface })}
          onReset={
            theme.surface !== defaultTheme.surface
              ? () => props.onUpdateTheme({ surface: defaultTheme.surface })
              : undefined
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="Foreground">
        <ThemePackColorControlElement
          color={theme.ink}
          ariaLabel={`${title} foreground color`}
          onChange={(ink) => props.onUpdateTheme({ ink })}
          onReset={
            theme.ink !== defaultTheme.ink
              ? () => props.onUpdateTheme({ ink: defaultTheme.ink })
              : undefined
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="UI font">
        <view className="SharedThemePackFontColumn">
          <ThemePackFontControlElement
            value={theme.fonts.ui ?? ""}
            placeholder="System default"
            ariaLabel={`${title} UI font`}
            onChange={(ui) => props.onUpdateFonts({ ui: ui.length > 0 ? ui : null })}
          />
          {props.systemUiFont ? (
            <text className="SharedThemePackFontNote">
              Use system UI font is on; theme fonts are not applied.
            </text>
          ) : null}
        </view>
      </ThemePackRowElement>
      <ThemePackRowElement label="Code font">
        <ThemePackFontControlElement
          value={theme.fonts.code ?? ""}
          placeholder='"JetBrains Mono"'
          ariaLabel={`${title} code font`}
          mono
          onChange={(code) => props.onUpdateFonts({ code: code.length > 0 ? code : null })}
        />
      </ThemePackRowElement>

      <ThemePackRowElement label="Window">
        <view
          className="SharedThemePackWindowMaterial"
          accessibility-element={true}
          accessibility-label={`${title} window material`}
          accessibility-trait="none"
        >
          <SettingsAppearanceSegmentedControlElement
            value={theme.opaqueWindows ? "solid" : "translucent"}
            ariaLabel={`${title} window material`}
            options={WINDOW_MATERIAL_OPTIONS}
            onChange={(value) => props.onUpdateTheme({ opaqueWindows: value === "solid" })}
          />
        </view>
      </ThemePackRowElement>
      {theme.opaqueWindows ? null : (
        <>
          <ThemePackRowElement label="Sidebar only">
            <ThemePackBooleanControlElement
              checked={translucency.sidebarOnly}
              ariaLabel={`${title} translucent sidebar only`}
              onChange={(sidebarOnly) => props.onUpdateTranslucency({ sidebarOnly })}
            />
          </ThemePackRowElement>
          <ThemePackRowElement label="Opacity">
            <ThemePackContrastControlElement
              value={translucency.opacity}
              min={WINDOW_TRANSLUCENCY_OPACITY_MIN}
              max={100}
              suffix="%"
              ariaLabel={`${title} translucency opacity`}
              onChange={(opacity) => props.onUpdateTranslucency({ opacity })}
            />
          </ThemePackRowElement>
          <ThemePackRowElement label="Blur">
            {translucency.blur !== null ? (
              <Button
                variant="outline"
                size="xs"
                aria-label={`${title} automatic background blur`}
                onClick={() => props.onUpdateTranslucency({ blur: null })}
              >
                Auto
              </Button>
            ) : null}
            <ThemePackContrastControlElement
              value={translucency.blur ?? VIBRANCY_EQUIVALENT_BLUR_RADIUS}
              {...(translucency.blur === null ? { valueLabel: "Auto" } : {})}
              min={DESKTOP_WINDOW_BLUR_RADIUS_MIN}
              max={DESKTOP_WINDOW_BLUR_RADIUS_MAX}
              ariaLabel={`${title} background blur`}
              onChange={(blur) => props.onUpdateTranslucency({ blur })}
            />
          </ThemePackRowElement>
          <text className="SharedThemePackUnavailableNote">
            {WINDOW_TRANSLUCENCY_UNAVAILABLE_COPY}
          </text>
        </>
      )}

      <ThemePackRowElement label="Contrast">
        <ThemePackContrastControlElement
          value={theme.contrast}
          ariaLabel={`${title} contrast`}
          onChange={(contrast) => props.onUpdateTheme({ contrast })}
        />
      </ThemePackRowElement>
    </ThemePackRootElement>
  );
}
