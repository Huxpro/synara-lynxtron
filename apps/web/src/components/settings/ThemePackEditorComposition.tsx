// FILE: ThemePackEditorComposition.tsx
// Purpose: Physical-shared theme-pack editor anatomy and action ordering.

import {
  ThemePackBooleanControlElement,
  ThemePackCodeThemeControlElement,
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
} from "~/components/settings/ThemePackEditorCompositionElements";
import {
  resolveThemePackEditorModel,
} from "./ThemePackEditorComposition.logic";
import type {
  ChromeTheme,
  ThemeFonts,
  ThemeMode,
  ThemePack,
  ThemeVariant,
} from "../../theme/theme.logic";

export type ThemePackEditorCompositionProps = {
  readonly showCodeThemeSelection: boolean;
  readonly variant: ThemeVariant;
  readonly isActive: boolean;
  readonly mode: ThemeMode;
  readonly pack: ThemePack;
  readonly defaultPack: ThemePack;
  readonly isPristine: boolean;
  readonly shareString: string;
  readonly onImport: (value: string) => void;
  readonly onResetVariant: () => void;
  readonly onSetCodeThemeId: (value: string) => void;
  readonly onUpdateTheme: (patch: Partial<ChromeTheme>) => void;
  readonly onUpdateFonts: (patch: Partial<ThemeFonts>) => void;
};

export function ThemePackEditorComposition(
  props: ThemePackEditorCompositionProps,
) {
  const model = resolveThemePackEditorModel(props);
  const { theme } = props.pack;
  const defaultTheme = props.defaultPack.theme;

  return (
    <ThemePackRootElement>
      <ThemePackHeaderElement>
        <ThemePackTitleElement title={model.titleLabel}>
          {!props.isPristine ? (
            <ThemePackResetActionElement onReset={props.onResetVariant} />
          ) : null}
        </ThemePackTitleElement>
        <ThemePackImportActionElement
          variant={props.variant}
          onImport={props.onImport}
        />
        <ThemePackCopyActionElement
          variant={props.variant}
          shareString={props.shareString}
        />
        {props.showCodeThemeSelection ? (
          <ThemePackCodeThemeControlElement
            ariaLabel={`${model.titleLabel} code theme`}
            value={props.pack.codeThemeId}
            label={model.codeThemeLabel}
            theme={theme}
            options={model.codeThemes}
            onChange={props.onSetCodeThemeId}
          />
        ) : null}
      </ThemePackHeaderElement>

      <ThemePackContextElement>{model.contextLabel}</ThemePackContextElement>

      <ThemePackRowElement label="Accent">
        <ThemePackColorControlElement
          color={theme.accent}
          ariaLabel={`${model.titleLabel} accent color`}
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
          ariaLabel={`${model.titleLabel} background color`}
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
          ariaLabel={`${model.titleLabel} foreground color`}
          onChange={(ink) => props.onUpdateTheme({ ink })}
          onReset={
            theme.ink !== defaultTheme.ink
              ? () => props.onUpdateTheme({ ink: defaultTheme.ink })
              : undefined
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="UI font">
        <ThemePackFontControlElement
          value={theme.fonts.ui ?? ""}
          placeholder="System default"
          ariaLabel={`${model.titleLabel} UI font`}
          onChange={(ui) =>
            props.onUpdateFonts({ ui: ui.length > 0 ? ui : null })
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="Code font">
        <ThemePackFontControlElement
          value={theme.fonts.code ?? ""}
          placeholder='"JetBrains Mono"'
          ariaLabel={`${model.titleLabel} code font`}
          mono
          onChange={(code) =>
            props.onUpdateFonts({ code: code.length > 0 ? code : null })
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="Translucent sidebar">
        <ThemePackBooleanControlElement
          checked={!theme.opaqueWindows}
          ariaLabel={`${model.titleLabel} translucent sidebar`}
          onChange={(checked) =>
            props.onUpdateTheme({ opaqueWindows: !checked })
          }
        />
      </ThemePackRowElement>
      <ThemePackRowElement label="Contrast">
        <ThemePackContrastControlElement
          value={theme.contrast}
          ariaLabel={`${model.titleLabel} contrast`}
          onChange={(contrast) => props.onUpdateTheme({ contrast })}
        />
      </ThemePackRowElement>
    </ThemePackRootElement>
  );
}
