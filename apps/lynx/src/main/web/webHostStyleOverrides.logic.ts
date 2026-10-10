// Lynx-for-Web host: style overrides for where a browser tab is not the desktop host.
//
// The shared Lynx stylesheets are tuned so the Native build lands on Electron's pixels.
// Two kinds of that tuning are wrong in a browser tab, and are undone here, for this host
// only, instead of in the shared CSS (the Native build is the product and is measured):
//
// - "chrome": the macOS window chrome. Native reserves the traffic-light gutter and shows
//   the history pair, as upstream does under Electron. In a browser upstream has neither
//   (`isElectron` in apps/web SidebarHeaderNavigationControls.tsx), so the leading
//   controls start at the window edge.
// - "text-metrics": corrections for the Native text engine, which lays a text run out
//   about 1.3px wider than Chromium and rounds a text box up to whole pixels. Chromium
//   renders this host's text, so each correction is returned to upstream's value.
//
// web-core compiles every bundle rule as `<selector>:not([l-e-name])`, which outranks a
// plain selector injected later, so overrides are emitted `!important`.
//
// Each entry names the shared stylesheet it overrides; the test fails when that file no
// longer contains the selector, so an override cannot outlive what it neutralizes.

export interface WebHostStyleOverride {
  readonly kind: "chrome" | "text-metrics";
  /** Shared stylesheet (relative to apps/lynx/src) whose rule this overrides. */
  readonly source: string;
  /** Selectors of the shared rule, as written there; the override uses the same ones. */
  readonly selectors: readonly string[];
  /** Ancestor the override is limited to, where the shared rule has no such limit. */
  readonly within?: string;
  readonly declarations: Readonly<Record<string, string>>;
  readonly reason: string;
}

export const WEB_HOST_STYLE_OVERRIDES: readonly WebHostStyleOverride[] = [
  {
    kind: "chrome",
    source: "adapters/desktop-titlebar-controls.css",
    selectors: [".DesktopTitlebarControls--open"],
    declarations: { "margin-left": "2px" },
    reason:
      "Native: 76px clears the traffic lights (toggle at x=90). Browser: upstream's toggle is at x=16, 2px past the strip's 14px padding.",
  },
  {
    kind: "chrome",
    source: "adapters/desktop-titlebar-controls.css",
    selectors: [".DesktopTitlebarControls--open"],
    within: ".SharedAppShellFrame:has(.AppMain--sidebar-closed)",
    declarations: { "margin-left": "57px" },
    reason:
      "Panel collapsed: upstream's toggle sits in the route header at x=71 (51px rail + 20px header padding).",
  },
  {
    kind: "chrome",
    source: "adapters/desktop-titlebar-controls.css",
    selectors: [".DesktopTitlebarControls--closed"],
    declarations: { left: "71px" },
    reason: "Native: 90px traffic-light gutter. Browser: 51px rail + 20px header padding.",
  },
  {
    kind: "chrome",
    source: "adapters/desktop-titlebar-controls.css",
    selectors: [".DesktopTitlebarControl--navigation"],
    declarations: { display: "none" },
    reason:
      "Upstream shows Back and Forward only under Electron; a browser tab has its own history buttons.",
  },
  {
    kind: "chrome",
    source: "app/App.css",
    selectors: [
      ".AppMain--sidebar-closed .AppWindowDragRegion--padded",
      ".AppMain--sidebar-closed .SharedKanbanRouteHeader",
    ],
    declarations: { "padding-left": "56px" },
    reason:
      "Native: 135px clears the gutter and the three leading controls. Browser: 20px header padding + the 24px toggle + the 12px gap.",
  },
  {
    kind: "text-metrics",
    source: "app/automations-page.css",
    selectors: [
      ".AutomationCreateFooterActions .LxButton__text",
      ".AutomationCreateTemplateButton .LxButton__text",
    ],
    declarations: { "margin-right": "0" },
    reason: "Native trims 1px off its wider text run.",
  },
  {
    kind: "text-metrics",
    source: "adapters/theme-pack-editor-composition-elements.css",
    selectors: [".SharedThemePackWindowMaterial .SharedSettingsAppearanceSegment--text-only"],
    declarations: { "padding-left": "9px", "padding-right": "9px" },
    reason: "Native takes half a pixel per side off upstream's 9px for its wider labels.",
  },
  {
    kind: "text-metrics",
    source: "components/composer/composer-model-picker.css",
    selectors: [".ComposerModelPickerKbdTextLynx"],
    declarations: { "margin-right": "0" },
    reason: "Native trims 1px off each of the capsule's two text runs.",
  },
  {
    kind: "text-metrics",
    source: "components/composer/composer-model-picker.css",
    selectors: [
      ".ComposerModelTriggerLynx--menu .ComposerModelTriggerLabelLynx",
      ".ComposerModelTriggerLynx--menu .ComposerModelTriggerMetaLynx",
    ],
    declarations: { "margin-right": "0" },
    reason: "Native trims 1px off each of the trigger's two text runs.",
  },
  {
    kind: "text-metrics",
    source: "components/composer/composer.css",
    selectors: [".ComposerTraitsTriggerLabelLynx"],
    declarations: { "margin-right": "0" },
    reason: "Native trims 1px off its wider text run.",
  },
  {
    kind: "text-metrics",
    source: "adapters/kanban-route-header-composition-elements.css",
    selectors: [".SharedKanbanRouteViewSegmentText"],
    declarations: { "margin-right": "0" },
    reason: "Native trims 1px off its wider text run.",
  },
  {
    kind: "text-metrics",
    source: "adapters/settings-general-composition-elements.css",
    selectors: [".SharedSettingsGeneralRowDescription"],
    declarations: { "margin-top": "2px" },
    reason:
      "Native rounds the 39px two-line description up to 40px and uses 1px; Chromium keeps 39px, so upstream's 2px gap applies.",
  },
];

/** One CSS rule per override, for `<lynx-view>.injectStyleRules`. */
export function webHostStyleOverrideRules(
  overrides: readonly WebHostStyleOverride[] = WEB_HOST_STYLE_OVERRIDES,
): string[] {
  return overrides.map((override) => {
    const selectors = override.selectors
      .map((selector) => (override.within ? `${override.within} ${selector}` : selector))
      .join(", ");
    const declarations = Object.entries(override.declarations)
      .map(([property, value]) => `${property}: ${value} !important;`)
      .join(" ");
    return `${selectors} { ${declarations} }`;
  });
}
