import { normalizeChatFontSizePx } from "@synara-web/chatFontSize";
import {
  appTypographyCssVariables,
  getAppTypographyScale,
  type AppTypographyScale,
} from "@synara-web/lib/appTypography";

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
 * Line heights that follow the UI font size: `[step, line height at the default size]`.
 *
 * A stylesheet writes `line-height: var(--app-line-height-<step>-<px>, <px>px)` next to
 * `font-size: var(--app-font-size-<step>, …)`. The root map gives the variable the same
 * multiple of the step at the chosen size, so the default size renders the literal (today's
 * geometry) and other sizes keep the proportion, as upstream's unitless line heights do.
 * The variable is concrete because a unitless value inherits differently on Lynx.
 * `uiFontSize.lynx.test.ts` keeps this table and the stylesheets in step.
 */
export const APP_LINE_HEIGHT_ROLES = [
  ["ui", 17.875],
  ["ui", 18],
  ["ui", 19.5],
  ["ui", 20],
  ["ui", 21.125],
  ["ui-2xs", 12],
  ["ui-2xs", 15],
  ["ui-lg", 19.25],
  ["ui-lg", 20],
  ["ui-lg", 21],
  ["ui-lg", 22.75],
  ["ui-sm", 16.5],
  ["ui-sm", 18],
  ["ui-sm", 19.5],
  ["ui-timestamp", 13.5],
  ["ui-xs", 15.125],
  ["ui-xs", 16.5],
  ["ui-xs", 17.875],
] as const satisfies readonly (readonly [AppLineHeightStep, number])[];

export type AppLineHeightStep = "ui" | "ui-lg" | "ui-sm" | "ui-xs" | "ui-2xs" | "ui-timestamp";

const stepPx = (scale: AppTypographyScale, step: AppLineHeightStep): number =>
  ({
    ui: scale.uiPx,
    "ui-lg": scale.uiLgPx,
    "ui-sm": scale.uiSmPx,
    "ui-xs": scale.uiXsPx,
    "ui-2xs": scale.ui2XsPx,
    "ui-timestamp": scale.uiTimestampPx,
  })[step];

/** `--app-line-height-ui-sm-16p5` for `["ui-sm", 16.5]`. */
export function appLineHeightVariableName(step: AppLineHeightStep, defaultPx: number): string {
  return `--app-line-height-${step}-${String(defaultPx).replace(".", "p")}`;
}

// Whole thousandths: the products are exact at the default size and short elsewhere.
const scaledPx = (value: number): string => px(Math.round(value * 1000) / 1000);

function resolveAppLineHeightVariables(scale: AppTypographyScale): Record<string, string> {
  const defaults = getAppTypographyScale();
  return Object.fromEntries(
    APP_LINE_HEIGHT_ROLES.map(([step, defaultPx]) => [
      appLineHeightVariableName(step, defaultPx),
      scaledPx((defaultPx * stepPx(scale, step)) / stepPx(defaults, step)),
    ]),
  );
}

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
  const defaults = getAppTypographyScale();
  return {
    ...appTypographyCssVariables(size, terminalFontSizePx),
    ...resolveAppLineHeightVariables(scale),
    // tokens.css gives these roles 18 / 16 / 15px line boxes; at the default size the
    // values below are those literals, and they keep the proportion at other sizes.
    "--type-ui-row-size": px(scale.uiSmPx),
    "--type-ui-row-line-height": scaledPx((18 * scale.uiSmPx) / defaults.uiSmPx),
    "--type-ui-supporting-size": px(scale.uiXsPx),
    "--type-ui-supporting-line-height": scaledPx((16 * scale.uiXsPx) / defaults.uiXsPx),
    "--type-ui-meta-size": px(scale.ui2XsPx),
    "--type-ui-meta-line-height": scaledPx((15 * scale.ui2XsPx) / defaults.ui2XsPx),
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
