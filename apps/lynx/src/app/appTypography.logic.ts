import { normalizeChatFontSizePx } from "@synara-web/chatFontSize";
import { appTypographyCssVariables, getAppTypographyScale } from "@synara-web/lib/appTypography";

export const SLICE_TYPOGRAPHY_CLASS_PREFIX = "SliceRoot--font";

/**
 * First-paint fallback: one generated class per base size carrying the web typography
 * variables (src/generated/native-typography-variables.css). The root inline map from
 * `resolveSliceTypographyVariables` carries the same values and wins once it is applied.
 */
export function sliceTypographyClassName(chatFontSizePx: unknown): string {
  const size = normalizeChatFontSizePx(typeof chatFontSizePx === "number" ? chatFontSizePx : null);
  return `${SLICE_TYPOGRAPHY_CLASS_PREFIX}-${size}`;
}

const px = (value: number): string => `${value}px`;

/**
 * The typography variables for the root inline map, all concrete.
 *
 * `--app-font-size-*` is upstream's scale (`useAppTypography` sets the same names on the
 * document root). The `--type-*` roles are aliases of that scale in tokens.css
 * (`--type-ui-row-size: var(--app-font-size-ui, …)`); Lynx does not resolve a custom
 * property whose value is another `var()`, so each role is resolved here instead of being
 * restated as a literal in App.css. Each role keeps the step it rendered at before it
 * followed the setting (the default size produces the same geometry), and a line height
 * that was a multiple of its font size stays that multiple.
 */
export function resolveSliceTypographyVariables(
  chatFontSizePx: unknown,
  terminalFontSizePx: number,
): Record<string, string> {
  const size = normalizeChatFontSizePx(typeof chatFontSizePx === "number" ? chatFontSizePx : null);
  const scale = getAppTypographyScale(size);
  return {
    ...appTypographyCssVariables(size, terminalFontSizePx),
    "--type-ui-row-size": px(scale.uiSmPx),
    "--type-ui-supporting-size": px(scale.uiXsPx),
    "--type-ui-meta-size": px(scale.ui2XsPx),
    "--type-composer-editor-size": px(scale.uiSmPx),
    // Upstream: settings rows are `text-ui` on a 1.5 line box; the panel description is
    // `text-ui leading-relaxed` (1.625).
    "--type-settings-section-label-size": px(scale.uiPx),
    "--type-settings-section-label-line-height": px(scale.uiPx * 1.5),
    "--type-settings-row-title-size": px(scale.uiPx),
    "--type-settings-row-title-line-height": px(scale.uiPx * 1.5),
    "--type-settings-row-description-size": px(scale.uiPx),
    "--type-settings-row-description-line-height": px(scale.uiPx * 1.5),
    "--type-settings-header-description-size": px(scale.uiPx),
    "--type-settings-header-description-line-height": px(scale.uiPx * 1.625),
  };
}
